import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import Follow from '../models/Follow.js';
import Notification from '../models/Notification.js';
import Prediction from '../models/Prediction.js';
import Question from '../models/Question.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/social/follow/:id
// @desc    Follow a user
// @access  Private
router.post('/follow/:id', protect, async (req, res) => {
    try {
        const userToFollowId = req.params.id;
        const followerId = req.user._id;

        if (userToFollowId === followerId.toString()) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const existingFollow = await Follow.findOne({
            follower: followerId,
            following: userToFollowId
        });

        if (existingFollow) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        await Follow.create({
            follower: followerId,
            following: userToFollowId
        });

        // Create Notification
        const notification = await Notification.create({
            recipient: userToFollowId,
            sender: followerId,
            type: 'FOLLOW',
            content: `${req.user.username} started following you`,
            link: `/profile/${req.user._id}`
        });

        // Real-time Socket Notification
        // Note: In a real scalable app, use Redis/Adapter to find the socket ID across nodes.
        // For this single-node setup, we broadcast to the user's room if they joined one, 
        // or just emit generally and let client filter (less secure/efficient) or use a map.
        // Ideally, users join a room named `user:{userId}` upon connection.
        req.io.to(`user:${userToFollowId}`).emit('notification:new', notification);

        res.json({ message: 'User followed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/social/follow/:id
// @desc    Unfollow a user
// @access  Private
router.delete('/follow/:id', protect, async (req, res) => {
    try {
        const userToUnfollowId = req.params.id;
        const followerId = req.user._id;

        await Follow.findOneAndDelete({
            follower: followerId,
            following: userToUnfollowId
        });

        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/social/feed
// @desc    Get activity feed from followed users
// @access  Private
router.get('/feed', protect, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // 1. Get List of user IDs I follow
        const following = await Follow.find({ follower: req.user._id }).distinct('following');

        // Also include self in feed? Optional. Let's include self.
        following.push(req.user._id);

        // 2. Fetch recent Predictions from these users
        const predictions = await Prediction.find({ userId: { $in: following } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('userId', 'username reputation')
            .populate('stockId', 'symbol name')
            .lean();

        // 3. Fetch recent Questions from these users
        const questions = await Question.find({ userId: { $in: following } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('userId', 'username reputation')
            .populate('stockId', 'symbol name')
            .lean();

        // 4. Merge and sort
        // Note: This is a simple merge. For strict pagination over mixed collections, 
        // aggregation pipelines (lookup + union) are better but more complex.
        // For MVP, fetching 'limit' from both and sorting in memory is acceptable 
        // if user count is low, but allows drift.
        // Better: Use $unionWith in aggregation (MongoDB 4.4+)

        // Using strict simple merge for now:
        const feed = [
            ...predictions.map(p => ({ ...p, type: 'PREDICTION' })),
            ...questions.map(q => ({ ...q, type: 'QUESTION' }))
        ]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        res.json(feed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/social/notifications
// @desc    Get my notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sender', 'username')
            .lean();

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/social/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', protect, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/social/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
