import Logger from '../utils/logger.js';

/**
 * Standardized Error Response Class
 */
export class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async Error Handler Wrapper
 * Eliminates need for try/catch blocks in routes
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for dev
    Logger.error(`${err.name}: ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
        Logger.debug(err.stack);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ErrorResponse(message, 44);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
