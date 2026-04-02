// ============================================
// Controller (Front Controller + Action Handlers)
// Orchestrates the frontend: binds events,
// calls API layer, updates views.
// Equivalent to Controller + index.php in MVC.
// Loaded last — depends on utils, api, auth, ui.
// ============================================

// Entry point: initialize theme, bind events, check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeEventListeners();
    checkAuth();
});

// Helper: safely bind an event listener to an element by ID
function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// Helper: wrap async operations with consistent error handling
async function action(fn, errMsg) {
    try { await fn(); }
    catch (e) { console.error(e); }
}

// Register all UI event listeners (forms, buttons, pagination, modals)
function initializeEventListeners() {
    // Auth forms
    on('loginForm', 'submit', login);
    on('registerForm', 'submit', register);
    on('showRegister', 'click', e => { e.preventDefault(); showRegisterPage(); });
    on('showLogin', 'click', e => { e.preventDefault(); showLoginPage(); });
    on('logoutBtn', 'click', logout);

    // Task actions
    on('newTaskBtn', 'click', () => openTaskModal());
    on('taskForm', 'submit', e => { e.preventDefault(); saveTask(); });
    on('cancelBtn', 'click', () => closeTaskModal());

    // Filters
    on('filterForm', 'submit', e => { e.preventDefault(); applyFilters(); });
    on('clearFilters', 'click', () => clearFilters());

    // Main task list pagination
    on('prevPage', 'click', () => { if (currentPage > 1) { currentPage--; loadTasks(); } });
    on('nextPage', 'click', () => { if (currentPage < totalPages) { currentPage++; loadTasks(); } });

    // Feature buttons
    on('statsBtn', 'click', () => loadStats());
    on('submittedBtn', 'click', () => { currentSubmittedPage = 1; loadSubmitted(); });
    on('trashBtn', 'click', () => { currentTrashPage = 1; loadTrash(); });
    on('membersBtn', 'click', () => loadMembers());
    on('themeToggle', 'click', () => toggleTheme());
    on('exportBtn', 'click', () => exportTasks());

    // Trash pagination
    on('trashPrevPage', 'click', () => { if (currentTrashPage > 1) { currentTrashPage--; loadTrash(); } });
    on('trashNextPage', 'click', () => { if (currentTrashPage < totalTrashPages) { currentTrashPage++; loadTrash(); } });

    // Submitted pagination
    on('submittedPrevPage', 'click', () => { if (currentSubmittedPage > 1) { currentSubmittedPage--; loadSubmitted(); } });
    on('submittedNextPage', 'click', () => { if (currentSubmittedPage < totalSubmittedPages) { currentSubmittedPage++; loadSubmitted(); } });

    // Close modals via X button or clicking backdrop
    document.querySelectorAll('.close').forEach(b => b.addEventListener('click', e => e.target.closest('.modal').classList.add('hidden')));
    window.addEventListener('click', e => { if (e.target.classList.contains('modal')) e.target.classList.add('hidden'); });
}

// ---- Task Actions ----

// Fetch and display the task list with current filters and pagination
async function loadTasks() {
    showLoading();
    await action(async () => {
        const data = await TaskAPI.getTasks(currentPage, currentFilters);
        if (data.success) { totalPages = data.pages; renderTasks(data.data); updatePagination(); }
    }, 'Unable to connect to server');
    hideLoading();
}

// Open the task detail modal for a specific task
async function openTaskDetail(taskId) {
    showLoading();
    await action(async () => {
        const data = await TaskAPI.getTask(taskId);
        if (data.success) { renderTaskDetail(data.data); document.getElementById('detailModal').classList.remove('hidden'); }
    }, 'Unable to load details');
    hideLoading();
}

// Mark a task as submitted (moves to Submitted section)
async function submitTask(taskId) {
    if (!confirm('Submit this task? It will be moved to Submitted section.')) return;
    await action(async () => {
        const data = await TaskAPI.submitTask(taskId);
        if (data.success) loadTasks();
    }, 'Unable to submit task');
}

