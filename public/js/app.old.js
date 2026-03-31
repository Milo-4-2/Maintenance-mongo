// API Configuration
const API_URL = 'http://localhost:3000/api/tasks';
const AUTH_URL = 'http://localhost:3000/api/auth';

// State Management
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};
let currentTaskId = null;
let currentUser = null;
let authToken = localStorage.getItem('token') || null;

// Trash state
let currentTrashPage = 1;
let totalTrashPages = 1;

// Submitted state
let currentSubmittedPage = 1;
let totalSubmittedPages = 1;

// Theme Management
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const loginPage = document.getElementById('loginPage');
const registerPage = document.getElementById('registerPage');
const mainApp = document.getElementById('mainApp');
const tasksContainer = document.getElementById('tasksContainer');
const loading = document.getElementById('loading');
const taskModal = document.getElementById('taskModal');
const detailModal = document.getElementById('detailModal');
const statsModal = document.getElementById('statsModal');
const taskForm = document.getElementById('taskForm');
const pagination = document.getElementById('pagination');

// Status translations for display
const STATUS_LABELS = {
    'à faire': 'To Do',
    'en cours': 'In Progress',
    'terminée': 'Completed',
    'en attente': 'Pending',
    'annulée': 'Cancelled'
};

const PRIORITY_LABELS = {
    'basse': 'Low',
    'moyenne': 'Medium',
    'haute': 'High',
    'critique': 'Critical'
};

// Initialize Theme
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

// Toggle Theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

// Update Theme Icon
function updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        themeToggle.title = currentTheme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode';
    }
}

// Check Authentication
function checkAuth() {
    if (authToken) {
        showMainApp();
        loadCurrentUser();
    } else {
        showLoginPage();
    }
}

// Show Pages
function showLoginPage() {
    loginPage.classList.remove('hidden');
    registerPage.classList.add('hidden');
    mainApp.classList.add('hidden');
}

function showRegisterPage() {
    loginPage.classList.add('hidden');
    registerPage.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    loginPage.classList.add('hidden');
    registerPage.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

// Load Current User
async function loadCurrentUser() {
    try {
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.data;
            document.getElementById('userInfo').textContent = `Hello, ${currentUser.firstName}!`;
            loadTasks();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Error loading user:', error);
        logout();
    }
}

// Register
async function register(e) {
    e.preventDefault();

    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                username,
                email,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.data.token;
            localStorage.setItem('token', authToken);
            currentUser = data.data;
            showSuccess('Account created successfully!');
            showMainApp();
            loadTasks();
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Unable to register. Please try again.');
    }
}

// Login
async function login(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.data.token;
            localStorage.setItem('token', authToken);
            currentUser = data.data;
            showSuccess('Login successful!');
            showMainApp();
            document.getElementById('userInfo').textContent = `Hello, ${currentUser.firstName}!`;
            loadTasks();
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Unable to login. Please try again.');
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    showLoginPage();
    showSuccess('Logged out successfully!');
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeEventListeners();
    checkAuth();
});

