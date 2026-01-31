import express from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';
import sendEmail from '../utils/email.js';
import crypto from 'crypto';
import { asyncHandler, ErrorResponse } from '../middleware/errorMiddleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Mock User Data
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res, next) => {
    const { username, fullName, email, phone, location, tradingExperience, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
        return next(new ErrorResponse('User already exists', 400));
    }

    // Create user
    const user = await User.create({
        username,
        fullName,
        email,
        phone: phone || '',
        location: location || '',
        tradingExperience: tradingExperience || '',
        password
    });

    if (user) {
        // Generate Verification OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send Verification Email
        const message = `Welcome to StockForumX, ${user.username}!\n\nPlease verify your email to activate your account.\nYour Verification OTP is: ${otp}`;

        await sendEmail({
            email: user.email,
            subject: 'Verify your email - StockForumX',
            message
        });

        res.status(201).json({
            success: true,
            _id: user._id,
            username: user.username,
            email: user.email,
            message: 'Registration successful. Please check your email for verification OTP.'
        });
    }
}));

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-email', asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse('Invalid or expired OTP', 400));
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        reputation: user.reputation,
        token: generateToken(user._id),
        message: 'Email verified successfully'
    });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Check verification
        if (!user.isVerified) {
            return next(new ErrorResponse('Please verify your email first', 401));
        }

        res.json({
            success: true,
            _id: user._id,
            username: user.username,
            email: user.email,
            reputation: user.reputation,
            token: generateToken(user._id)
        });

        // Send Login Alert (Async - Fire and Forget)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const message = `Security Alert: Login Detected\n\nSomeone logged into your account.\nTime: ${new Date().toLocaleString()}\nIP Address: ${ip}\nDevice: ${userAgent}\n\nIf this was not you, please reset your password immediately.`;

        sendEmail({
            email: user.email,
            subject: 'New Login Alert - StockForumX',
            message
        }).catch(err => Logger.error(`Login email failed: ${err.message}`));
    } else {
        return next(new ErrorResponse('Invalid email or password', 401));
    }
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
        success: true,
        data: user
    });
}));

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset
// @access  Public
router.post('/forgot-password', asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const message = `Your password reset OTP is: ${otp}\nIt is valid for 10 minutes.`;

    await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - StockForumX',
        message
    });

    res.json({ success: true, message: 'OTP sent to email' });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password using OTP
// @access  Public
router.post('/reset-password', asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() }
    }).select('+otp +otpExpires');

    if (!user) {
        return next(new ErrorResponse('Invalid or expired OTP', 400));
    }

    // Reset password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save(); // Pre-save hook will hash password

    res.json({ success: true, message: 'Password reset successful' });
}));

// @route   POST /api/auth/login-otp-init
// @desc    Request OTP for passwordless login
// @access  Public
router.post('/login-otp-init', asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendEmail({
        email: user.email,
        subject: 'Login OTP - StockForumX',
        message: `Your Login OTP is: ${otp}`
    });

    res.json({ success: true, message: 'OTP sent to email' });
}));

// @route   POST /api/auth/login-otp-verify
// @desc    Login using OTP
// @access  Public
router.post('/login-otp-init/verify', asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await User.findOne({
        email,
        otp,
        otpExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new ErrorResponse('Invalid or expired OTP', 400));
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    // Also verify email if not verified
    if (!user.isVerified) user.isVerified = true;

    await user.save();

    res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        reputation: user.reputation,
        token: generateToken(user._id)
    });

    // Alert
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    sendEmail({
        email: user.email,
        subject: 'New Login Alert (OTP)',
        message: `Logged in via OTP at ${new Date().toLocaleString()}\nIP Address: ${ip}`
    }).catch(err => Logger.error(`OTP alert email failed: ${err.message}`));
}));

export default router;