// Revert a submitted task back to active tasks
async function unsubmitTask(taskId) {
    if (!confirm('Unsubmit this task? It will be moved back to active tasks.')) return;
    await action(async () => {
        const data = await TaskAPI.unsubmitTask(taskId);
        if (data.success) { loadSubmitted(); loadTasks(); }
    }, 'Unable to unsubmit task');
}

// Load and display the Submitted tasks modal
async function loadSubmitted() {
    await action(async () => {
        const data = await TaskAPI.getSubmitted(currentSubmittedPage);
        if (data.success) { totalSubmittedPages = data.pages; renderSubmitted(data.data); updateSubmittedPagination(); document.getElementById('submittedModal').classList.remove('hidden'); }
    }, 'Unable to load submitted tasks');
}

// View a submitted task's details
async function viewSubmittedDetail(taskId) {
    await action(async () => {
        const data = await TaskAPI.getTask(taskId);
        if (data.success) { renderTaskDetail(data.data); document.getElementById('submittedModal').classList.add('hidden'); document.getElementById('detailModal').classList.remove('hidden'); }
    }, 'Unable to load details');
}

// Load and display the Trash modal
async function loadTrash() {
    await action(async () => {
        const data = await TaskAPI.getTrash(currentTrashPage);
        if (data.success) { totalTrashPages = data.pages; renderTrash(data.data); updateTrashPagination(); document.getElementById('trashModal').classList.remove('hidden'); }
    }, 'Unable to load trash');
}

// Restore a task from trash back to active
async function restoreTask(taskId) {
    if (!confirm('Restore this task?')) return;
    await action(async () => {
        const data = await TaskAPI.restoreTask(taskId);
        if (data.success) { loadTrash(); loadTasks(); }
    }, 'Unable to restore task');
}

// Permanently delete a task from the database (irreversible)
async function permanentlyDeleteTask(taskId) {
    if (!confirm('⚠️ PERMANENTLY DELETE this task? This cannot be undone!')) return;
    await action(async () => {
        const data = await TaskAPI.permanentlyDeleteTask(taskId);
        if (data.success) loadTrash();
    }, 'Unable to delete task');
}

// ---- Task Modal (Create / Edit) ----

// Open the task creation/editing modal, pre-fill fields if editing
function openTaskModal(task = null) {
    currentTaskId = task ? task._id : null;
    const echeanceInput = document.getElementById('echeance');

    if (task) {
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskId').value = task._id;
        document.getElementById('titre').value = task.titre;
        document.getElementById('description').value = task.description || '';
        document.getElementById('statut').value = task.statut;
        document.getElementById('priorite').value = task.priorite;
        echeanceInput.value = task.echeance ? new Date(task.echeance).toISOString().slice(0, 16) : '';
        Object.assign(echeanceInput, { readOnly: true }); Object.assign(echeanceInput.style, { backgroundColor: '#f5f5f5', cursor: 'not-allowed', opacity: '0.7' });
        document.getElementById('categorie').value = task.categorie || '';
        document.getElementById('etiquettes').value = task.etiquettes ? task.etiquettes.join(', ') : '';
        document.getElementById('auteurNom').value = task.auteur.nom;
        document.getElementById('auteurPrenom').value = task.auteur.prenom;
        document.getElementById('auteurEmail').value = task.auteur.email;
    } else {
        document.getElementById('modalTitle').textContent = 'New Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        Object.assign(echeanceInput, { readOnly: false }); Object.assign(echeanceInput.style, { backgroundColor: '', cursor: '', opacity: '' });
        if (currentUser) {
            document.getElementById('auteurNom').value = currentUser.lastName;
            document.getElementById('auteurPrenom').value = currentUser.firstName;
            document.getElementById('auteurEmail').value = currentUser.email;
        }
    }
    document.getElementById('taskModal').classList.remove('hidden');
}

