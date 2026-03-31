// ============================================
// Server Entry Point (Front Controller)
// Initializes Express app, connects to MongoDB,
// registers middleware, routes, and error handler.
// Equivalent to index.php in the MVC tutorial.
// ============================================

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');

// Initialize Express application
const app = express();

// Connect to MongoDB database
connectDB();

// --- Global Middleware ---
app.use(cors());                              // Enable Cross-Origin Resource Sharing
app.use(express.json());                      // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// Serve static frontend files from /public directory
app.use(express.static('public'));

// --- API Routes ---
app.use('/api/tasks', taskRoutes); // All task-related endpoints
app.use('/api/auth', authRoutes);  // All authentication endpoints

// Root health-check route
app.get('/', (req, res) => {
    res.send('Task Manager API is running...');
});

// Global error handler (must be registered last)
app.use(errorHandler);

// Start listening on configured port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});