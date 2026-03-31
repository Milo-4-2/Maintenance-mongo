const Task = require('../models/Task');

// ============================================
// TaskRepository - Data Access Layer
// Isolates ALL database operations for tasks.
// Equivalent to DataAccess/AnnonceSqlAccess in the MVC tutorial.
//
// All Mongoose document manipulation (save, push, pull)
// is contained here so the service layer remains
// independent of the data access technology.
// ============================================
class TaskRepository {
    // --- Basic CRUD Operations ---

    // Find tasks matching filter, with sorting and pagination
    async findAll(filter, sortOption, skip, limit) {
        return await Task.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
    }

    // Find a single task matching filter criteria
    async findOne(filter) {
        return await Task.findOne(filter);
    }

    // Create a new task document in the database
    async create(data) {
        return await Task.create(data);
    }

    // Update a task by ID with new data
    async update(id, data) {
        return await Task.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    // Count documents matching a filter (used for pagination)
    async count(filter) {
        return await Task.countDocuments(filter);
    }

    // Run a MongoDB aggregation pipeline (used for statistics)
    async aggregate(pipeline) {
        return await Task.aggregate(pipeline);
    }

    // Permanently delete a task from the database
    async deleteById(id) {
        return await Task.findByIdAndDelete(id);
    }

    // --- Soft Delete / Restore ---

    // Mark a task as deleted (keeps it in DB, just hidden)
    async softDelete(id, userId) {
        return await Task.findByIdAndUpdate(id, {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: userId,
            $push: { historique: { action: 'suppression', date: new Date(), details: 'Tâche supprimée' } }
        }, { new: true });
    }

    // Restore a soft-deleted task back to active
    async restore(id) {
        return await Task.findByIdAndUpdate(id, {
            deleted: false,
            deletedAt: null,
            deletedBy: null
        }, { new: true });
    }

    // --- Submit / Unsubmit ---

    // Mark a task as submitted (finalized) and set status to completed
    async submit(id, userId) {
        return await Task.findByIdAndUpdate(id, {
            submitted: true,
            submittedAt: new Date(),
            submittedBy: userId,
            statut: 'terminée'
        }, { new: true });
    }

    // Revert a submitted task back to active
    async unsubmit(id) {
        return await Task.findByIdAndUpdate(id, {
            submitted: false,
            submittedAt: null,
            submittedBy: null
        }, { new: true });
    }

    // --- Subtask Operations ---

    // Add a new subtask to a task's sousTaches array
    async addSubtask(taskId, subtaskData) {
        return await Task.findByIdAndUpdate(taskId, {
            $push: { sousTaches: subtaskData }
        }, { new: true, runValidators: true });
    }

    // Update a specific subtask within the sousTaches array
    async updateSubtask(taskId, subtaskId, data) {
        const setFields = {};
        for (const [key, value] of Object.entries(data)) {
            setFields[`sousTaches.$.${key}`] = value;
        }
        return await Task.findOneAndUpdate(
            { _id: taskId, 'sousTaches._id': subtaskId },
            { $set: setFields },
            { new: true, runValidators: true }
        );
    }

    // Remove a subtask from the sousTaches array
    async removeSubtask(taskId, subtaskId) {
        return await Task.findByIdAndUpdate(taskId, {
            $pull: { sousTaches: { _id: subtaskId } }
        }, { new: true });
    }

    // --- Comment Operations ---

    // Add a new comment to a task's commentaires array
    async addComment(taskId, commentData) {
        return await Task.findByIdAndUpdate(taskId, {
            $push: { commentaires: commentData }
        }, { new: true, runValidators: true });
    }

    // Remove a comment from the commentaires array
    async removeComment(taskId, commentId) {
        return await Task.findByIdAndUpdate(taskId, {
            $pull: { commentaires: { _id: commentId } }
        }, { new: true });
    }

    // --- Assignment Operations ---

    // Assign a user to a task and log it in history
    async addAssignment(taskId, userId) {
        return await Task.findByIdAndUpdate(taskId, {
            $push: {
                assignedTo: { user: userId, assignedAt: new Date() },
                historique: { action: 'modification', date: new Date(), details: 'Member assigned to task' }
            }
        }, { new: true });
    }

    // Remove a user assignment and log it in history
    async removeAssignment(taskId, userId) {
        return await Task.findByIdAndUpdate(taskId, {
            $pull: { assignedTo: { user: userId } },
            $push: { historique: { action: 'modification', date: new Date(), details: 'Member removed from task' } }
        }, { new: true });
    }

    // --- History ---

    // Append a history entry to the task's historique array
    async addHistoryEntry(taskId, entry) {
        return await Task.findByIdAndUpdate(taskId, {
            $push: { historique: entry }
        }, { new: true });
    }
}

module.exports = new TaskRepository();
