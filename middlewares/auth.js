// ============================================
// Auth Middleware - JWT Token Verification
// Extracts the Bearer token from the Authorization
// header, verifies it, and attaches the user to req.
// Uses userRepository (not the User model directly)
// to respect the clean architecture boundary.
// ============================================

const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Extract token from "Bearer <token>" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // No token provided — reject
    if (!token) {
        return next(new ApiError(401, 'Not authorized to access this route'));
    }

    try {
        // Decode and verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Look up the user via repository (not model directly)
        req.user = await userRepository.findById(decoded.id);

        if (!req.user) {
            return next(new ApiError(401, 'User not found'));
        }

        next(); // User is authenticated — proceed to next middleware
    } catch (error) {
        return next(new ApiError(401, 'Not authorized to access this route'));
    }
});

module.exports = { protect };