// Event Listeners
function initializeEventListeners() {
    // Auth Forms
    document.getElementById('loginForm').addEventListener('submit', login);
    document.getElementById('registerForm').addEventListener('submit', register);

    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterPage();
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginPage();
    });

    // Only initialize main app listeners if elements exist
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    const newTaskBtn = document.getElementById('newTaskBtn');
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', () => {
            openTaskModal();
        });
    }

    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            clearFilters();
        });
    }

    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTask();
        });
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeTaskModal();
        });
    }

    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    const prevPageBtn = document.getElementById('prevPage');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadTasks();
            }
        });
    }

    const nextPageBtn = document.getElementById('nextPage');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadTasks();
            }
        });
    }

    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            loadStats();
        });
    }

    const submittedBtn = document.getElementById('submittedBtn');
    if (submittedBtn) {
        submittedBtn.addEventListener('click', () => {
            currentSubmittedPage = 1;
            loadSubmitted();
        });
    }

    const trashBtn = document.getElementById('trashBtn');
    if (trashBtn) {
        trashBtn.addEventListener('click', () => {
            currentTrashPage = 1;
            loadTrash();
        });
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            toggleTheme();
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportTasks();
        });
    }

    // Trash pagination
    const trashPrevPage = document.getElementById('trashPrevPage');
    if (trashPrevPage) {
        trashPrevPage.addEventListener('click', () => {
            if (currentTrashPage > 1) {
                currentTrashPage--;
                loadTrash();
            }
        });
    }

    const trashNextPage = document.getElementById('trashNextPage');
    if (trashNextPage) {
        trashNextPage.addEventListener('click', () => {
            if (currentTrashPage < totalTrashPages) {
                currentTrashPage++;
                loadTrash();
            }
        });
    }

    // Submitted pagination
    const submittedPrevPage = document.getElementById('submittedPrevPage');
    if (submittedPrevPage) {
        submittedPrevPage.addEventListener('click', () => {
            if (currentSubmittedPage > 1) {
                currentSubmittedPage--;
            }
        });
    }

    const submittedNextPage = document.getElementById('submittedNextPage');
    if (submittedNextPage) {
        submittedNextPage.addEventListener('click', () => {
            if (currentSubmittedPage < totalSubmittedPages) {
                currentSubmittedPage++;
                loadSubmitted();
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
}

// API Helper - Add Authorization Header
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}

// Load Tasks - FIX: Added Cache Buster
async function loadTasks() {
    showLoading();

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 9,
            _t: Date.now(), // FIX: Prevents 304 errors
            ...currentFilters
        });

        const response = await fetch(`${API_URL}?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            totalPages = data.pages;
            renderTasks(data.data);
            updatePagination();
        } else {
            showError('Error loading tasks');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showError('Unable to connect to server');
    } finally {
        hideLoading();
    }
}

// Render Tasks
function renderTasks(tasks) {
    tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--secondary);">
                <h3>No tasks found</h3>
                <p>Create your first task to get started!</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksContainer.appendChild(taskCard);
    });
}

// Create Task Card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.onclick = () => openTaskDetail(task._id);

    const prioriteClass = `priorite-${task.priorite}`;
    const echeance = task.echeance ? new Date(task.echeance).toLocaleDateString('en-US') : 'None';
    const dateCreation = new Date(task.dateCreation).toLocaleDateString('en-US');

    const tags = task.etiquettes && task.etiquettes.length > 0
        ? task.etiquettes.map(tag => `<span class="tag">${tag}</span>`).join('')
        : '';

    const subtaskCount = task.sousTaches ? task.sousTaches.length : 0;
    const completedSubtasks = task.sousTaches ? task.sousTaches.filter(st => st.statut === 'terminée').length : 0;

    card.innerHTML = `
        <div class="task-card-header">
            <div>
                <h3 class="task-title">${escapeHtml(task.titre)}</h3>
                <span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span>
                <span class="badge badge-priorite ${prioriteClass}">${PRIORITY_LABELS[task.priorite]}</span>
                ${task.submitted ? '<span class="badge" style="background: var(--success); color: white;">✓ Submitted</span>' : ''}
            </div>
        </div>
        
        ${task.description ? `<p class="task-description">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>` : ''}
        
        ${task.categorie ? `<div class="task-meta"><span class="badge" style="background: var(--info); color: white;">${escapeHtml(task.categorie)}</span></div>` : ''}
        
        ${tags ? `<div class="task-tags">${tags}</div>` : ''}
        
        ${subtaskCount > 0 ? `<div class="task-meta"><span class="badge" style="background: var(--success); color: white;">${completedSubtasks}/${subtaskCount} subtasks</span></div>` : ''}
        
        <div class="task-footer">
            <div class="task-date">
                <div>Created: ${dateCreation}</div>
                ${task.echeance ? `<div>Deadline: ${echeance}</div>` : ''}
            </div>
            <div class="task-actions" onclick="event.stopPropagation()">
                <button class="btn btn-success" onclick="submitTask('${task._id}')">Submit</button>
                <button class="btn btn-primary" onclick="editTask('${task._id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteTask('${task._id}')">Delete</button>
            </div>
        </div>
    `;

    return card;
}

// Submit Task
async function submitTask(taskId) {
    if (!confirm('Submit this task? It will be moved to Submitted section.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${taskId}/submit`, {
            method: 'POST',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Task submitted successfully!');
            loadTasks();
        } else {
            showError('Error submitting task');
        }
    } catch (error) {
        console.error('Error submitting task:', error);
        showError('Unable to submit task');
    }
}

