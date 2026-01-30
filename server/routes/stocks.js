import express from 'express';
import mongoose from 'mongoose';
import Stock from '../models/Stock.js';
import Question from '../models/Question.js';
import Prediction from '../models/Prediction.js';
import yahooFinance from 'yahoo-finance2';

const router = express.Router();

// Simple in-memory cache
let stocksCache = {
    data: null,
    lastUpdated: 0,
    ttl: 60 * 1000 // 60 seconds
};

// Mock Data
// @route   GET /api/stocks
// @desc    Get all stocks
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        // Return cached data if available and fresh (only for full list)
        if (!search && stocksCache.data && (Date.now() - stocksCache.lastUpdated < stocksCache.ttl)) {
            return res.json(stocksCache.data);
        }

        let query = {};

        // 1. Local DB Search
        if (search) {
            query.$or = [
                { symbol: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        const localStocks = await Stock.find(query).sort({ symbol: 1 }).lean();

        // Auto-seed if empty and no search
        if (!search && localStocks.length === 0) {
            console.log('No stocks found in DB. Seeding popular stocks...');
            const POPULAR_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];

            try {
                const results = await Promise.all(
                    POPULAR_TICKERS.map(async (symbol) => {
                        try {
                            const quote = await yahooFinance.quote(symbol);
                            if (!quote) return null;

                            return Stock.findOneAndUpdate(
                                { symbol },
                                {
                                    $set: {
                                        name: quote.longName || quote.shortName || symbol,
                                        symbol,
                                        currentPrice: quote.regularMarketPrice,
                                        previousClose: quote.regularMarketPreviousClose,
                                        change: quote.regularMarketChange,
                                        changePercent: quote.regularMarketChangePercent,
                                        volume: quote.regularMarketVolume,
                                        marketCap: quote.marketCap,
                                        high24h: quote.regularMarketDayHigh,
                                        low24h: quote.regularMarketDayLow,
                                        sector: 'Technology' // Default/Placeholder as quote doesn't always have it
                                    }
                                },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            ).lean();
                        } catch (e) {
                            console.error(`Failed to seed ${symbol}:`, e.message);
                            return null;
                        }
                    })
                );

                const seededStocks = results.filter(Boolean);
                // Return immediately if specifically asking for list
                if (seededStocks.length > 0) {
                    return res.json(seededStocks.sort((a, b) => a.symbol.localeCompare(b.symbol)));
                }
            } catch (seedError) {
                console.error('Auto-seed failed:', seedError);
            }
        }

        // 2. Yahoo Finance Search (if search term exists)
        let yahooResults = [];
        if (search && search.length > 1) { // Avoid searching for single chars if performance is a concern
            try {
                const result = await yahooFinance.search(search);
                if (result.quotes) {
                    yahooResults = result.quotes
                        .filter(q => (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'MUTUALFUND')) // Filter relevant types
                        .map(q => ({
                            symbol: q.symbol,
                            name: q.shortname || q.longname || q.symbol,
                            currentPrice: 0, // Search specific endpoint usually doesn't give price, client handles this or fetches detail
                            previousClose: 0,
                            change: 0,
                            changePercent: 0,
                            // Flag to indicate this is a preview/remote result
                            isRemote: true
                        }));
                }
            } catch (err) {
                console.warn("Yahoo Search Error:", err.message);
            }
        }

        // 3. Merge Results
        // Create a map of existing symbols to avoid duplicates
        const stockMap = new Map();
        localStocks.forEach(s => stockMap.set(s.symbol, s));

        yahooResults.forEach(y => {
            if (!stockMap.has(y.symbol)) {
                stockMap.set(y.symbol, y);
            }
        });

        // Convert back to array
        const combinedStocks = Array.from(stockMap.values());

        // Sort: Exact matches first, then DB results, then Yahoo results
        // Simple sort by symbol for now
        combinedStocks.sort((a, b) => a.symbol.localeCompare(b.symbol));

        // Update cache if this was a full list fetch
        if (!search) {
            stocksCache = {
                data: combinedStocks,
                lastUpdated: Date.now(),
                ttl: 60 * 1000
            };
        }

        res.json(combinedStocks);
    } catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({ message: 'Error fetching stocks' });
    }
});

