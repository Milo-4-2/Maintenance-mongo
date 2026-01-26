const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const validateObjectId = (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ApiError(400, 'ID de tâche invalide'));
    }

    next();
};

module.exports = validateObjectId;