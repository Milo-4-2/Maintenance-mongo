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
const TaskController = require('../controllers/taskController');

// --- Special routes (must be before /:id to avoid conflicts) ---
router.get('/stats', protect, TaskController.getStats);            // GET    /api/tasks/stats
router.get('/trash', protect, TaskController.getTrash);             // GET    /api/tasks/trash
router.get('/submitted', protect, TaskController.getSubmitted);     // GET    /api/tasks/submitted

// --- Trash & Submit lifecycle routes ---
router.patch('/:id/restore', protect, validateObjectId, TaskController.restoreTask);     // PATCH  /api/tasks/:id/restore
router.delete('/:id/permanent', protect, validateObjectId, TaskController.permanentDelete); // DELETE /api/tasks/:id/permanent
router.post('/:id/submit', protect, validateObjectId, TaskController.submitTask);        // POST   /api/tasks/:id/submit
router.patch('/:id/unsubmit', protect, validateObjectId, TaskController.unsubmitTask);   // PATCH  /api/tasks/:id/unsubmit

// --- Main CRUD routes ---
router.route('/')
    .get(protect, TaskController.getTasks)     // GET    /api/tasks
    .post(protect, TaskController.createTask); // POST   /api/tasks

router.route('/:id')
    .get(protect, validateObjectId, TaskController.getTask)       // GET    /api/tasks/:id
    .put(protect, validateObjectId, TaskController.updateTask)    // PUT    /api/tasks/:id
    .delete(protect, validateObjectId, TaskController.deleteTask); // DELETE /api/tasks/:id

// --- Subtask routes ---
router.post('/:id/subtasks', protect, validateObjectId, TaskController.addSubtask);                  // POST   /api/tasks/:id/subtasks
router.put('/:id/subtasks/:subtaskId', protect, validateObjectId, TaskController.updateSubtask);     // PUT    /api/tasks/:id/subtasks/:subtaskId
router.delete('/:id/subtasks/:subtaskId', protect, validateObjectId, TaskController.deleteSubtask);  // DELETE /api/tasks/:id/subtasks/:subtaskId

// --- Comment routes ---
router.post('/:id/comments', protect, validateObjectId, TaskController.addComment);                  // POST   /api/tasks/:id/comments
router.delete('/:id/comments/:commentId', protect, validateObjectId, TaskController.deleteComment);  // DELETE /api/tasks/:id/comments/:commentId

// --- Assignment routes ---
router.post('/:id/assign', protect, validateObjectId, TaskController.assignUser);                    // POST   /api/tasks/:id/assign
router.delete('/:id/assign/:userId', protect, validateObjectId, TaskController.unassignUser);        // DELETE /api/tasks/:id/assign/:userId

module.exports = router;