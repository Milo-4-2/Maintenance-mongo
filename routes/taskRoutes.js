const express = require('express');
const router = express.Router();
const validateObjectId = require('../middlewares/validateObjectId');
const { protect } = require('../middlewares/auth');
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addComment,
    deleteComment,
    getStats,
    getTrash,
    restoreTask,
    permanentDelete
} = require('../controllers/taskController');

// Stats route (must be before /:id)
router.get('/stats', protect, getStats);

// Trash routes (must be before /:id)
router.get('/trash', protect, getTrash);
router.patch('/:id/restore', protect, validateObjectId, restoreTask);
router.delete('/:id/permanent', protect, validateObjectId, permanentDelete);

// Main task routes
router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.route('/:id')
    .get(protect, validateObjectId, getTask)
    .put(protect, validateObjectId, updateTask)
    .delete(protect, validateObjectId, deleteTask);

// Subtask routes
router.post('/:id/subtasks', protect, validateObjectId, addSubtask);
router.put('/:id/subtasks/:subtaskId', protect, validateObjectId, updateSubtask);
router.delete('/:id/subtasks/:subtaskId', protect, validateObjectId, deleteSubtask);

// Comment routes
router.post('/:id/comments', protect, validateObjectId, addComment);
router.delete('/:id/comments/:commentId', protect, validateObjectId, deleteComment);

module.exports = router;