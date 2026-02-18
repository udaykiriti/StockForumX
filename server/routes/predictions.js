import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import Prediction from '../models/Prediction.js';
import Stock from '../models/Stock.js';
import User from '../models/User.js';

const router = express.Router();

// @route   GET /api/predictions
// @desc    Get predictions with filters
// @access  Public
// Mock Data
// @route   GET /api/predictions

router.get('/', async (req, res) => {
    try {
        const { stockId, stockSymbol, userId, evaluated } = req.query;
        const query = {};

        if (stockId) query.stockId = stockId;
        if (userId) query.userId = userId;
        if (evaluated !== undefined) query.isEvaluated = evaluated === 'true';

        // Filter by stock symbol
        if (stockSymbol) {
            const stock = await Stock.findOne({ symbol: stockSymbol.toUpperCase() });
            if (stock) query.stockId = stock._id;
        }

        const predictions = await Prediction.find(query)
            .populate('userId', 'username reputation')
            .populate('stockId', 'symbol name currentPrice')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/predictions
// @desc    Create a new prediction
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { stockId, predictionType, targetPrice, direction, timeframe, reasoning } = req.body;

        // 1. Prevent Duplicate Active Predictions
        const existingActivePrediction = await Prediction.findOne({
            userId: req.user._id,
            stockId,
            isEvaluated: false
        });

        if (existingActivePrediction) {
            return res.status(400).json({ message: 'You already have an active prediction for this stock' });
        }

        // 2. Pump Detection (More than 10 predictions for same stock in last minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentStockPredictions = await Prediction.countDocuments({
            stockId,
            createdAt: { $gte: oneMinuteAgo }
        });

        let isFlagged = false;
        let flagReason = '';

        if (recentStockPredictions >= 10) {
            isFlagged = true;
            flagReason = 'Potential Pump Activity: High frequency predictions';
        }

        // Rate limiting check
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentPredictions = await Prediction.countDocuments({
            userId: req.user._id,
            createdAt: { $gte: oneHourAgo }
        });

        if (recentPredictions >= 5) {
            return res.status(429).json({ message: 'Rate limit exceeded. Max 5 predictions per hour.' });
        }

        // Get current stock price
        const stock = await Stock.findById(stockId);
        if (!stock) {
            return res.status(404).json({ message: 'Stock not found' });
        }

        // Calculate target date based on timeframe
        const timeframeMap = {
            '1h': 60 * 60 * 1000,
            '1d': 24 * 60 * 60 * 1000,
            '1w': 7 * 24 * 60 * 60 * 1000,
            '1m': 30 * 24 * 60 * 60 * 1000
        };

        const validTimeframes = ['1h', '1d', '1w', '1m'];
        if (!validTimeframes.includes(timeframe)) {
            return res.status(400).json({ message: 'Invalid timeframe' });
        }

        const targetDate = new Date(Date.now() + timeframeMap[timeframe]);

        const prediction = await Prediction.create({
            stockId,
            userId: req.user._id,
            predictionType,
            targetPrice,
            direction,
            timeframe,
            targetDate,
            initialPrice: stock.currentPrice,
            reasoning,
            isFlagged,
            flagReason
        });

        const populatedPrediction = await Prediction.findById(prediction._id)
            .populate('userId', 'username reputation')
            .populate('stockId', 'symbol name currentPrice');

        res.status(201).json(populatedPrediction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/predictions/user/:userId
// @desc    Get user's predictions
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const predictions = await Prediction.find({ userId: req.params.userId })
            .populate('stockId', 'symbol name currentPrice')
            .sort({ createdAt: -1 });

        const stats = {
            total: predictions.length,
            evaluated: predictions.filter(p => p.isEvaluated).length,
            correct: predictions.filter(p => p.isCorrect).length,
            accuracy: 0
        };

        if (stats.evaluated > 0) {
            stats.accuracy = ((stats.correct / stats.evaluated) * 100).toFixed(2);
        }

        res.json({ predictions, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/predictions/stats
// @desc    Get overall prediction statistics
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        const totalPredictions = await Prediction.countDocuments();
        const evaluatedPredictions = await Prediction.countDocuments({ isEvaluated: true });
        const correctPredictions = await Prediction.countDocuments({ isCorrect: true });

        const accuracy = evaluatedPredictions > 0
            ? ((correctPredictions / evaluatedPredictions) * 100).toFixed(2)
            : 0;

        // Top predictors
        const topPredictors = await User.find()
            .select('username reputation totalPredictions accuratePredictions')
            .sort({ reputation: -1 })
            .limit(10);

        res.json({
            totalPredictions,
            evaluatedPredictions,
            correctPredictions,
            accuracy,
            topPredictors
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
