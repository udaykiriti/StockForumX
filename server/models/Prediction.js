import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
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
    predictionType: {
        type: String,
        enum: ['price', 'direction'],
        required: true
    },
    targetPrice: {
        type: Number,
        required: function () { return this.predictionType === 'price'; }
    },
    direction: {
        type: String,
        enum: ['up', 'down'],
        required: function () { return this.predictionType === 'direction'; }
    },
    timeframe: {
        type: String,
        enum: ['1h', '1d', '1w', '1m'],
        required: true
    },
    targetDate: {
        type: Date,
        required: true
    },
    initialPrice: {
        type: Number,
        required: true
    },
    actualPrice: {
        type: Number
    },
    isEvaluated: {
        type: Boolean,
        default: false
    },
    isCorrect: {
        type: Boolean
    },
    reasoning: {
        type: String,
        maxlength: 1000
    },
    isFlagged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String
    }
}, {
    timestamps: true
});

// Index for efficient queries
predictionSchema.index({ stockId: 1, createdAt: -1 });
predictionSchema.index({ userId: 1 });
predictionSchema.index({ targetDate: 1, isEvaluated: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);

export default Prediction;
