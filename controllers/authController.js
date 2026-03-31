const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
        return next(new ApiError(400, 'User already exists'));
    }

    // Create user
    const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName
    });

    if (user) {
        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                token: generateToken(user._id)
            }
        });
    } else {
        return next(new ApiError(400, 'Invalid user data'));
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return next(new ApiError(400, 'Please provide email and password'));
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ApiError(401, 'Invalid credentials'));
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        return next(new ApiError(401, 'Invalid credentials'));
    }

    res.status(200).json({
        success: true,
        data: {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: generateToken(user._id)
        }
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Get all users (for task assignment)
// @route   GET /api/auth/users
// @access  Private
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('username email firstName lastName');

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });
});