import express from 'express';
import { body } from 'express-validator';
import Alert from '../models/Alert.js';
import Stock from '../models/Stock.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler, ErrorResponse } from '../middleware/errorMiddleware.js';

const router = express.Router();

// @route   POST /api/alerts
// @desc    Create a new price alert
// @access  Private
router.post('/', protect, [
    body('symbol').trim().notEmpty().withMessage('Symbol is required').toUpperCase(),
    body('targetPrice').isNumeric().withMessage('Target price must be a number'),
    body('condition').isIn(['ABOVE', 'BELOW']).withMessage('Condition must be ABOVE or BELOW')
], asyncHandler(async (req, res, next) => {
    const { symbol, targetPrice, condition } = req.body;

    // Check if stock exists
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
        return next(new ErrorResponse('Stock not found', 404));
    }

    // Create alert
    const alert = await Alert.create({
        user: req.user._id,
        symbol,
        targetPrice,
        condition
    });

    res.status(201).json({
        success: true,
        data: alert
    });
}));

// @route   GET /api/alerts
// @desc    Get user's alerts
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json({
        success: true,
        count: alerts.length,
        data: alerts
    });
}));

// @route   DELETE /api/alerts/:id
// @desc    Delete an alert
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
        return next(new ErrorResponse('Alert not found', 404));
    }

    // Check ownership
    if (alert.user.toString() !== req.user._id.toString()) {
        return next(new ErrorResponse('Not authorized to delete this alert', 401));
    }

    await alert.deleteOne();

    res.json({
        success: true,
        data: {}
    });
}));

// @route   PUT /api/alerts/:id/toggle
// @desc    Toggle alert active status
// @access  Private
router.put('/:id/toggle', protect, asyncHandler(async (req, res, next) => {
    let alert = await Alert.findById(req.params.id);

    if (!alert) {
        return next(new ErrorResponse('Alert not found', 404));
    }

    if (alert.user.toString() !== req.user._id.toString()) {
        return next(new ErrorResponse('Not authorized to modify this alert', 401));
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    res.json({
        success: true,
        data: alert
    });
}));

export default router;
