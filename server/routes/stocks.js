import express from 'express';
import mongoose from 'mongoose';
import yahooFinance from 'yahoo-finance2';
import Stock from '../models/Stock.js';
import Question from '../models/Question.js';
import Prediction from '../models/Prediction.js';
import redisCache from '../middleware/cache.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Mock Data
// @route   GET /api/stocks
// @desc    Get all stocks with pagination and filtering
// @access  Public
router.get('/', redisCache.route({ expire: 300 }), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // 12 stocks per page
        const skip = (page - 1) * limit;
        const { search, sector, sortBy } = req.query;

        let query = {};

        // 1. Filtering Logic
        if (search) {
            query.$or = [
                { symbol: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        if (sector && sector !== 'all') {
            query.sector = sector;
        }

        // 2. Sorting Logic
        let sortQuery = { symbol: 1 }; // Default
        if (sortBy === 'trending') {
            sortQuery = { sentimentScore: -1, volume: -1 };
        } else if (sortBy === 'bullish') {
            sortQuery = { sentimentScore: -1 };
        } else if (sortBy === 'gainers') {
            sortQuery = { changePercent: -1 };
        } else if (sortBy === 'losers') {
            sortQuery = { changePercent: 1 };
        } else if (sortBy === 'price-high') {
            sortQuery = { currentPrice: -1 };
        } else if (sortBy === 'price-low') {
            sortQuery = { currentPrice: 1 };
        }

        // 3. Fetch Data and Total Count
        const total = await Stock.countDocuments(query);
        const stocks = await Stock.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .lean();

        // 3. Auto-seed if empty (only for main page)
        if (!search && !sector && page === 1 && total === 0) {
            // ... (keep search/seeding logic for robustness if needed, 
            // but we have a seeder now, so we can simplify)
        }

        res.json({
            success: true,
            count: stocks.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: stocks
        });
    } catch (error) {
        Logger.error('Error fetching stocks', { error: error.message });
        res.status(500).json({ message: 'Error fetching stocks' });
    }
});

// @route   GET /api/stocks/sectors
// @desc    Get all unique sectors
// @access  Public
router.get('/sectors', async (req, res) => {
    try {
        const sectors = await Stock.distinct('sector');
        res.json(sectors.filter(Boolean).sort());
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        let shouldFetch = true;

        // 1. Check if data is stale (older than 5 minutes)
        if (stock) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (stock.updatedAt > fiveMinutesAgo) {
                shouldFetch = false;
            }
        }

        if (shouldFetch) {
            // 2. Try to fetch real-time data from Yahoo Finance
            let profile = {};
            
            // 2. Parallelize External API Calls
            try {
                const [quoteResult, summaryResult] = await Promise.allSettled([
                    yahooFinance.quote(symbol),
                    yahooFinance.quoteSummary(symbol, { modules: ['summaryProfile', 'summaryDetail', 'defaultKeyStatistics'] })
                ]);

                // Process Quote Result
                if (quoteResult.status === 'fulfilled') {
                    quote = quoteResult.value;
                } else {
                    Logger.warn(`Yahoo Finance quote failed for ${symbol}`, { error: quoteResult.reason.message });
                }

                // Process Summary Result
                if (summaryResult.status === 'fulfilled') {
                    const summary = summaryResult.value;
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
                } else {
                    Logger.warn(`Yahoo Finance profile failed for ${symbol}`, { error: summaryResult.reason.message });
                }

            } catch (err) {
                 Logger.error(`Unexpected error in parallel fetch for ${symbol}`, { error: err.message });
            }

            // 3. If valid quote, Upsert into Database
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
        }

        // 4. If stock still doesn't exist (neither in DB nor valid in Yahoo), use Mock Fallback
        if (!stock) {
            Logger.debug(`Generating mock data for ${symbol}`);
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

        // 5. Get additional stats in parallel
        const [questionCount, predictionCount] = await Promise.all([
            Question.countDocuments({ stockId: stock._id }),
            Prediction.countDocuments({ stockId: stock._id })
        ]);

        res.json({
            ...stock.toObject(),
            stats: {
                questionCount,
                predictionCount
            }
        });

    } catch (error) {
        Logger.error('Stock Lookup Error', { error: error.message, stack: error.stack });
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
router.get('/:symbol/history', redisCache.route({ expire: 600 }), async (req, res) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const stock = await Stock.findOne({ symbol });

        let chartData = null;

        // 1. Try Yahoo Finance History
        try {
            const queryOptions = { period1: '1mo', interval: '1d' };
            chartData = await yahooFinance.chart(symbol, queryOptions);
        } catch (err) {
            Logger.warn(`Yahoo Chart failed for ${symbol}`, { error: err.message });
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
        Logger.error('History Route Error', { error: error.message });
        res.status(500).json({ message: error.message });
    }
});

export default router;