// Load Submitted Tasks
async function loadSubmitted() {
    try {
        const response = await fetch(`${API_URL}/submitted?page=${currentSubmittedPage}&limit=9`, {
            headers: getHeaders(),
        });
        const data = await response.json();

        if (data.success) {
            totalSubmittedPages = data.pages;
            renderSubmitted(data.data);
            updateSubmittedPagination();
            document.getElementById('submittedModal').classList.remove('hidden');
        } else {
            showError('Error loading submitted tasks');
        }
    } catch (error) {
        console.error('Error loading submitted tasks:', error);
        showError('Unable to load submitted tasks');
    }
}

// Render Submitted Tasks
function renderSubmitted(tasks) {
    const submittedContainer = document.getElementById('submittedContainer');
    submittedContainer.innerHTML = '';

    if (tasks.length === 0) {
        submittedContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--secondary);">
                <h3>No submitted tasks</h3>
                <p>Submit tasks to see them here</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const card = createSubmittedCard(task);
        submittedContainer.appendChild(card);
    });
}

// Create Submitted Card
function createSubmittedCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const prioriteClass = `priorite-${task.priorite}`;
    const submittedAt = task.submittedAt ? new Date(task.submittedAt).toLocaleDateString('en-US') : 'Unknown';

    card.innerHTML = `
        <div class="task-card-header">
            <div>
                <h3 class="task-title">${escapeHtml(task.titre)}</h3>
                <span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span>
                <span class="badge badge-priorite ${prioriteClass}">${PRIORITY_LABELS[task.priorite]}</span>
            </div>
        </div>
        
        ${task.description ? `<p class="task-description">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>` : ''}
        
        <div class="task-footer">
            <div class="task-date">
                <div>Submitted: ${submittedAt}</div>
                <div style="font-size: 12px; color: var(--secondary);">By: ${escapeHtml(task.auteur.prenom)} ${escapeHtml(task.auteur.nom)}</div>
            </div>
            <div class="task-actions">
                <button class="btn btn-info" onclick="viewSubmittedDetail('${task._id}')">View</button>
                <button class="btn btn-warning" onclick="unsubmitTask('${task._id}')">Unsubmit</button>
            </div>
        </div>
    `;

    return card;
}

// View Submitted Task Detail
async function viewSubmittedDetail(taskId) {
    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            headers: getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            renderTaskDetail(data.data);
            document.getElementById('submittedModal').classList.add('hidden');
            detailModal.classList.remove('hidden');
        } else {
            showError('Error loading task details');
        }
    } catch (error) {
        console.error('Error loading task detail:', error);
        showError('Unable to load details');
    }
}

// Unsubmit Task
async function unsubmitTask(taskId) {
    if (!confirm('Unsubmit this task? It will be moved back to active tasks.')) return;

    try {
        const response = await fetch(`${API_URL}/${taskId}/unsubmit`, {
            method: 'PATCH',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Task unsubmitted successfully!');
            loadSubmitted();
            loadTasks();
        } else {
            showError('Error unsubmitting task');
        }
    } catch (error) {
        console.error('Error unsubmitting task:', error);
        showError('Unable to unsubmit task');
    }
}

// Update Submitted Pagination
function updateSubmittedPagination() {
    const submittedPagination = document.getElementById('submittedPagination');
    const submittedPageInfo = document.getElementById('submittedPageInfo');
    const submittedPrevPage = document.getElementById('submittedPrevPage');
    const submittedNextPage = document.getElementById('submittedNextPage');

    if (submittedPageInfo) {
        submittedPageInfo.textContent = `Page ${currentSubmittedPage} of ${totalSubmittedPages}`;
    }

    if (submittedPrevPage) {
        submittedPrevPage.disabled = currentSubmittedPage === 1;
    }

    if (submittedNextPage) {
        submittedNextPage.disabled = currentSubmittedPage === totalSubmittedPages;
    }

    if (submittedPagination) {
        submittedPagination.classList.remove('hidden');
    }
}

// Load Trash
async function loadTrash() {
    try {
        const response = await fetch(`${API_URL}/trash?page=${currentTrashPage}&limit=9`, {
            headers: getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            totalTrashPages = data.pages;
            renderTrash(data.data);
            updateTrashPagination();
            document.getElementById('trashModal').classList.remove('hidden');
        } else {
            showError('Error loading trash');
        }
    } catch (error) {
        console.error('Error loading trash:', error);
        showError('Unable to load trash');
    }
}

// Render Trash
function renderTrash(tasks) {
    const trashContainer = document.getElementById('trashContainer');
    trashContainer.innerHTML = '';

    if (tasks.length === 0) {
        trashContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--secondary);">
                <h3>Trash is empty</h3>
                <p>No deleted tasks</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const card = createTrashCard(task);
        trashContainer.appendChild(card);
    });
}

