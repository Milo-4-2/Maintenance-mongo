const User = require('../models/User');

// ============================================
// UserRepository - Data Access Layer
// Isolates ALL database operations for users.
// Equivalent to DataAccess/Model in the MVC tutorial.
// Only this file imports the User model directly.
// ============================================
class UserRepository {
    // Find a user by their MongoDB ObjectId
    async findById(id) {
        return await User.findById(id);
    }

    // Check if a user exists with the given email or username
    async findByEmailOrUsername(email, username) {
        return await User.findOne({ $or: [{ email }, { username }] });
    }

    // Find user by email and include the password field (for login)
    async findByEmailWithPassword(email) {
        return await User.findOne({ email }).select('+password');
    }

    // Get all users with selected fields (for task assignment dropdown)
    async findAll(selectFields = 'username email firstName lastName') {
        return await User.find().select(selectFields);
    }

    // Create a new user document (password hashing handled by User model hook)
    async create(data) {
        return await User.create(data);
    }
}

module.exports = new UserRepository();
