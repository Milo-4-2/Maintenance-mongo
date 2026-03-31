// ============================================
// Data Access Layer (API Calls)
// All HTTP communication with the backend.
// Equivalent to Model/DataAccess in MVC.
// Uses a generic api() helper to avoid repetition.
// ============================================

// Generic fetch wrapper: sends request, returns parsed JSON
function api(url, method = 'GET', body = null) {
    const opts = { method, headers: getHeaders() };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(r => r.json());
}

// --- Task API Endpoints ---
const TaskAPI = {
    getTasks(page, filters) {                                                    // GET    /api/tasks (with pagination & filters)
        const params = new URLSearchParams({ page, limit: 9, _t: Date.now(), ...filters });
        return api(`${API_URL}?${params}`);
    },
    getTask: (id) => api(`${API_URL}/${id}`),                                    // GET    /api/tasks/:id
    createTask: (data) => api(API_URL, 'POST', data),                            // POST   /api/tasks
    updateTask: (id, data) => api(`${API_URL}/${id}`, 'PUT', data),              // PUT    /api/tasks/:id
    deleteTask: (id) => api(`${API_URL}/${id}`, 'DELETE'),                        // DELETE /api/tasks/:id (soft delete)
    submitTask: (id) => api(`${API_URL}/${id}/submit`, 'POST'),                  // POST   /api/tasks/:id/submit
    unsubmitTask: (id) => api(`${API_URL}/${id}/unsubmit`, 'PATCH'),             // PATCH  /api/tasks/:id/unsubmit
    getSubmitted: (page) => api(`${API_URL}/submitted?page=${page}&limit=9`),    // GET    /api/tasks/submitted
    getTrash: (page) => api(`${API_URL}/trash?page=${page}&limit=9`),            // GET    /api/tasks/trash
    restoreTask: (id) => api(`${API_URL}/${id}/restore`, 'PATCH'),               // PATCH  /api/tasks/:id/restore
    permanentlyDeleteTask: (id) => api(`${API_URL}/${id}/permanent`, 'DELETE'),  // DELETE /api/tasks/:id/permanent
    addSubtask: (id, data) => api(`${API_URL}/${id}/subtasks`, 'POST', data),    // POST   /api/tasks/:id/subtasks
    deleteSubtask: (id, sid) => api(`${API_URL}/${id}/subtasks/${sid}`, 'DELETE'),// DELETE /api/tasks/:id/subtasks/:sid
    addComment: (id, data) => api(`${API_URL}/${id}/comments`, 'POST', data),    // POST   /api/tasks/:id/comments
    deleteComment: (id, cid) => api(`${API_URL}/${id}/comments/${cid}`, 'DELETE'),// DELETE /api/tasks/:id/comments/:cid
    getStats: () => api(`${API_URL}/stats`),                                     // GET    /api/tasks/stats
    exportAll: () => api(`${API_URL}?limit=1000`)                                // GET    /api/tasks?limit=1000
};

// --- Auth API Endpoints ---
const AuthAPI = {
    login: (email, password) => api(`${AUTH_URL}/login`, 'POST', { email, password }), // POST /api/auth/login
    register: (data) => api(`${AUTH_URL}/register`, 'POST', data),                     // POST /api/auth/register
    getMe: () => api(`${AUTH_URL}/me`),                                                // GET  /api/auth/me
    getUsers: () => api(`${AUTH_URL}/users`)                                           // GET  /api/auth/users (all members)
};

// --- Assignment API Endpoints ---
const AssignAPI = {
    assign: (taskId, userId) => api(`${API_URL}/${taskId}/assign`, 'POST', { userId }),       // POST   /api/tasks/:id/assign
    unassign: (taskId, userId) => api(`${API_URL}/${taskId}/assign/${userId}`, 'DELETE')       // DELETE /api/tasks/:id/assign/:userId
};
