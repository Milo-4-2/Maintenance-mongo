// ============================================
// TaskController - Request Handler Layer
// Thin layer that receives HTTP requests,
// delegates to TaskService, and sends responses.
// Equivalent to Controller in the MVC tutorial.
// ============================================

const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');

// --- Response Helpers (DRY) ---
// Send a success response with data
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
// Send a paginated success response
const paginated = (res, result) => res.status(200).json({ success: true, count: result.tasks.length, total: result.total, page: result.page, pages: result.pages, data: result.tasks });

// --- Task CRUD Endpoints ---
exports.getTasks = asyncHandler(async (req, res) => paginated(res, await taskService.getAllTasks(req.query)));        // GET    /api/tasks
exports.getTask = asyncHandler(async (req, res) => ok(res, await taskService.getTaskById(req.params.id)));            // GET    /api/tasks/:id
exports.createTask = asyncHandler(async (req, res) => ok(res, await taskService.createTask(req.body, req.user.id), 201)); // POST /api/tasks
exports.updateTask = asyncHandler(async (req, res) => ok(res, await taskService.updateTask(req.params.id, req.body))); // PUT   /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => { await taskService.deleteTask(req.params.id, req.user.id); ok(res, {}); }); // DELETE /api/tasks/:id

// --- Subtask Endpoints ---
exports.addSubtask = asyncHandler(async (req, res) => ok(res, await taskService.addSubtask(req.params.id, req.body), 201));               // POST   /api/tasks/:id/subtasks
exports.updateSubtask = asyncHandler(async (req, res) => ok(res, await taskService.updateSubtask(req.params.id, req.params.subtaskId, req.body))); // PUT /api/tasks/:id/subtasks/:subtaskId
exports.deleteSubtask = asyncHandler(async (req, res) => ok(res, await taskService.deleteSubtask(req.params.id, req.params.subtaskId)));  // DELETE /api/tasks/:id/subtasks/:subtaskId

// --- Comment Endpoints ---
exports.addComment = asyncHandler(async (req, res) => ok(res, await taskService.addComment(req.params.id, req.body), 201));  // POST   /api/tasks/:id/comments
exports.deleteComment = asyncHandler(async (req, res) => ok(res, await taskService.deleteComment(req.params.id, req.params.commentId))); // DELETE /api/tasks/:id/comments/:commentId

// --- Trash Endpoints ---
exports.getTrash = asyncHandler(async (req, res) => paginated(res, await taskService.getTrash(req.query)));            // GET    /api/tasks/trash
exports.restoreTask = asyncHandler(async (req, res) => ok(res, await taskService.restoreTask(req.params.id, req.user.id))); // PATCH /api/tasks/:id/restore
exports.permanentDelete = asyncHandler(async (req, res) => { await taskService.permanentDelete(req.params.id, req.user.id); ok(res, {}); }); // DELETE /api/tasks/:id/permanent

// --- Submit Endpoints ---
exports.submitTask = asyncHandler(async (req, res) => ok(res, await taskService.submitTask(req.params.id, req.user.id)));   // POST  /api/tasks/:id/submit
exports.getSubmitted = asyncHandler(async (req, res) => paginated(res, await taskService.getSubmitted(req.query)));         // GET   /api/tasks/submitted
exports.unsubmitTask = asyncHandler(async (req, res) => ok(res, await taskService.unsubmitTask(req.params.id)));           // PATCH /api/tasks/:id/unsubmit

// --- Statistics Endpoint ---
exports.getStats = asyncHandler(async (req, res) => ok(res, await taskService.getStats())); // GET /api/tasks/stats

// --- Assignment Endpoints ---
// POST /api/tasks/:id/assign — Assign a user to a task
exports.assignUser = asyncHandler(async (req, res) => {
    const task = await taskService.assignUser(req.params.id, req.body.userId);
    res.status(200).json({ success: true, data: task });
});

// DELETE /api/tasks/:id/assign/:userId — Remove a user from a task
exports.unassignUser = asyncHandler(async (req, res) => {
    const task = await taskService.unassignUser(req.params.id, req.params.userId);
    res.status(200).json({ success: true, data: task });
});