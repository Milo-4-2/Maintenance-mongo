const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc    Get all tasks with filtering, sorting, and pagination
// @route   GET /api/tasks
exports.getTasks = asyncHandler(async (req, res) => {
    const {
        statut,
        priorite,
        categorie,
        etiquette,
        auteur,
        dateDebut,
        dateFin,
        echeanceDebut,
        echeanceFin,
        recherche,
        tri = 'dateCreation',
        ordre = 'desc',
        page = 1,
        limit = 10
    } = req.query;

    // Build filter object - show ALL non-deleted, non-submitted tasks
    const filter = {
        deleted: false,
        submitted: false
    };

    if (statut) filter.statut = statut;
    if (priorite) filter.priorite = priorite;
    if (categorie) filter.categorie = new RegExp(categorie, 'i');
    if (etiquette) filter.etiquettes = etiquette;
    if (auteur) filter['auteur.email'] = new RegExp(auteur, 'i');

    if (dateDebut || dateFin) {
        filter.dateCreation = {};
        if (dateDebut) filter.dateCreation.$gte = new Date(dateDebut);
        if (dateFin) filter.dateCreation.$lte = new Date(dateFin);
    }

    if (echeanceDebut || echeanceFin) {
        filter.echeance = {};
        if (echeanceDebut) filter.echeance.$gte = new Date(echeanceDebut);
        if (echeanceFin) filter.echeance.$lte = new Date(echeanceFin);
    }

    if (recherche) {
        filter.$or = [
            { titre: new RegExp(recherche, 'i') },
            { description: new RegExp(recherche, 'i') }
        ];
    }

    const sortOrder = ordre === 'asc' ? 1 : -1;
    const sortOption = { [tri]: sortOrder };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum);

    const total = await Task.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: tasks.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: tasks
    });
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
exports.getTask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Create new task
// @route   POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
    // Add current user as creator
    req.body.createdBy = req.user.id;

    const task = await Task.create(req.body);

    res.status(201).json({
        success: true,
        data: task
    });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res, next) => {
    let task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    task.historique.push({
        action: 'modification',
        date: new Date(),
        details: 'Tâche mise à jour'
    });

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Soft delete task (move to trash) - Anyone can delete, track who deleted
// @route   DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    task.deleted = true;
    task.deletedAt = new Date();
    task.deletedBy = req.user.id;  // Track who deleted it
    await task.save();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Add subtask to task
// @route   POST /api/tasks/:id/subtasks
exports.addSubtask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    task.sousTaches.push(req.body);
    await task.save();

    res.status(201).json({
        success: true,
        data: task
    });
});

// @desc    Update subtask
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
exports.updateSubtask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    const subtask = task.sousTaches.id(req.params.subtaskId);
    if (!subtask) {
        return next(new ApiError(404, 'Subtask not found'));
    }

    Object.assign(subtask, req.body);
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Delete subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
exports.deleteSubtask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    task.sousTaches.pull(req.params.subtaskId);
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
exports.addComment = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    task.commentaires.push(req.body);
    await task.save();

    res.status(201).json({
        success: true,
        data: task
    });
});

// @desc    Delete comment
// @route   DELETE /api/tasks/:id/comments/:commentId
exports.deleteComment = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found'));
    }

    task.commentaires.pull(req.params.commentId);
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Get deleted tasks (trash) - Anyone can view trash
// @route   GET /api/tasks/trash
exports.getTrash = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find({
        deleted: true
    })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNum);

    const total = await Task.countDocuments({
        deleted: true
    });

    res.status(200).json({
        success: true,
        count: tasks.length,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        data: tasks
    });
});

// @desc    Restore task from trash - Only deleter or creator can restore
// @route   PATCH /api/tasks/:id/restore
exports.restoreTask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: true
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found in trash'));
    }

    // Check if user is the one who deleted it or the creator
    const canRestore =
        (task.deletedBy && task.deletedBy.toString() === req.user.id) ||
        (task.createdBy && task.createdBy.toString() === req.user.id);

    if (!canRestore) {
        return next(new ApiError(403, 'Only the person who deleted this task or its creator can restore it'));
    }

    task.deleted = false;
    task.deletedAt = null;
    task.deletedBy = null;
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Permanently delete task - Only deleter or creator can permanently delete
// @route   DELETE /api/tasks/:id/permanent
exports.permanentDelete = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: true
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found in trash'));
    }

    // Check if user is the one who deleted it or the creator
    const canDelete =
        (task.deletedBy && task.deletedBy.toString() === req.user.id) ||
        (task.createdBy && task.createdBy.toString() === req.user.id);

    if (!canDelete) {
        return next(new ApiError(403, 'Only the person who deleted this task or its creator can permanently delete it'));
    }

    await task.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Submit task
// @route   POST /api/tasks/:id/submit
exports.submitTask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false,
        submitted: false
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found or already submitted'));
    }

    task.submitted = true;
    task.submittedAt = new Date();
    task.submittedBy = req.user.id;
    task.statut = 'terminée'; // Auto-mark as completed
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Get submitted tasks
// @route   GET /api/tasks/submitted
exports.getSubmitted = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find({
        deleted: false,
        submitted: true
    })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum)});

// @desc    Unsubmit task (recover from submitted)
// @route   PATCH /api/tasks/:id/unsubmit
exports.unsubmitTask = asyncHandler(async (req, res, next) => {
    const task = await Task.findOne({
        _id: req.params.id,
        deleted: false,
        submitted: true
    });

    if (!task) {
        return next(new ApiError(404, 'Task not found in submitted'));
    }

    task.submitted = false;
    task.submittedAt = null;
    task.submittedBy = null;
    await task.save();

    res.status(200).json({
        success: true,
        data: task
    });
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats
exports.getStats = asyncHandler(async (req, res) => {
    const stats = await Task.aggregate([
        {
            $match: {
                deleted: false,
                submitted: false
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                aFaire: {
                    $sum: { $cond: [{ $eq: ['$statut', 'à faire'] }, 1, 0] }
                },
                enCours: {
                    $sum: { $cond: [{ $eq: ['$statut', 'en cours'] }, 1, 0] }
                },
                terminee: {
                    $sum: { $cond: [{ $eq: ['$statut', 'terminée'] }, 1, 0] }
                },
                enAttente: {
                    $sum: { $cond: [{ $eq: ['$statut', 'en attente'] }, 1, 0] }
                },
                annulee: {
                    $sum: { $cond: [{ $eq: ['$statut', 'annulée'] }, 1, 0] }
                },
                prioriteBasse: {
                    $sum: { $cond: [{ $eq: ['$priorite', 'basse'] }, 1, 0] }
                },
                prioriteMoyenne: {
                    $sum: { $cond: [{ $eq: ['$priorite', 'moyenne'] }, 1, 0] }
                },
                prioriteHaute: {
                    $sum: { $cond: [{ $eq: ['$priorite', 'haute'] }, 1, 0] }
                },
                prioriteCritique: {
                    $sum: { $cond: [{ $eq: ['$priorite', 'critique'] }, 1, 0] }
                }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: stats[0] || {}
    });
});