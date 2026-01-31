import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stock from '../models/Stock.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';

dotenv.config();

const stocks = [
    // Tech Giants
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', currentPrice: 178.50, previousClose: 175.20, volume: 52000000, marketCap: 2800000000000, high24h: 179.80, low24h: 174.50, description: 'Smartphones and software.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', currentPrice: 142.30, previousClose: 140.80, volume: 28000000, marketCap: 1800000000000, high24h: 143.50, low24h: 140.20, description: 'Search and advertising.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', currentPrice: 415.20, previousClose: 412.50, volume: 22000000, marketCap: 3100000000000, high24h: 417.80, low24h: 411.30, description: 'Software and cloud.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', currentPrice: 875.50, previousClose: 862.30, volume: 38000000, marketCap: 2150000000000, high24h: 882.40, low24h: 858.70, description: 'AI and GPU chips.' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', sector: 'Technology', currentPrice: 485.30, previousClose: 478.90, volume: 18000000, marketCap: 1240000000000, high24h: 488.60, low24h: 476.20, description: 'Social media.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', currentPrice: 180.20, previousClose: 178.50, volume: 45000000, marketCap: 290000000000, high24h: 182.50, low24h: 177.80, description: 'Semiconductors.' },
    { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology', currentPrice: 43.50, previousClose: 44.20, volume: 35000000, marketCap: 185000000000, high24h: 44.80, low24h: 43.10, description: 'Processor manufacturing.' },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Technology', currentPrice: 530.40, previousClose: 525.10, volume: 3200000, marketCap: 240000000000, high24h: 535.80, low24h: 528.20, description: 'Creative software.' },
    { symbol: 'CRM', name: 'Salesforce, Inc.', sector: 'Technology', currentPrice: 298.60, previousClose: 295.40, volume: 5500000, marketCap: 285000000000, high24h: 300.20, low24h: 294.70, description: 'Cloud CRM solutions.' },
    { symbol: 'NFLX', name: 'Netflix, Inc.', sector: 'Technology', currentPrice: 610.20, previousClose: 605.80, volume: 4100000, marketCap: 265000000000, high24h: 615.40, low24h: 608.10, description: 'Streaming service.' },

    // Financials
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance', currentPrice: 195.40, previousClose: 193.20, volume: 12000000, marketCap: 570000000000, high24h: 196.80, low24h: 192.50, description: 'Banking and finance.' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', currentPrice: 278.60, previousClose: 275.80, volume: 8000000, marketCap: 580000000000, high24h: 280.20, low24h: 274.90, description: 'Payments technology.' },
    { symbol: 'MA', name: 'Mastercard Incorporated', sector: 'Finance', currentPrice: 475.20, previousClose: 472.50, volume: 2500000, marketCap: 440000000000, high24h: 478.10, low24h: 471.40, description: 'Global payments.' },
    { symbol: 'BAC', name: 'Bank of America Corp', sector: 'Finance', currentPrice: 35.80, previousClose: 35.20, volume: 45000000, marketCap: 280000000000, high24h: 36.10, low24h: 35.40, description: 'Commercial banking.' },
    { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Finance', currentPrice: 395.40, previousClose: 390.80, volume: 1800000, marketCap: 130000000000, high24h: 398.20, low24h: 389.50, description: 'Investment banking.' },
    { symbol: 'PYPL', name: 'PayPal Holdings, Inc.', sector: 'Finance', currentPrice: 62.10, previousClose: 63.50, volume: 15000000, marketCap: 68000000000, high24h: 64.20, low24h: 61.80, description: 'Digital payments.' },

    // Consumer & Retail
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer', currentPrice: 178.90, previousClose: 176.30, volume: 42000000, marketCap: 1850000000000, high24h: 180.20, low24h: 175.80, description: 'E-commerce and cloud.' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', currentPrice: 168.50, previousClose: 167.20, volume: 7500000, marketCap: 455000000000, high24h: 169.80, low24h: 166.40, description: 'Retail giant.' },
    { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer', currentPrice: 60.20, previousClose: 59.80, volume: 12000000, marketCap: 260000000000, high24h: 60.80, low24h: 59.50, description: 'Beverages.' },
    { symbol: 'PEP', name: 'PepsiCo, Inc.', sector: 'Consumer', currentPrice: 172.40, previousClose: 171.10, volume: 4500000, marketCap: 235000000000, high24h: 173.80, low24h: 170.50, description: 'Food and drinks.' },
    { symbol: 'MCD', name: "McDonald's Corporation", sector: 'Consumer', currentPrice: 285.60, previousClose: 282.40, volume: 2800000, marketCap: 205000000000, high24h: 288.10, low24h: 281.30, description: 'Fast food.' },
    { symbol: 'NKE', name: 'NIKE, Inc.', sector: 'Consumer', currentPrice: 102.50, previousClose: 104.20, volume: 8500000, marketCap: 155000000000, high24h: 105.10, low24h: 101.80, description: 'Athletic footwear.' },
    { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer', currentPrice: 92.40, previousClose: 91.80, volume: 7200000, marketCap: 105000000000, high24h: 93.50, low24h: 91.20, description: 'Coffee chain.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Automotive', currentPrice: 242.80, previousClose: 238.50, volume: 95000000, marketCap: 770000000000, high24h: 245.60, low24h: 237.20, description: 'Electric vehicles.' },

    // Healthcare
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', currentPrice: 158.40, previousClose: 159.20, volume: 6200000, marketCap: 380000000000, high24h: 160.10, low24h: 157.50, description: 'Pharmaceuticals.' },
    { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', currentPrice: 28.50, previousClose: 28.10, volume: 25000000, marketCap: 160000000000, high24h: 28.90, low24h: 27.80, description: 'Biotechnology.' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc', sector: 'Healthcare', currentPrice: 485.20, previousClose: 480.50, volume: 3100000, marketCap: 450000000000, high24h: 488.40, low24h: 478.20, description: 'Health insurance.' },

    // Heavy Industry & Energy
    { symbol: 'XOM', name: 'Exxon Mobil Corp', sector: 'Energy', currentPrice: 105.40, previousClose: 104.20, volume: 15000000, marketCap: 420000000000, high24h: 106.50, low24h: 103.80, description: 'Oil and gas.' },
    { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', currentPrice: 152.10, previousClose: 153.50, volume: 8200000, marketCap: 285000000000, high24h: 154.80, low24h: 151.20, description: 'Energy services.' },
    { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industry', currentPrice: 335.80, previousClose: 332.10, volume: 2100000, marketCap: 170000000000, high24h: 338.50, low24h: 330.40, description: 'Heavy machinery.' },
    { symbol: 'GE', name: 'General Electric Co.', sector: 'Industry', currentPrice: 165.20, previousClose: 163.80, volume: 5100000, marketCap: 180000000000, high24h: 167.40, low24h: 162.90, description: 'Aerospace and power.' },

    // Cryptocurrencies
    { symbol: 'BTC-USD', name: 'Bitcoin', sector: 'Crypto', currentPrice: 65000.00, previousClose: 64200.00, volume: 35000000000, marketCap: 1200000000000, high24h: 66000.00, low24h: 63500.00, description: 'Digital gold.' },
    { symbol: 'ETH-USD', name: 'Ethereum', sector: 'Crypto', currentPrice: 3500.20, previousClose: 3450.80, volume: 15000000000, marketCap: 420000000000, high24h: 3580.40, low24h: 3420.10, description: 'Smart contract platform.' },
    { symbol: 'SOL-USD', name: 'Solana', sector: 'Crypto', currentPrice: 145.40, previousClose: 142.10, volume: 4200000000, marketCap: 65000000000, high24h: 150.20, low24h: 140.50, description: 'High-speed blockchain.' },
    { symbol: 'XRP-USD', name: 'XRP', sector: 'Crypto', currentPrice: 0.62, previousClose: 0.61, volume: 1500000000, marketCap: 35000000000, high24h: 0.64, low24h: 0.59, description: 'Payment settlement.' },
    { symbol: 'ADA-USD', name: 'Cardano', sector: 'Crypto', currentPrice: 0.45, previousClose: 0.46, volume: 450000000, marketCap: 16000000000, high24h: 0.48, low24h: 0.44, description: 'Proof-of-stake blockchain.' },
    { symbol: 'DOGE-USD', name: 'Dogecoin', sector: 'Crypto', currentPrice: 0.16, previousClose: 0.15, volume: 2100000000, marketCap: 23000000000, high24h: 0.18, low24h: 0.14, description: 'Community coin.' },

    // AI & Datacenters
    { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'AI/Software', currentPrice: 24.50, previousClose: 23.80, volume: 55000000, marketCap: 55000000000, description: 'Big data analytics.' },
    { symbol: 'SMCI', name: 'Super Micro Computer', sector: 'AI/Infrastructure', currentPrice: 850.20, previousClose: 840.50, volume: 8000000, marketCap: 50000000000, description: 'AI server solutions.' },
    { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Cloud', currentPrice: 165.40, previousClose: 168.20, volume: 6000000, marketCap: 55000000000, description: 'Data cloud platform.' },

    // ETFs & Indices
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF', currentPrice: 510.20, previousClose: 508.50, volume: 75000000, marketCap: 500000000000, description: 'Tracking S&P 500.' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', currentPrice: 440.50, previousClose: 438.20, volume: 45000000, marketCap: 250000000000, description: 'Tracking Nasdaq 100.' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'ETF', currentPrice: 468.40, previousClose: 466.80, volume: 5000000, marketCap: 400000000000, description: 'Low cost S&P 500 index.' },

    // Real Estate & Infrastructure
    { symbol: 'AMT', name: 'American Tower Corp', sector: 'Real Estate', currentPrice: 195.40, previousClose: 198.20, volume: 2500000, marketCap: 90000000000, description: 'Cell tower REIT.' },
    { symbol: 'PLD', name: 'Prologis, Inc.', sector: 'Real Estate', currentPrice: 128.60, previousClose: 130.40, volume: 3500000, marketCap: 120000000000, description: 'Logistics real estate.' },

    // Utilities & Clean Energy
    { symbol: 'NEE', name: 'NextEra Energy, Inc.', sector: 'Utilities', currentPrice: 62.40, previousClose: 61.80, volume: 8500000, marketCap: 125000000000, description: 'Renewable energy giant.' },
    { symbol: 'DUK', name: 'Duke Energy Corp', sector: 'Utilities', currentPrice: 95.20, previousClose: 94.50, volume: 3200000, marketCap: 75000000000, description: 'Electric power company.' },
    { symbol: 'ENPH', name: 'Enphase Energy', sector: 'Clean Energy', currentPrice: 115.80, previousClose: 118.40, volume: 4500000, marketCap: 15000000000, description: 'Solar energy tech.' },

    // Materials & Industrials
    { symbol: 'FCX', name: 'Freeport-McMoRan', sector: 'Materials', currentPrice: 45.20, previousClose: 44.50, volume: 15000000, marketCap: 65000000000, description: 'Mining (Copper/Gold).' },
    { symbol: 'ALB', name: 'Albemarle Corp', sector: 'Materials', currentPrice: 125.60, previousClose: 128.20, volume: 2800000, marketCap: 15000000000, description: 'Lithium producer.' },
    { symbol: 'BA', name: 'Boeing Co', sector: 'Aerospace', currentPrice: 185.40, previousClose: 188.20, volume: 6500000, marketCap: 115000000000, description: 'Aircraft manufacturing.' },

    // Global/China Emerging Tech
    { symbol: 'BABA', name: 'Alibaba Group', sector: 'E-commerce', currentPrice: 75.40, previousClose: 76.20, volume: 20000000, marketCap: 190000000000, description: 'Global e-commerce.' },
    { symbol: 'JD', name: 'JD.com, Inc.', sector: 'E-commerce', currentPrice: 28.50, previousClose: 29.10, volume: 12000000, marketCap: 45000000000, description: 'Chinese retailer.' },
    { symbol: 'SE', name: 'Sea Limited', sector: 'Platform', currentPrice: 55.40, previousClose: 53.80, volume: 5500000, marketCap: 30000000000, description: 'Gaming and Shopee.' }
];

const users = [
    {
        username: 'demo_user',
        fullName: 'Demo User',
        email: 'demo@stockforumx.com',
        password: 'password123',
        reputation: 45.5,
        totalPredictions: 25,
        accuratePredictions: 18,
        bio: 'Tech stock enthusiast with focus on AI and semiconductors'
    },
    {
        username: 'market_guru',
        fullName: 'Market Guru',
        email: 'guru@stockforumx.com',
        password: 'password123',
        reputation: 125.8,
        totalPredictions: 87,
        accuratePredictions: 72,
        bio: 'Full-time trader specializing in momentum strategies'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await Stock.deleteMany({});
        await User.deleteMany({});
        await Question.deleteMany({});
        await Answer.deleteMany({});
        console.log('Cleared existing data');

        // Insert stocks
        const createdStocks = await Stock.insertMany(stocks);
        console.log('Seeded stocks');

        // Insert users
        const createdUsers = await User.insertMany(users);
        console.log('Seeded users');

        // Create questions
        const questions = [
            {
                stockId: createdStocks.find(s => s.symbol === 'AAPL')._id,
                userId: createdUsers[0]._id,
                title: 'AAPL Q3 Earnings Expectations?',
                content: 'With the recent iPhone sales data coming out of China, what are everyone\'s thoughts on the upcoming earnings report? I\'m seeing conflicting reports from analysts.',
                tags: ['earnings', 'iphone', 'analysis'],
                upvotes: 15,
                views: 230,
                answerCount: 1,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                stockId: createdStocks.find(s => s.symbol === 'NVDA')._id,
                userId: createdUsers[1]._id,
                title: 'Is NVDA valuation sustainable at these levels?',
                content: 'The PE ratio is sky high, but the AI demand seems insatiable. Are we in a bubble or is this just the beginning of the AI supercycle?',
                tags: ['valuation', 'AI', 'bubble'],
                upvotes: 42,
                views: 890,
                answerCount: 0,
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
            },
            {
                stockId: createdStocks.find(s => s.symbol === 'TSLA')._id,
                userId: createdUsers[0]._id,
                title: 'Tesla Cybertruck production ramp',
                content: 'Saw some new drone footage of Giga Texas. Looks like Cybertruck production is ramping up faster than expected. Bullish for Q4?',
                tags: ['cybertruck', 'production', 'bullish'],
                upvotes: 28,
                views: 560,
                answerCount: 1,
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
            },
            {
                stockId: createdStocks.find(s => s.symbol === 'MSFT')._id,
                userId: createdUsers[1]._id,
                title: 'Microsoft Copilot revenue impact',
                content: 'How significant do you think the Copilot subscription revenue will be for Microsoft this fiscal year? Enterprise adoption seems strong.',
                tags: ['copilot', 'revenue', 'cloud'],
                upvotes: 19,
                views: 180,
                answerCount: 0,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            },
            {
                stockId: createdStocks.find(s => s.symbol === 'AMZN')._id,
                userId: createdUsers[1]._id,
                title: 'Amazon Web Services (AWS) Growth',
                content: 'Is AWS facing real competition from Azure, or is it just a temporary blip? The cloud wars are heating up.',
                tags: ['cloud', 'aws', 'competition'],
                upvotes: 10,
                views: 150,
                answerCount: 0,
                createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
            }
        ];

        const createdQuestions = await Question.insertMany(questions);
        console.log('Seeded questions');

        // Create answers
        const answers = [
            {
                questionId: createdQuestions[0]._id,
                userId: createdUsers[1]._id,
                content: 'I am bullish. Services revenue will carry the day even if hardware is flat.',
                upvotes: 5,
                isAccepted: false,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                questionId: createdQuestions[2]._id,
                userId: createdUsers[1]._id,
                content: 'Be careful with production ramps, they burn cash fast. Margins might take a hit initially.',
                upvotes: 3,
                isAccepted: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
        ];

        await Answer.insertMany(answers);
        console.log('Seeded answers');

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
