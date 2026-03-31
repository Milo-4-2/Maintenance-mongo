// ============================================
// ObjectId Validation Middleware
// Checks that the :id route parameter is a
// valid MongoDB ObjectId before reaching the
// controller. Returns 400 if invalid.
// ============================================

const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const validateObjectId = (req, res, next) => {
    const { id } = req.params;

    // Reject requests with malformed ObjectIds early
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ApiError(400, 'ID de tâche invalide'));
    }

    next();
};

module.exports = validateObjectId;