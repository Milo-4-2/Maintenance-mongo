// ============================================
// TaskController - Request Handler Layer
// Thin layer that receives HTTP requests,
// delegates to TaskService, and sends responses.
// Equivalent to Controller in the MVC tutorial.
// ============================================

const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');

class TaskController {
    // --- Response Helpers (DRY) ---
    // Send a success response with data
    static ok(res, data, status = 200) { res.status(status).json({ success: true, data }); }
    // Send a paginated success response
    static paginated(res, result) { res.status(200).json({ success: true, count: result.tasks.length, total: result.total, page: result.page, pages: result.pages, data: result.tasks }); }

    // --- Task CRUD Endpoints ---
    static getTasks = asyncHandler(async (req, res) => TaskController.paginated(res, await taskService.getAllTasks(req.query)));        // GET    /api/tasks
    static getTask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.getTaskById(req.params.id)));            // GET    /api/tasks/:id
    static createTask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.createTask(req.body, req.user.id), 201)); // POST /api/tasks
    static updateTask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.updateTask(req.params.id, req.body))); // PUT   /api/tasks/:id
    static deleteTask = asyncHandler(async (req, res) => { await taskService.deleteTask(req.params.id, req.user.id); TaskController.ok(res, {}); }); // DELETE /api/tasks/:id

    // --- Subtask Endpoints ---
    static addSubtask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.addSubtask(req.params.id, req.body), 201));               // POST   /api/tasks/:id/subtasks
    static updateSubtask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.updateSubtask(req.params.id, req.params.subtaskId, req.body))); // PUT /api/tasks/:id/subtasks/:subtaskId
    static deleteSubtask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.deleteSubtask(req.params.id, req.params.subtaskId)));  // DELETE /api/tasks/:id/subtasks/:subtaskId

    // --- Comment Endpoints ---
    static addComment = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.addComment(req.params.id, req.body), 201));  // POST   /api/tasks/:id/comments
    static deleteComment = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.deleteComment(req.params.id, req.params.commentId))); // DELETE /api/tasks/:id/comments/:commentId

    // --- Trash Endpoints ---
    static getTrash = asyncHandler(async (req, res) => TaskController.paginated(res, await taskService.getTrash(req.query)));            // GET    /api/tasks/trash
    static restoreTask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.restoreTask(req.params.id, req.user.id))); // PATCH /api/tasks/:id/restore
    static permanentDelete = asyncHandler(async (req, res) => { await taskService.permanentDelete(req.params.id, req.user.id); TaskController.ok(res, {}); }); // DELETE /api/tasks/:id/permanent

    // --- Submit Endpoints ---
    static submitTask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.submitTask(req.params.id, req.user.id)));   // POST  /api/tasks/:id/submit
    static getSubmitted = asyncHandler(async (req, res) => TaskController.paginated(res, await taskService.getSubmitted(req.query)));         // GET   /api/tasks/submitted
    static unsubmitTask = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.unsubmitTask(req.params.id)));           // PATCH /api/tasks/:id/unsubmit

    // --- Statistics Endpoint ---
    static getStats = asyncHandler(async (req, res) => TaskController.ok(res, await taskService.getStats())); // GET /api/tasks/stats

    // --- Assignment Endpoints ---
    static assignUser = asyncHandler(async (req, res) => {                    // POST   /api/tasks/:id/assign
        const task = await taskService.assignUser(req.params.id, req.body.userId);
        res.status(200).json({ success: true, data: task });
    });

    static unassignUser = asyncHandler(async (req, res) => {                  // DELETE /api/tasks/:id/assign/:userId
        const task = await taskService.unassignUser(req.params.id, req.params.userId);
        res.status(200).json({ success: true, data: task });
    });
}

module.exports = TaskController;