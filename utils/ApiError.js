// ============================================
// Custom API Error Class
// Extends native Error with an HTTP status code.
// Used throughout the app to throw structured
// errors that the errorHandler middleware catches.
// ============================================

class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = ApiError;