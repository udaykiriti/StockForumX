import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    averagePrice: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// User can only have one holding per stock
holdingSchema.index({ userId: 1, stockId: 1 }, { unique: true });

const Holding = mongoose.model('Holding', holdingSchema);

export default Holding;