// Create Trash Card
function createTrashCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const prioriteClass = `priorite-${task.priorite}`;
    const deletedAt = task.deletedAt ? new Date(task.deletedAt).toLocaleDateString('en-US') : 'Unknown';
    let deletedByText = 'Unknown';
    if (task.deletedBy) {
        // If it's current user
        if (currentUser && task.deletedBy === currentUser.id) {
            deletedByText = 'You';
        } else {
            deletedByText = 'Another user';
        }
    }
    const isOwner = currentUser && task.createdBy === currentUser.id;

    card.innerHTML = `
        <div class="task-card-header">
            <div>
                <h3 class="task-title">${escapeHtml(task.titre)}</h3>
                <span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span>
                <span class="badge badge-priorite ${prioriteClass}">${PRIORITY_LABELS[task.priorite]}</span>
            </div>
        </div>
        
        ${task.description ? `<p class="task-description">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</p>` : ''}
        
        <div class="task-footer">
            <div class="task-date">
                 <div class="task-date">
            <div>Deleted: ${deletedAt}</div>
            <div style="font-size: 12px; color: var(--secondary);">Created by: ${escapeHtml(task.auteur.prenom)} ${escapeHtml(task.auteur.nom)}</div>
            <div style="font-size: 12px; color: var(--danger); margin-top: 3px;">🗑️ Deleted by: ${deletedByText}</div>
        </div>
            </div>
            <div class="task-actions">
                ${isOwner ? `
                    <button class="btn btn-success" onclick="restoreTask('${task._id}')">Restore</button>
                    <button class="btn btn-danger" onclick="permanentlyDeleteTask('${task._id}')">Delete Forever</button>
                ` : `
                    <span style="font-size: 12px; color: var(--secondary);">Only creator can restore/delete</span>
                `}
            </div>
        </div>
    `;

    return card;
}

