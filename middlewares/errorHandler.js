// ============================================
// Global Error Handler Middleware
// Catches all errors thrown in the app and
// returns a consistent JSON error response.
// Handles Mongoose-specific error types.
// Must be registered LAST in Express middleware chain.
// ============================================

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Erreur serveur interne';

    // Mongoose validation error (e.g., required field missing)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors).map(e => e.message);
        message = errors.join(', ');
    }

    // Mongoose duplicate key error (e.g., unique constraint violation)
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Cette valeur existe déjà';
    }

    // Mongoose cast error (e.g., invalid ObjectId format)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'ID invalide';
    }

    // Send JSON error response (include stack trace in development only)
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;