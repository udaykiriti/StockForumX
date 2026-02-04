import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Stock from '../models/Stock.js';
import { findSimilarQuestions } from '../utils/similarity.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// @route   GET /api/questions
// @desc    Get questions with filters
// @access  Public
// @route   GET /api/questions
// @desc    Get questions with filters (Optimized with Aggregation)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { userId, stockId, stockSymbol, tag, sort = 'recent', search } = req.query;

        Logger.debug('Questions API called', { userId, stockId, stockSymbol, tag, sort, search });

        // Build Match Stage
        const matchStage = {};

        // Filter by user
        if (userId) {
            matchStage.userId = new mongoose.Types.ObjectId(userId);
        }

        // Filter by stock
        if (stockId) {
            matchStage.stockId = new mongoose.Types.ObjectId(stockId);
        } else if (stockSymbol) {
            const stock = await Stock.findOne({ symbol: stockSymbol.toUpperCase() });
            if (stock) matchStage.stockId = stock._id;
            else if (!userId && !tag && !search) return res.json([]); // Return empty if filtering by non-existent stock
        }

        // Filter by tag
        if (tag) {
            matchStage.tags = tag;
        }

        // Text search
        if (search) {
            matchStage.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        // Build Sort Stage
        let sortStage = { createdAt: -1 }; // Default: recent
        if (sort === 'popular') sortStage = { views: -1, upvotes: -1 };

        // Handle "unanswered" filter
        if (sort === 'unanswered') matchStage.answerCount = 0;

        Logger.debug('Aggregation Match', { matchStage });

        const questions = await Question.aggregate([
            // 1. Filter first (Index utilization)
            { $match: matchStage },

            // 2. Sort early if possible (limited by index usage, but good for reducing set before lookup)
            { $sort: sortStage },
            { $limit: 50 },

            // 3. Join with Users
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }, // User is required

            // 4. Join with Stocks
            {
                $lookup: {
                    from: 'stocks',
                    localField: 'stockId',
                    foreignField: '_id',
                    as: 'stock'
                }
            },
            { $unwind: '$stock' }, // Stock is required

            // 5. Project (Shape Output)
            {
                $project: {
                    title: 1,
                    content: 1,
                    tags: 1,
                    upvotes: 1,
                    upvotedBy: 1,
                    views: 1,
                    answerCount: 1,
                    hasAcceptedAnswer: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userId: {
                        _id: '$user._id',
                        username: '$user.username',
                        reputation: '$user.reputation',
                        avatar: '$user.avatar'
                    },
                    stockId: {
                        _id: '$stock._id',
                        symbol: '$stock.symbol',
                        name: '$stock.name'
                    }
                }
            }
        ]);

        Logger.debug('Questions found', { count: questions.length });

        res.json(questions);
    } catch (error) {
        Logger.error('Questions API error', { error: error.message });
        res.status(500).json({ message: 'Error fetching questions' });
    }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { stockId, title, content, tags } = req.body;

        // Check for similar questions
        const combinedText = `${title} ${content}`;
        const similarQuestions = await findSimilarQuestions(Question, combinedText, stockId, 0.8);

        if (similarQuestions.length > 0) {
            return res.status(400).json({
                message: 'Similar question already exists',
                similarQuestions: similarQuestions.slice(0, 3)
            });
        }

        const question = await Question.create({
            stockId,
            userId: req.user._id,
            title,
            content,
            tags
        });

        const populatedQuestion = await Question.findById(question._id)
            .populate('userId', 'username reputation')
            .populate('stockId', 'symbol name');

        res.status(201).json(populatedQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        // Optimizing: Run update and answer fetch in parallel
        // 1. increment views transactionally/atomically
        // 2. fetch answers

        const [question, answers] = await Promise.all([
            Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
                .populate('userId', 'username reputation')
                .populate('stockId', 'symbol name'),
            Answer.find({ questionId: req.params.id })
                .populate('userId', 'username reputation')
                .sort({ isAccepted: -1, upvotes: -1, createdAt: -1 })
        ]);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.json({ question, answers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/questions/:id/answers
// @desc    Post an answer to a question
// @access  Private
router.post('/:id/answers', protect, async (req, res) => {
    try {
        const { content } = req.body;

        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const answer = await Answer.create({
            questionId: question._id,
            userId: req.user._id,
            content
        });

        // Update question answer count
        question.answerCount += 1;
        await question.save();

        const populatedAnswer = await Answer.findById(answer._id)
            .populate('userId', 'username reputation');

        res.status(201).json(populatedAnswer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/questions/:id/upvote
// @desc    Upvote a question
// @access  Private
router.put('/:id/upvote', protect, async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Toggle upvote
        const hasUpvoted = question.upvotedBy.includes(req.user._id);

        if (hasUpvoted) {
            question.upvotedBy = question.upvotedBy.filter(id => id.toString() !== req.user._id.toString());
            question.upvotes -= 1;
        } else {
            question.upvotedBy.push(req.user._id);
            question.upvotes += 1;
        }

        await question.save();
        res.json({ upvotes: question.upvotes, hasUpvoted: !hasUpvoted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/questions/answers/:id/upvote
// @desc    Upvote an answer
// @access  Private
router.put('/answers/:id/upvote', protect, async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);

        if (!answer) {
            return res.status(404).json({ message: 'Answer not found' });
        }

        // Toggle upvote
        const hasUpvoted = answer.upvotedBy.includes(req.user._id);

        if (hasUpvoted) {
            answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== req.user._id.toString());
            answer.upvotes -= 1;
        } else {
            answer.upvotedBy.push(req.user._id);
            answer.upvotes += 1;
        }

        await answer.save();
        res.json({ upvotes: answer.upvotes, hasUpvoted: !hasUpvoted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
