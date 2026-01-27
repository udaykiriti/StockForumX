import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Holding from '../models/Holding.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// @route   GET /api/portfolio
// @desc    Get user portfolio and holdings
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user data for balance
        const user = await User.findById(userId).select('balance');

        // Get all holdings
        const holdings = await Holding.find({ userId })
            .populate('stockId', 'symbol name currentPrice change changePercent');

        // Calculate total portfolio value
        let totalHoldingsValue = 0;
        const formattedHoldings = holdings.map(holding => {
            const currentVal = holding.quantity * holding.stockId.currentPrice;
            totalHoldingsValue += currentVal;

            const costBasis = holding.quantity * holding.averagePrice;
            const profitLoss = currentVal - costBasis;
            const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

            return {
                ...holding.toObject(),
                currentValue: currentVal,
                profitLoss,
                profitLossPercent
            };
        });

        res.json({
            balance: user.balance,
            totalValue: user.balance + totalHoldingsValue,
            holdingsValue: totalHoldingsValue,
            holdings: formattedHoldings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/portfolio/trade
// @desc    Execute a buy or sell trade
// @access  Private
router.post('/trade', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { stockId, type, quantity } = req.body;
        const userId = req.user._id;

        if (!stockId || !type || !quantity || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid trade parameters' });
        }

        const stock = await Stock.findById(stockId).session(session);
        if (!stock) {
            return res.status(404).json({ message: 'Stock not found' });
        }

        const user = await User.findById(userId).session(session);
        const stockPrice = stock.currentPrice;
        const totalCost = stockPrice * quantity;

        if (type === 'buy') {
            // Check balance
            if (user.balance < totalCost) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }

            // Update balance
            user.balance -= totalCost;
            await user.save({ session });

            // Update Holding
            let holding = await Holding.findOne({ userId, stockId }).session(session);
            if (holding) {
                // Weighted average price calculation
                const totalQty = holding.quantity + quantity;
                holding.averagePrice = ((holding.averagePrice * holding.quantity) + totalCost) / totalQty;
                holding.quantity = totalQty;
            } else {
                holding = new Holding({
                    userId,
                    stockId,
                    quantity,
                    averagePrice: stockPrice
                });
            }
            await holding.save({ session });

        } else if (type === 'sell') {
            // Check if user has enough shares
            const holding = await Holding.findOne({ userId, stockId }).session(session);
            if (!holding || holding.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient shares' });
            }

            // Update balance
            user.balance += totalCost;
            await user.save({ session });

            // Update or remove holding
            holding.quantity -= quantity;
            if (holding.quantity === 0) {
                await Holding.deleteOne({ _id: holding._id }).session(session);
            } else {
                await holding.save({ session });
            }
        }

        // Create transaction record
        await Transaction.create([{
            userId,
            stockId,
            type,
            quantity,
            price: stockPrice,
            totalAmount: totalCost,
            status: 'completed'
        }], { session });

        await session.commitTransaction();
        res.status(200).json({
            message: `Trade successful: ${type.toUpperCase()} ${quantity} shares of ${stock.symbol}`,
            newBalance: user.balance
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// @route   GET /api/portfolio/history
// @desc    Get user transaction history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .populate('stockId', 'symbol name')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/portfolio/watchlist
// @desc    Get user watchlist
// @access  Private
router.get('/watchlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('watchlist', 'symbol name currentPrice change changePercent');
        res.json(user.watchlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/portfolio/watchlist/:stockId
// @desc    Toggle stock in watchlist
// @access  Private
router.post('/watchlist/:stockId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const stockId = req.params.stockId;

        const index = user.watchlist.indexOf(stockId);
        if (index > -1) {
            user.watchlist.splice(index, 1);
            await user.save();
            res.json({ message: 'Removed from watchlist', isInWatchlist: false });
        } else {
            user.watchlist.push(stockId);
            await user.save();
            res.json({ message: 'Added to watchlist', isInWatchlist: true });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
