import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import { getReputationTier } from '../utils/reputation.js';

const router = express.Router();

// @route   GET /api/users/count
// @desc    Get total user count
// @access  Public
router.get('/count', async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/leaderboard

// @route   GET /api/users/leaderboard
// @desc    Get top users by reputation
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;

        const users = await User.find()
            .select('username reputation totalPredictions accuratePredictions createdAt')
            .sort({ reputation: -1 })
            .limit(limit)
            .lean();

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            ...user,
            tier: getReputationTier(user.reputation),
            accuracy: user.totalPredictions > 0
                ? ((user.accuratePredictions / user.totalPredictions) * 100).toFixed(2)
                : 0
        }));

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            ...user,
            tier: getReputationTier(user.reputation)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Public
router.get('/:id/stats', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get detailed stats
        // Get detailed stats - Parallel execution
        const [predictions, questions, answers] = await Promise.all([
            Prediction.find({ userId: user._id }).lean(),
            Question.find({ userId: user._id }).lean(),
            Answer.find({ userId: user._id }).lean()
        ]);

        const stats = {
            user: {
                ...user,
                tier: getReputationTier(user.reputation)
            },
            predictions: {
                total: predictions.length,
                evaluated: predictions.filter(p => p.isEvaluated).length,
                correct: predictions.filter(p => p.isCorrect).length,
                byTimeframe: {
                    '1h': predictions.filter(p => p.timeframe === '1h').length,
                    '1d': predictions.filter(p => p.timeframe === '1d').length,
                    '1w': predictions.filter(p => p.timeframe === '1w').length,
                    '1m': predictions.filter(p => p.timeframe === '1m').length
                }
            },
            questions: {
                total: questions.length,
                totalViews: questions.reduce((sum, q) => sum + q.views, 0),
                totalUpvotes: questions.reduce((sum, q) => sum + q.upvotes, 0)
            },
            answers: {
                total: answers.length,
                accepted: answers.filter(a => a.isAccepted).length,
                totalUpvotes: answers.reduce((sum, a) => sum + a.upvotes, 0)
            }
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile (avatar, bio, status)
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const { avatar, bio, status } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (avatar !== undefined) user.avatar = avatar;
        if (bio !== undefined) user.bio = bio;
        if (status !== undefined) user.status = status;

        await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            reputation: user.reputation,
            avatar: user.avatar,
            bio: user.bio,
            status: user.status
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;

// @route   POST /api/users/:id/follow
// @desc    Follow or Unfollow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isFollowing = currentUser.following.includes(req.params.id);

        if (isFollowing) {
            // Unfollow
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
            await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
            res.json({ message: 'Unfollowed successfully', isFollowing: false });
        } else {
            // Follow
            await User.findByIdAndUpdate(req.user._id, { $push: { following: req.params.id } });
            await User.findByIdAndUpdate(req.params.id, { $push: { followers: req.user._id } });
            res.json({ message: 'Followed successfully', isFollowing: true });
        }
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: error.message });
    }
});
