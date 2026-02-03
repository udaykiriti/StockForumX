import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    tags: [{
        type: String,
        trim: true
    }],
    upvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    answerCount: {
        type: Number,
        default: 0
    },
    hasAcceptedAnswer: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
questionSchema.index({ stockId: 1, createdAt: -1 });
questionSchema.index({ userId: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdAt: -1 }); // Global feed
questionSchema.index({ views: -1, answerCount: -1 }); // Trending by engagement

const Question = mongoose.model('Question', questionSchema);

export default Question;
