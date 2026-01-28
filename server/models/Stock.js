import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    sector: {
        type: String,
        required: true
    },
    currentPrice: {
        type: Number,
        required: true
    },
    previousClose: {
        type: Number,
        required: true
    },
    change: {
        type: Number,
        default: 0
    },
    changePercent: {
        type: Number,
        default: 0
    },
    volume: {
        type: Number,
        default: 0
    },
    marketCap: {
        type: Number,
        default: 0
    },
    high24h: {
        type: Number,
        default: 0
    },
    low24h: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    peRatio: {
        type: Number,
        default: 0
    },
    dividendYield: {
        type: Number,
        default: 0
    },
    fiftyTwoWeekHigh: {
        type: Number,
        default: 0
    },
    fiftyTwoWeekLow: {
        type: Number,
        default: 0
    },
    industry: {
        type: String,
        default: 'General'
    },
    website: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Calculate change and changePercent before saving
stockSchema.pre('save', function (next) {
    if (this.isModified('currentPrice') || this.isModified('previousClose')) {
        this.change = this.currentPrice - this.previousClose;
        this.changePercent = ((this.change / this.previousClose) * 100).toFixed(2);
    }
    next();
});

// Indexes
stockSchema.index({ symbol: 'text', name: 'text' });

const Stock = mongoose.model('Stock', stockSchema);

export default Stock;
