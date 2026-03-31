// ============================================
// Task Routes - URL to Controller Mapping
// Defines all task-related API endpoints.
// Every route is protected (requires JWT auth).
// Routes with :id params are validated first.
// ============================================

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
    permanentDelete,
    submitTask,
    getSubmitted,
    unsubmitTask,
    assignUser,
    unassignUser
} = require('../controllers/taskController');

// --- Special routes (must be before /:id to avoid conflicts) ---
router.get('/stats', protect, getStats);            // GET    /api/tasks/stats
router.get('/trash', protect, getTrash);             // GET    /api/tasks/trash
router.get('/submitted', protect, getSubmitted);     // GET    /api/tasks/submitted

// --- Trash & Submit lifecycle routes ---
router.patch('/:id/restore', protect, validateObjectId, restoreTask);     // PATCH  /api/tasks/:id/restore
router.delete('/:id/permanent', protect, validateObjectId, permanentDelete); // DELETE /api/tasks/:id/permanent
router.post('/:id/submit', protect, validateObjectId, submitTask);        // POST   /api/tasks/:id/submit
router.patch('/:id/unsubmit', protect, validateObjectId, unsubmitTask);   // PATCH  /api/tasks/:id/unsubmit

// --- Main CRUD routes ---
router.route('/')
    .get(protect, getTasks)     // GET    /api/tasks
    .post(protect, createTask); // POST   /api/tasks

router.route('/:id')
    .get(protect, validateObjectId, getTask)       // GET    /api/tasks/:id
    .put(protect, validateObjectId, updateTask)    // PUT    /api/tasks/:id
    .delete(protect, validateObjectId, deleteTask); // DELETE /api/tasks/:id

// --- Subtask routes ---
router.post('/:id/subtasks', protect, validateObjectId, addSubtask);                  // POST   /api/tasks/:id/subtasks
router.put('/:id/subtasks/:subtaskId', protect, validateObjectId, updateSubtask);     // PUT    /api/tasks/:id/subtasks/:subtaskId
router.delete('/:id/subtasks/:subtaskId', protect, validateObjectId, deleteSubtask);  // DELETE /api/tasks/:id/subtasks/:subtaskId

// --- Comment routes ---
router.post('/:id/comments', protect, validateObjectId, addComment);                  // POST   /api/tasks/:id/comments
router.delete('/:id/comments/:commentId', protect, validateObjectId, deleteComment);  // DELETE /api/tasks/:id/comments/:commentId

// --- Assignment routes ---
router.post('/:id/assign', protect, validateObjectId, assignUser);                    // POST   /api/tasks/:id/assign
router.delete('/:id/assign/:userId', protect, validateObjectId, unassignUser);        // DELETE /api/tasks/:id/assign/:userId

module.exports = router;