import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    targetPrice: {
        type: Number,
        required: true
    },
    condition: {
        type: String,
        enum: ['ABOVE', 'BELOW'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    triggeredAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient matching in the Go engine
alertSchema.index({ symbol: 1, isActive: 1 });
alertSchema.index({ user: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
