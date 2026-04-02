// ============================================
// Auth Routes - URL to Controller Mapping
// Defines all authentication-related endpoints.
// Public routes: register, login
// Private routes (require JWT): me, logout, users
// ============================================

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes (no token required)
router.post('/register', AuthController.register);     // POST /api/auth/register
router.post('/login', AuthController.login);           // POST /api/auth/login

// Private routes (token required)
router.get('/me', protect, AuthController.getMe);      // GET  /api/auth/me
router.post('/logout', protect, AuthController.logout); // POST /api/auth/logout
router.get('/users', protect, AuthController.getUsers); // GET  /api/auth/users

module.exports = router;