const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

// ============================================
// AuthService - Business Logic Layer
// Equivalent to UserChecking in the MVC tutorial.
// Handles authentication rules: register, login,
// token generation. Delegates data access to
// userRepository (never touches the User model).
// ============================================
class AuthService {
    // Generate a JWT token with 30-day expiry
    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
    }

    // Register a new user: check for duplicates, create account, return token
    async register({ username, email, password, firstName, lastName }) {
        const userExists = await userRepository.findByEmailOrUsername(email, username);
        if (userExists) {
            throw new ApiError(400, 'User already exists');
        }

        const user = await userRepository.create({
            username, email, password, firstName, lastName
        });

        if (!user) {
            throw new ApiError(400, 'Invalid user data');
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: this.generateToken(user._id)
        };
    }

    // Login: validate credentials and return user data with token
    async login(email, password) {
        if (!email || !password) {
            throw new ApiError(400, 'Please provide email and password');
        }

        const user = await userRepository.findByEmailWithPassword(email);
        if (!user) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            throw new ApiError(401, 'Invalid credentials');
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: this.generateToken(user._id)
        };
    }

    // Get the currently authenticated user's profile
    async getCurrentUser(userId) {
        return await userRepository.findById(userId);
    }

    // Get all users (used for the task assignment dropdown)
    async getAllUsers() {
        return await userRepository.findAll();
    }
}

module.exports = new AuthService();