// @route   GET /api/stocks/:symbol
// @desc    Get stock by symbol (Active Lookup)
// @access  Public
router.get('/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();

        let stock = await Stock.findOne({ symbol });
        let quote = null;

        // 1. Try to fetch real-time data from Yahoo Finance
        try {
            quote = await yahooFinance.quote(symbol);
        } catch (yahooError) {
            console.warn(`Yahoo Finance quote failed for ${symbol}:`, yahooError.message);
        }

        let profile = {};
        try {
            const summary = await yahooFinance.quoteSummary(symbol, { modules: ['summaryProfile', 'summaryDetail', 'defaultKeyStatistics'] });
            if (summary) {
                profile = {
                    description: summary.summaryProfile?.longBusinessSummary,
                    industry: summary.summaryProfile?.industry,
                    website: summary.summaryProfile?.website,
                    dividendYield: summary.summaryDetail?.dividendYield,
                    peRatio: summary.summaryDetail?.trailingPE,
                    beta: summary.defaultKeyStatistics?.beta
                };
            }
        } catch (e) {
            console.warn(`Yahoo Finance profile failed for ${symbol}:`, e.message);
        }

        // 2. If valid quote, Upsert into Database
        if (quote) {
            // Note: regularMarketPrice is standard, but check alternatives
            const currentPrice = quote.regularMarketPrice || quote.bid || stock?.currentPrice || 0;
            const previousClose = quote.regularMarketPreviousClose || stock?.previousClose || currentPrice;
            const name = quote.longName || quote.shortName || stock?.name || symbol;
            const sector = quote.sector || profile.sector || stock?.sector || "General";

            // Calculate change if missing
            const change = quote.regularMarketChange || (currentPrice - previousClose);
            const changePercent = quote.regularMarketChangePercent || (previousClose ? (change / previousClose) * 100 : 0);

            stock = await Stock.findOneAndUpdate(
                { symbol },
                {
                    $set: {
                        name,
                        symbol,
                        currentPrice,
                        previousClose,
                        change,
                        changePercent,
                        volume: quote.regularMarketVolume || stock?.volume || 0,
                        marketCap: quote.marketCap || stock?.marketCap || 0,
                        high24h: quote.regularMarketDayHigh || stock?.high24h || currentPrice,
                        low24h: quote.regularMarketDayLow || stock?.low24h || currentPrice,
                        sector,
                        // New Fields
                        peRatio: quote.trailingPE || profile.peRatio || stock?.peRatio || 0,
                        dividendYield: quote.dividendYield || profile.dividendYield || stock?.dividendYield || 0,
                        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || stock?.fiftyTwoWeekHigh || 0,
                        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || stock?.fiftyTwoWeekLow || 0,
                        description: profile.description || stock?.description || '',
                        industry: profile.industry || stock?.industry || 'General',
                        website: profile.website || stock?.website || ''
                    }
                },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        }

        // 3. If stock still doesn't exist (neither in DB nor valid in Yahoo), use Mock Fallback
        if (!stock) {
            console.log(`Generating mock data for ${symbol}`);
            const basePrice = Math.random() * 200 + 50;
            stock = await Stock.create({
                symbol,
                name: `${symbol} Inc. (Mock)`,
                currentPrice: basePrice,
                previousClose: basePrice * 0.98,
                sector: 'Technology',
                description: 'This is a mock description generated because the external data provider is unavailable.',
                industry: 'Mock Industry',
                volume: 1000000,
                marketCap: 2000000000000,
                high24h: basePrice * 1.05,
                low24h: basePrice * 0.95
            });
        }

        // 4. Get additional stats
        const questionCount = await Question.countDocuments({ stockId: stock._id });
        const predictionCount = await Prediction.countDocuments({ stockId: stock._id });

        res.json({
            ...stock.toObject(),
            stats: {
                questionCount,
                predictionCount
            }
        });

    } catch (error) {
        console.error('Stock Lookup Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/stocks/:symbol/trending
// @desc    Get trending questions for a stock
// @access  Public
router.get('/:symbol/trending', async (req, res) => {
    try {
        const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });

        if (!stock) {
            return res.status(404).json({ message: 'Stock not found' });
        }

        // Get trending questions (most views + answers in last 24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const trendingQuestions = await Question.find({
            stockId: stock._id,
            createdAt: { $gte: oneDayAgo }
        })
            .populate('userId', 'username reputation')
            .sort({ views: -1, answerCount: -1 })
            .limit(10);

        res.json(trendingQuestions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/stocks/:symbol/history
// @desc    Get historical price data for a stock
// @access  Public
router.get('/:symbol/history', async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const stock = await Stock.findOne({ symbol });

        let chartData = null;

        // 1. Try Yahoo Finance History
        try {
            const queryOptions = { period1: '1mo', interval: '1d' };
            chartData = await yahooFinance.chart(symbol, queryOptions);
        } catch (err) {
            console.warn(`Yahoo Chart failed for ${symbol}:`, err.message);
            // Fallback to mock data below
        }

        if (chartData && chartData.quotes && chartData.quotes.length > 0) {
            // Map Yahoo data to Lightweight Charts format
            const dataPoints = chartData.quotes.map(quote => ({
                time: quote.date.toISOString().split('T')[0],
                open: quote.open ? parseFloat(quote.open.toFixed(2)) : null,
                high: quote.high ? parseFloat(quote.high.toFixed(2)) : null,
                low: quote.low ? parseFloat(quote.low.toFixed(2)) : null,
                close: quote.close ? parseFloat(quote.close.toFixed(2)) : null,
                volume: quote.volume || 0
            })).filter(p => p.close !== null);

            return res.json(dataPoints);
        }

        // 2. Fallback: Deterministic Mock Data (Robustness)
        if (!stock) return res.status(404).json({ message: 'Stock not found' });

        const dataPoints = [];
        const now = new Date();
        const currentPrice = stock.currentPrice;
        const seedValue = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        let lastClose = currentPrice;

        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const daySeed = seedValue + i;

            // Random walk simulation
            const volatility = 0.02; // 2% daily volatility
            const changePercent = (Math.sin(daySeed * 0.8) * volatility) + (Math.cos(daySeed * 1.3) * volatility * 0.5);

            const open = lastClose;
            const close = open * (1 + changePercent);
            const high = Math.max(open, close) * (1 + (Math.abs(Math.sin(daySeed * 2)) * 0.01));
            const low = Math.min(open, close) * (1 - (Math.abs(Math.cos(daySeed * 2)) * 0.01));
            const volume = Math.floor(1000000 + (Math.sin(daySeed) * 500000)); // 0.5M - 1.5M volume

            dataPoints.push({
                time: date.toISOString().split('T')[0],
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: volume
            });

            lastClose = close;
        }

        // Adjust the entire series so the last point matches current price roughly, 
        // strictly speaking not needed for mock but nice to have.
        // For simple mock, just returning this realistic-looking series is fine.

        res.json(dataPoints);

    } catch (error) {
        console.error("History Route Error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
