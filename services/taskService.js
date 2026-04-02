const taskRepository = require('../repositories/taskRepository');
const ApiError = require('../utils/ApiError');

// ============================================
// TaskService - Business Logic Layer
// Equivalent to AnnoncesChecking in the MVC tutorial.
// Contains all task business rules: CRUD, filtering,
// subtasks, comments, trash, submit, assignments.
// Delegates all data access to taskRepository.
// ============================================
class TaskService {
    // --- Shared Helpers ---

    // Find a single active task or throw 404
    async _findTask(id, filter = { deleted: { $ne: true } }, errMsg = 'Task not found') {
        const task = await taskRepository.findOne({ _id: id, ...filter });
        if (!task) throw new ApiError(404, errMsg);
        return task;
    }

    // Generic paginated query: returns { tasks, total, page, pages }
    async _paginate(filter, sort, query) {
        const pageNum = parseInt(query.page || 1, 10);
        const limitNum = parseInt(query.limit || 10, 10);
        const skip = (pageNum - 1) * limitNum;
        const tasks = await taskRepository.findAll(filter, sort, skip, limitNum);
        const total = await taskRepository.count(filter);
        return { tasks, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    }

    // Verify the user owns the task (is creator or the one who deleted it)
    _checkOwnership(task, userId) {
        const owns = (task.deletedBy?.toString() === userId) || (task.createdBy?.toString() === userId);
        if (!owns) throw new ApiError(403, 'Only the person who deleted this task or its creator can perform this action');
    }
    // --- Task CRUD ---

    // Build a MongoDB filter from query string parameters
    buildFilter(query) {
        const { statut, priorite, categorie, etiquette, auteur, dateDebut, dateFin, echeanceDebut, echeanceFin, recherche } = query;
        const filter = { deleted: { $ne: true }, submitted: { $ne: true } };
        if (statut) filter.statut = statut;
        if (priorite) filter.priorite = priorite;
        if (categorie) filter.categorie = new RegExp(categorie, 'i');
        if (etiquette) filter.etiquettes = etiquette;
        if (auteur) filter['auteur.email'] = new RegExp(auteur, 'i');
        if (dateDebut || dateFin) { filter.dateCreation = {}; if (dateDebut) filter.dateCreation.$gte = new Date(dateDebut); if (dateFin) filter.dateCreation.$lte = new Date(dateFin); }
        if (echeanceDebut || echeanceFin) { filter.echeance = {}; if (echeanceDebut) filter.echeance.$gte = new Date(echeanceDebut); if (echeanceFin) filter.echeance.$lte = new Date(echeanceFin); }
        if (recherche) filter.$or = [{ titre: new RegExp(recherche, 'i') }, { description: new RegExp(recherche, 'i') }];
        return filter;
    }

    // Get all active tasks with filters, sorting, and pagination
    async getAllTasks(query) {
        const { tri = 'dateCreation', ordre = 'desc' } = query;
        return this._paginate(this.buildFilter(query), { [tri]: ordre === 'asc' ? 1 : -1 }, query);
    }

    async getTaskById(id) { return this._findTask(id); } // Get a single task by ID

    async createTask(data, userId) { data.createdBy = userId; return taskRepository.create(data); } // Create a new task

    // Update a task: log modification in history, then apply changes
    async updateTask(id, data) {
        await this._findTask(id);
        await taskRepository.addHistoryEntry(id, { action: 'modification', date: new Date(), details: 'Tâche mise à jour' });
        return taskRepository.update(id, data);
    }

    async deleteTask(id, userId) { await this._findTask(id); await taskRepository.softDelete(id, userId); } // Soft-delete a task

    // --- Subtask & Comment Operations ---

    async addSubtask(taskId, data) { await this._findTask(taskId); return taskRepository.addSubtask(taskId, data); } // Add subtask
    // Update a specific subtask within a task
    async updateSubtask(taskId, subtaskId, data) {
        await this._findTask(taskId);
        const result = await taskRepository.updateSubtask(taskId, subtaskId, data);
        if (!result) throw new ApiError(404, 'Subtask not found');
        return result;
    }
    async deleteSubtask(taskId, subtaskId) { await this._findTask(taskId); return taskRepository.removeSubtask(taskId, subtaskId); } // Remove subtask
    async addComment(taskId, data) { await this._findTask(taskId); return taskRepository.addComment(taskId, data); } // Add comment
    async deleteComment(taskId, commentId) { await this._findTask(taskId); return taskRepository.removeComment(taskId, commentId); } // Remove comment

    // --- Trash Operations ---

    async getTrash(query) { return this._paginate({ deleted: true }, { deletedAt: -1 }, query); } // List deleted tasks

    // Restore a task from trash (only owner/deleter can do this)
    async restoreTask(id, userId) {
        const task = await this._findTask(id, { deleted: true }, 'Task not found in trash');
        this._checkOwnership(task, userId);
        return taskRepository.restore(id);
    }

    // Permanently remove a task from the database (only owner/deleter)
    async permanentDelete(id, userId) {
        const task = await this._findTask(id, { deleted: true }, 'Task not found in trash');
        this._checkOwnership(task, userId);
        await taskRepository.deleteById(id);
    }

    // --- Submit Operations ---

    // Submit a task: mark as finalized and set status to 'completed'
    async submitTask(id, userId) {
        await this._findTask(id, { deleted: { $ne: true }, submitted: { $ne: true } }, 'Task not found or already submitted');
        return taskRepository.submit(id, userId);
    }

    async getSubmitted(query) { return this._paginate({ deleted: { $ne: true }, submitted: true }, { submittedAt: -1 }, query); } // List submitted tasks

    // Revert a submitted task back to active
    async unsubmitTask(id) {
        await this._findTask(id, { deleted: { $ne: true }, submitted: true }, 'Task not found in submitted');
        return taskRepository.unsubmit(id);
    }

    // --- Statistics ---

    // Aggregate task counts grouped by status and priority
    async getStats() {
        const stats = await taskRepository.aggregate([
            {
                $match: {
                    deleted: { $ne: true },
                    submitted: { $ne: true }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    aFaire: { $sum: { $cond: [{ $eq: ['$statut', 'à faire'] }, 1, 0] } },
                    enCours: { $sum: { $cond: [{ $eq: ['$statut', 'en cours'] }, 1, 0] } },
                    terminee: { $sum: { $cond: [{ $eq: ['$statut', 'terminée'] }, 1, 0] } },
                    enAttente: { $sum: { $cond: [{ $eq: ['$statut', 'en attente'] }, 1, 0] } },
                    annulee: { $sum: { $cond: [{ $eq: ['$statut', 'annulée'] }, 1, 0] } },
                    prioriteBasse: { $sum: { $cond: [{ $eq: ['$priorite', 'basse'] }, 1, 0] } },
                    prioriteMoyenne: { $sum: { $cond: [{ $eq: ['$priorite', 'moyenne'] }, 1, 0] } },
                    prioriteHaute: { $sum: { $cond: [{ $eq: ['$priorite', 'haute'] }, 1, 0] } },
                    prioriteCritique: { $sum: { $cond: [{ $eq: ['$priorite', 'critique'] }, 1, 0] } }
                }
            }
        ]);

        return stats[0] || {};
    }

    // --- Assignment Operations ---

    // Assign a user to a task (prevents duplicate assignments)
    async assignUser(taskId, userId) {
        const task = await this._findTask(taskId);
        const alreadyAssigned = await taskRepository.hasAssignment(taskId, userId);
        if (alreadyAssigned) throw new ApiError(400, 'User already assigned to this task');
        return taskRepository.addAssignment(taskId, userId);
    }

    // Remove a user's assignment from a task
    async unassignUser(taskId, userId) {
        await this._findTask(taskId);
        const result = await taskRepository.removeAssignment(taskId, userId);
        if (!result) throw new ApiError(404, 'User not assigned to this task');
        return result;
    }
}

module.exports = new TaskService();
