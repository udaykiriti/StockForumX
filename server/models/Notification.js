import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Optional: sender might be null for system notifications
    },
    type: {
        type: String,
        enum: ['FOLLOW', 'PREDICTION_LIKE', 'ANSWER_ACCEPTED', 'SYSTEM', 'PRICE_ALERT'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: ''
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient retrieval of unread notifications
NotificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
