import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    location: {
        type: String,
        default: '',
        trim: true,
        maxlength: 100
    },
    tradingExperience: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert', ''],
        default: ''
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    reputation: {
        type: Number,
        default: 0
    },
    totalPredictions: {
        type: Number,
        default: 0
    },
    accuratePredictions: {
        type: Number,
        default: 0
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: '',
        maxlength: 500
    },
    status: {
        type: String,
        default: '',
        maxlength: 100
    },
    otp: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    balance: {
        type: Number,
        default: 10000 // Starting with $10k
    },
    watchlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate accuracy percentage
userSchema.virtual('accuracy').get(function () {
    if (this.totalPredictions === 0) return 0;
    return (this.accuratePredictions / this.totalPredictions) * 100;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Indexes
userSchema.index({ reputation: -1 });

const User = mongoose.model('User', userSchema);

export default User;
