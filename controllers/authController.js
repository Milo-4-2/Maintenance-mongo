// ============================================
// AuthController - Request Handler Layer
// Handles authentication HTTP requests.
// Delegates business logic to AuthService.
// ============================================

const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/auth/register — Create a new user account
exports.register = asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    res.status(201).json({ success: true, data });
});

// POST /api/auth/login — Authenticate and return JWT token
exports.login = asyncHandler(async (req, res) => {
    const data = await authService.login(req.body.email, req.body.password);
    res.status(200).json({ success: true, data });
});

// GET /api/auth/me — Get the currently logged-in user's profile
exports.getMe = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: user });
});

// POST /api/auth/logout — Logout (client-side clears token)
exports.logout = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: {} });
});

// GET /api/auth/users — List all users (for task assignment dropdown)
exports.getUsers = asyncHandler(async (req, res) => {
    const users = await authService.getAllUsers();
    res.status(200).json({ success: true, count: users.length, data: users });
});