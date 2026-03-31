// ============================================
// Auth Routes - URL to Controller Mapping
// Defines all authentication-related endpoints.
// Public routes: register, login
// Private routes (require JWT): me, logout, users
// ============================================

const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, getUsers } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes (no token required)
router.post('/register', register);     // POST /api/auth/register
router.post('/login', login);           // POST /api/auth/login

// Private routes (token required)
router.get('/me', protect, getMe);      // GET  /api/auth/me
router.post('/logout', protect, logout); // POST /api/auth/logout
router.get('/users', protect, getUsers); // GET  /api/auth/users

module.exports = router;