// Restore Task
async function restoreTask(taskId) {
    if (!confirm('Restore this task?')) return;

    try {
        const response = await fetch(`${API_URL}/${taskId}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Task restored successfully!');
            loadTrash();
            loadTasks();
        } else {
            showError('Error restoring task');
        }
    } catch (error) {
        console.error('Error restoring task:', error);
        showError('Unable to restore task');
    }
}

// Permanently Delete Task
async function permanentlyDeleteTask(taskId) {
    if (!confirm('⚠️ PERMANENTLY DELETE this task? This cannot be undone!')) return;

    try {
        const response = await fetch(`${API_URL}/${taskId}/permanent`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Task permanently deleted!');
            loadTrash();
        } else {
            showError('Error deleting task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Unable to delete task');
    }
}

// Update Trash Pagination
function updateTrashPagination() {
    const trashPagination = document.getElementById('trashPagination');
    const trashPageInfo = document.getElementById('trashPageInfo');
    const trashPrevPage = document.getElementById('trashPrevPage');
    const trashNextPage = document.getElementById('trashNextPage');

    if (trashPageInfo) {
        trashPageInfo.textContent = `Page ${currentTrashPage} of ${totalTrashPages}`;
    }

    if (trashPrevPage) {
        trashPrevPage.disabled = currentTrashPage === 1;
    }

    if (trashNextPage) {
        trashNextPage.disabled = currentTrashPage === totalTrashPages;
    }

    if (trashPagination) {
        trashPagination.classList.remove('hidden');
    }
}

// Open Task Detail
async function openTaskDetail(taskId) {
    showLoading();

    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            headers: getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            renderTaskDetail(data.data);
            detailModal.classList.remove('hidden');
        } else {
            showError('Error loading details');
        }
    } catch (error) {
        console.error('Error loading task detail:', error);
        showError('Unable to load details');
    } finally {
        hideLoading();
    }
}

// Render Task Detail
function renderTaskDetail(task) {
    const echeance = task.echeance ? new Date(task.echeance).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'None';

    const dateCreation = new Date(task.dateCreation).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const subtasksHtml = task.sousTaches && task.sousTaches.length > 0
        ? task.sousTaches.map(st => `
            <div class="subtask-item">
                <div class="subtask-content">
                    <div class="subtask-title">${escapeHtml(st.titre)}</div>
                    <span class="badge badge-statut">${STATUS_LABELS[st.statut]}</span>
                    ${st.echeance ? `<div style="font-size: 12px; color: var(--secondary); margin-top: 5px;">${new Date(st.echeance).toLocaleDateString('en-US')}</div>` : ''}
                </div>
                <button class="btn btn-danger btn-sm" onclick="deleteSubtask('${task._id}', '${st._id}')">Delete</button>
            </div>
        `).join('')
        : '<div class="no-items">No subtasks</div>';

    const commentsHtml = task.commentaires && task.commentaires.length > 0
        ? task.commentaires.map(c => `
            <div class="comment-item">
                <div class="comment-content">
                    <div class="comment-author">${escapeHtml(c.auteur)}</div>
                    <div class="comment-text">${escapeHtml(c.texte)}</div>
                    <div class="comment-date">${new Date(c.date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}</div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="deleteComment('${task._id}', '${c._id}')">Delete</button>
            </div>
        `).join('')
        : '<div class="no-items">No comments</div>';

    const tagsHtml = task.etiquettes && task.etiquettes.length > 0
        ? task.etiquettes.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
        : '<span style="color: var(--secondary); font-style: italic;">No tags</span>';

    document.getElementById('taskDetail').innerHTML = `
        <h2>${escapeHtml(task.titre)}</h2>
        
        <div class="detail-section">
            <h3>General Information</h3>
            <div class="detail-info">
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="detail-value"><span class="badge badge-statut">${STATUS_LABELS[task.statut]}</span></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Priority</span>
                    <span class="detail-value"><span class="badge badge-priorite priorite-${task.priorite}">${PRIORITY_LABELS[task.priorite]}</span></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created</span>
                    <span class="detail-value">${dateCreation}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Deadline</span>
                    <span class="detail-value">${echeance}</span>
                </div>
                ${task.categorie ? `
                    <div class="detail-item">
                        <span class="detail-label">Category</span>
                        <span class="detail-value">${escapeHtml(task.categorie)}</span>
                    </div>
                ` : ''}
               
            </div>
            
            ${task.description ? `
                <div class="detail-item" style="margin-top: 15px;">
                    <span class="detail-label">Description</span>
                    <p class="detail-value" style="margin-top: 10px;">${escapeHtml(task.description)}</p>
                </div>
            ` : ''}
            
            <div class="detail-item" style="margin-top: 15px;">
                <span class="detail-label">Tags</span>
                <div style="margin-top: 10px;">${tagsHtml}</div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Author</h3>
            <div class="detail-info">
                <div class="detail-item">
                    <span class="detail-label">Full Name</span>
                    <span class="detail-value">${escapeHtml(task.auteur.prenom)} ${escapeHtml(task.auteur.nom)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${escapeHtml(task.auteur.email)}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Subtasks</h3>
            ${subtasksHtml}
            <button class="btn btn-primary" style="margin-top: 15px;" onclick="addSubtask('${task._id}')">Add Subtask</button>
        </div>

        <div class="detail-section">
            <h3>Comments</h3>
            ${commentsHtml}
            <button class="btn btn-primary" style="margin-top: 15px;" onclick="addComment('${task._id}')">Add Comment</button>
        </div>
    `;
}

// Open Task Modal
function openTaskModal(task = null) {
    currentTaskId = task ? task._id : null;

    if (task) {
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskId').value = task._id;
        document.getElementById('titre').value = task.titre;
        document.getElementById('description').value = task.description || '';
        document.getElementById('statut').value = task.statut;
        document.getElementById('priorite').value = task.priorite;
        const echeanceInput = document.getElementById('echeance');
        echeanceInput.value = task.echeance ? new Date(task.echeance).toISOString().slice(0, 16) : '';
        echeanceInput.readOnly = true;
        echeanceInput.style.backgroundColor = '#f5f5f5';
        echeanceInput.style.cursor = 'not-allowed';
        echeanceInput.style.opacity = '0.7';
        document.getElementById('categorie').value = task.categorie || '';
        document.getElementById('etiquettes').value = task.etiquettes ? task.etiquettes.join(', ') : '';
        document.getElementById('auteurNom').value = task.auteur.nom;
        document.getElementById('auteurPrenom').value = task.auteur.prenom;
        document.getElementById('auteurEmail').value = task.auteur.email;
    } else {
        document.getElementById('modalTitle').textContent = 'New Task';
        taskForm.reset();
        document.getElementById('taskId').value = '';

        const echeanceInput = document.getElementById('echeance');
        echeanceInput.readOnly = false;
        echeanceInput.style.backgroundColor = '';
        echeanceInput.style.cursor = '';
        echeanceInput.style.opacity = '';

        if (currentUser) {
            document.getElementById('auteurNom').value = currentUser.lastName;
            document.getElementById('auteurPrenom').value = currentUser.firstName;
            document.getElementById('auteurEmail').value = currentUser.email;
        }
    }

    taskModal.classList.remove('hidden');
}

// Close Task Modal
function closeTaskModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
    currentTaskId = null;

    const echeanceInput = document.getElementById('echeance');
    echeanceInput.readOnly = false;
    echeanceInput.style.backgroundColor = '';
    echeanceInput.style.cursor = '';
    echeanceInput.style.opacity = '';
}

// Save Task - FIX: Added Filter/Page reset
async function saveTask() {
    const taskId = document.getElementById('taskId').value;

    const formData = {
        titre: document.getElementById('titre').value,
        description: document.getElementById('description').value,
        statut: document.getElementById('statut').value,
        priorite: document.getElementById('priorite').value,
        categorie: document.getElementById('categorie').value,
        etiquettes: document.getElementById('etiquettes').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0),
        auteur: {
            nom: document.getElementById('auteurNom').value,
            prenom: document.getElementById('auteurPrenom').value,
            email: document.getElementById('auteurEmail').value
        }
    };

    if (!taskId) {
        formData.echeance = document.getElementById('echeance').value || null;
    }

    try {
        const url = taskId ? `${API_URL}/${taskId}` : API_URL;
        const method = taskId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(taskId ? 'Task updated successfully!' : 'Task created successfully!');
            closeTaskModal();

            // FIX: Ensure new task is visible
            currentFilters = {};
            currentPage = 1;

            loadTasks();
        } else {
            showError(data.error || 'Error saving task');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showError('Unable to save task');
    }
}

// Edit Task
async function editTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            headers: getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            openTaskModal(data.data);
        } else {
            showError('Unable to load task');
        }
    } catch (error) {
        console.error('Error loading task:', error);
        showError('Error loading task');
    }
}

// Delete Task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${taskId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Task deleted successfully!');
            loadTasks();
        } else {
            showError(data.error || 'Error deleting task');
            console.error('Delete failed:', data);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showError('Unable to delete task: ' + error.message);
    }
}

// Add Subtask
function addSubtask(taskId) {
    const titre = prompt('Subtask title:');
    if (!titre) return;

    const subtaskData = {
        titre: titre,
        statut: 'à faire'
    };

    fetch(`${API_URL}/${taskId}/subtasks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(subtaskData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Subtask added!');
                openTaskDetail(taskId);
            } else {
                showError('Error adding subtask');
            }
        })
        .catch(error => {
            console.error('Error adding subtask:', error);
            showError('Unable to add subtask');
        });
}

// Delete Subtask
function deleteSubtask(taskId, subtaskId) {
    if (!confirm('Delete this subtask?')) return;

    fetch(`${API_URL}/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
        headers: getHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Subtask deleted!');
                openTaskDetail(taskId);
            } else {
                showError('Error deleting subtask');
            }
        })
        .catch(error => {
            console.error('Error deleting subtask:', error);
            showError('Unable to delete');
        });
}

// Add Comment
function addComment(taskId) {
    const auteur = prompt('Your name:');
    if (!auteur) return;

    const texte = prompt('Comment:');
    if (!texte) return;

    const commentData = {
        auteur: auteur,
        texte: texte
    };

    fetch(`${API_URL}/${taskId}/comments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(commentData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Comment added!');
                openTaskDetail(taskId);
            } else {
                showError('Error adding comment');
            }
        })
        .catch(error => {
            console.error('Error adding comment:', error);
            showError('Unable to add comment');
        });
}

// Delete Comment
function deleteComment(taskId, commentId) {
    if (!confirm('Delete this comment?')) return;

    fetch(`${API_URL}/${taskId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getHeaders()
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Comment deleted!');
                openTaskDetail(taskId);
            } else {
                showError('Error deleting comment');
            }
        })
        .catch(error => {
            console.error('Error deleting comment:', error);
            showError('Unable to delete');
        });
}

// Apply Filters
function applyFilters() {
    currentFilters = {};

    const statut = document.getElementById('filterStatut').value;
    const priorite = document.getElementById('filterPriorite').value;
    const recherche = document.getElementById('filterRecherche').value;
    const tri = document.getElementById('filterTri').value;
    const ordre = document.getElementById('filterOrdre').value;

    if (statut) currentFilters.statut = statut;
    if (priorite) currentFilters.priorite = priorite;
    if (recherche) currentFilters.recherche = recherche;
    if (tri) currentFilters.tri = tri;
    if (ordre) currentFilters.ordre = ordre;

    currentPage = 1;
    loadTasks();
}

// Clear Filters
function clearFilters() {
    document.getElementById('filterForm').reset();
    currentFilters = {};
    currentPage = 1;
    loadTasks();
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`, {
            headers: getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            renderStats(data.data);
            statsModal.classList.remove('hidden');
        } else {
            showError('Error loading statistics');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showError('Unable to load statistics');
    }
}

// Render Stats
function renderStats(stats) {
    document.getElementById('statsContent').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.total || 0}</div>
                <div class="stat-label">Total Tasks</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--info);">${stats.aFaire || 0}</div>
                <div class="stat-label">To Do</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--warning);">${stats.enCours || 0}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--success);">${stats.terminee || 0}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--secondary);">${stats.annulee || 0}</div>
                <div class="stat-label">Cancelled</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--success);">${stats.prioriteBasse || 0}</div>
                <div class="stat-label">Low Priority</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--warning);">${stats.prioriteMoyenne || 0}</div>
                <div class="stat-label">Medium Priority</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #f97316;">${stats.prioriteHaute || 0}</div>
                <div class="stat-label">High Priority</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: var(--danger);">${stats.prioriteCritique || 0}</div>
                <div class="stat-label">Critical Priority</div>
            </div>
        </div>
    `;
}

// Export Tasks to JSON
async function exportTasks() {
    try {
        showLoading();

        const response = await fetch(`${API_URL}?limit=1000`, {
            headers: getHeaders()
        });
        const data = await response.json();

        if (data.success) {
            const jsonString = JSON.stringify(data.data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showSuccess('Tasks exported successfully!');
        } else {
            showError('Error exporting tasks');
        }
    } catch (error) {
        console.error('Error exporting tasks:', error);
        showError('Unable to export tasks');
    } finally {
        hideLoading();
    }
}

// Update Pagination
function updatePagination() {
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    pagination.classList.remove('hidden');
}

// Loading States
function showLoading() {
    if (loading) {
        loading.classList.remove('hidden');
    }
    if (tasksContainer) {
        tasksContainer.style.opacity = '0.5';
    }
}

function hideLoading() {
    if (loading) {
        loading.classList.add('hidden');
    }
    if (tasksContainer) {
        tasksContainer.style.opacity = '1';
    }
}

// Notifications
function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}