// Close the task modal and reset form fields
function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
    document.getElementById('taskForm').reset();
    currentTaskId = null;
    const e = document.getElementById('echeance');
    Object.assign(e, { readOnly: false }); Object.assign(e.style, { backgroundColor: '', cursor: '', opacity: '' });
}

// Save a task (create new or update existing based on taskId)
async function saveTask() {
    const taskId = document.getElementById('taskId').value;
    const formData = {
        titre: document.getElementById('titre').value,
        description: document.getElementById('description').value,
        statut: document.getElementById('statut').value,
        priorite: document.getElementById('priorite').value,
        categorie: document.getElementById('categorie').value,
        etiquettes: document.getElementById('etiquettes').value.split(',').map(t => t.trim()).filter(Boolean),
        auteur: { nom: document.getElementById('auteurNom').value, prenom: document.getElementById('auteurPrenom').value, email: document.getElementById('auteurEmail').value }
    };
    if (!taskId) formData.echeance = document.getElementById('echeance').value || null;

    await action(async () => {
        const data = taskId ? await TaskAPI.updateTask(taskId, formData) : await TaskAPI.createTask(formData);
        if (data.success) { closeTaskModal(); currentFilters = {}; currentPage = 1; loadTasks(); }
        else console.warn(data.error || 'Error saving task');
    }, 'Unable to save task');
}

// Load a task for editing in the modal
async function editTask(taskId) {
    await action(async () => {
        const data = await TaskAPI.getTask(taskId);
        if (data.success) openTaskModal(data.data);
    }, 'Error loading task');
}

// Soft-delete a task (moves to trash)
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await action(async () => {
        const data = await TaskAPI.deleteTask(taskId);
        if (data.success) loadTasks();
    }, 'Unable to delete task');
}

// ---- Subtasks & Comments ----

// Prompt user for a subtask title and add it to the task
async function addSubtask(taskId) {
    const titre = prompt('Subtask title:');
    if (!titre) return;
    await action(async () => {
        const data = await TaskAPI.addSubtask(taskId, { titre, statut: 'à faire' });
        if (data.success) openTaskDetail(taskId);
    }, 'Unable to add subtask');
}

// Delete a subtask after confirmation
async function deleteSubtask(taskId, subtaskId) {
    if (!confirm('Delete this subtask?')) return;
    await action(async () => {
        const data = await TaskAPI.deleteSubtask(taskId, subtaskId);
        if (data.success) openTaskDetail(taskId);
    }, 'Unable to delete');
}

// Prompt user for author name and comment text, then add to task
async function addComment(taskId) {
    const auteur = prompt('Your name:');
    if (!auteur) return;
    const texte = prompt('Comment:');
    if (!texte) return;
    await action(async () => {
        const data = await TaskAPI.addComment(taskId, { auteur, texte });
        if (data.success) openTaskDetail(taskId);
    }, 'Unable to add comment');
}

// Delete a comment after confirmation
async function deleteComment(taskId, commentId) {
    if (!confirm('Delete this comment?')) return;
    await action(async () => {
        const data = await TaskAPI.deleteComment(taskId, commentId);
        if (data.success) openTaskDetail(taskId);
    }, 'Unable to delete');
}

// ---- Filters ----

// Read filter form values and reload tasks with applied filters
function applyFilters() {
    currentFilters = {};
    const fields = { statut: 'filterStatut', priorite: 'filterPriorite', recherche: 'filterRecherche', tri: 'filterTri', ordre: 'filterOrdre' };
    for (const [key, id] of Object.entries(fields)) {
        const val = document.getElementById(id).value;
        if (val) currentFilters[key] = val;
    }
    currentPage = 1; loadTasks();
}

// Reset all filters and reload the task list
function clearFilters() {
    document.getElementById('filterForm').reset();
    currentFilters = {}; currentPage = 1; loadTasks();
}

// ---- Stats & Export ----

