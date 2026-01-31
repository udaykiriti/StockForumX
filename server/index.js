import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import validateEnv from './config/validateEnv.js';
import Logger from './utils/logger.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Routes
import authRoutes from './routes/auth.js';
import stockRoutes from './routes/stocks.js';
import questionRoutes from './routes/questions.js';
import predictionRoutes from './routes/predictions.js';
import userRoutes from './routes/users.js';
import portfolioRoutes from './routes/portfolio.js';
import socialRoutes from './routes/social.js';

// Sockets
import { setupChatHandlers } from './sockets/chat.js';
import { setupUpdateHandlers } from './sockets/updates.js';

// Jobs
import { startPredictionEvaluator } from './jobs/predictionEvaluator.js';
import { startReputationUpdater } from './jobs/reputationUpdater.js';
import { startStockPriceUpdater } from './jobs/stockPriceUpdater.js';

// Load environment variables
dotenv.config();

// Validate environment variables
validateEnv();

// Connect to database
connectDB();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => Logger.info(message.trim()) } }));
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(limiter); // Apply to all requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/social', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'StockForumX API is running' });
});

// Global Error Handler
app.use(errorHandler);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    setupChatHandlers(io, socket);
    setupUpdateHandlers(io, socket);
});

// Start background jobs
startPredictionEvaluator();
startReputationUpdater();
startStockPriceUpdater();

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    Logger.info(`
  ____________________________________________________
 |                                                    |
 |   StockForumX API Server                           |
 |   ----------------------------------------------   |
 |                                                    |
 |   > Status:   Online                               |
 |   > Port:     ${PORT}                                 |
 |   > URL:      http://localhost:${PORT}                |
 |   > Env:      ${process.env.NODE_ENV || 'development'}                          |
 |____________________________________________________|
  `);
});

export { io };