// Load and display task statistics in a modal
async function loadStats() {
    await action(async () => {
        const data = await TaskAPI.getStats();
        if (data.success) { renderStats(data.data); document.getElementById('statsModal').classList.remove('hidden'); }
    }, 'Unable to load statistics');
}

// Export all tasks as a JSON file download
async function exportTasks() {
    showLoading();
    await action(async () => {
        const data = await TaskAPI.exportAll();
        if (data.success) {
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        }
    }, 'Unable to export tasks');
    hideLoading();
}

// ---- Members ----

// Load and display all registered members in the Members modal
async function loadMembers() {
    await action(async () => {
        const data = await AuthAPI.getUsers();
        if (data.success) { renderMembers(data.data); document.getElementById('membersModal').classList.remove('hidden'); }
    }, 'Unable to load members');
}

// Cached members list and current task ID for the assign dropdown
let _assignUsers = [];
let _assignTaskId = null;
let _assignedIds = new Set();

// Open the assign dropdown: fetch members, cache them, show the list
async function openAssignDropdown(taskId) {
    _assignTaskId = taskId;
    await action(async () => {
        const data = await AuthAPI.getUsers();
        if (!data.success) return;
        _assignUsers = data.data;
        // Collect already-assigned user IDs so we can filter them out
        _assignedIds = new Set();
        document.querySelectorAll('.assigned-item button[onclick*="unassignUser"]').forEach(btn => {
            const match = btn.getAttribute('onclick').match(/unassignUser\('[^']+','([^']+)'\)/);
            if (match) _assignedIds.add(match[1]);
        });
        filterAssignDropdown();
    }, 'Unable to load members');
}

// Filter dropdown items based on what user typed in the search input
function filterAssignDropdown() {
    const input = document.getElementById('assignSearchInput');
    const list = document.getElementById('assignDropdownList');
    if (!input || !list) return;
    const query = input.value.toLowerCase().trim();

    // Filter out already-assigned users, then match by name/username/email
    const filtered = _assignUsers.filter(u => {
        if (_assignedIds.has(u._id)) return false;
        if (!query) return true;
        const full = `${u.firstName} ${u.lastName} ${u.username} ${u.email}`.toLowerCase();
        return full.includes(query);
    });

    if (!filtered.length) {
        list.innerHTML = `<div class="assign-dropdown-empty">${query ? 'No matching members' : 'All members assigned'}</div>`;
    } else {
        list.innerHTML = filtered.map(u => `
            <div class="assign-dropdown-item" onclick="pickAssignUser('${u._id}')">
                <span class="member-avatar-sm">${escapeHtml(u.firstName[0])}${escapeHtml(u.lastName[0])}</span>
                <div>
                    <div>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</div>
                    <div class="assign-dd-sub">@${escapeHtml(u.username)} · ${escapeHtml(u.email)}</div>
                </div>
            </div>`).join('');
    }
    list.classList.add('show');
}

// Assign the selected user to the task and refresh detail view
async function pickAssignUser(userId) {
    const list = document.getElementById('assignDropdownList');
    if (list) list.classList.remove('show');
    const input = document.getElementById('assignSearchInput');
    if (input) input.value = '';

    await action(async () => {
        const res = await AssignAPI.assign(_assignTaskId, userId);
        if (res.success) await openTaskDetail(_assignTaskId);
    }, 'Unable to assign member');
}

// Close the assign dropdown when clicking outside
document.addEventListener('click', e => {
    const wrap = document.querySelector('.assign-dropdown-wrap');
    if (wrap && !wrap.contains(e.target)) {
        const list = document.getElementById('assignDropdownList');
        if (list) list.classList.remove('show');
    }
});

// Remove a user from a task's assigned members
async function unassignUser(taskId, userId) {
    if (!confirm('Remove this member from the task?')) return;
    await action(async () => {
        const data = await AssignAPI.unassign(taskId, userId);
        if (data.success) await openTaskDetail(taskId);
    }, 'Unable to remove member');
}
