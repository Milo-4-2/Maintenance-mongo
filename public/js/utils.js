// ============================================
// Shared State & Utility Functions
// Global variables, constants, and helper
// functions used by all frontend modules.
// Loaded first — no dependencies on other modules.
// ============================================

// --- API Base URLs ---
const API_URL = 'http://localhost:3000/api/tasks';
const AUTH_URL = 'http://localhost:3000/api/auth';

// --- Pagination & Filter State ---
let currentPage = 1, totalPages = 1, currentFilters = {};
let currentTaskId = null, currentUser = null;
let authToken = localStorage.getItem('token') || null; // JWT token persisted in localStorage
let currentTrashPage = 1, totalTrashPages = 1;
let currentSubmittedPage = 1, totalSubmittedPages = 1;
let currentTheme = localStorage.getItem('theme') || 'light'; // Light/dark theme preference

// --- Display Labels (French backend values → English UI) ---
const STATUS_LABELS = { 'à faire': 'To Do', 'en cours': 'In Progress', 'terminée': 'Completed', 'en attente': 'Pending', 'annulée': 'Cancelled' };
const PRIORITY_LABELS = { 'basse': 'Low', 'moyenne': 'Medium', 'haute': 'High', 'critique': 'Critical' };

// Build authorization headers for API requests
function getHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` };
}

// Prevent XSS by escaping HTML special characters
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// --- User Feedback ---
function showSuccess(msg) { alert('✅ ' + msg); }
function showError(msg) { alert('❌ ' + msg); }

// Show/hide loading spinner and dim the task container
function showLoading() {
    const l = document.getElementById('loading'), t = document.getElementById('tasksContainer');
    if (l) l.classList.remove('hidden');
    if (t) t.style.opacity = '0.5';
}

function hideLoading() {
    const l = document.getElementById('loading'), t = document.getElementById('tasksContainer');
    if (l) l.classList.add('hidden');
    if (t) t.style.opacity = '1';
}

// --- Theme Management ---
// Apply saved theme on page load
function initializeTheme() { document.documentElement.setAttribute('data-theme', currentTheme); updateThemeIcon(); }

// Toggle between light and dark mode
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

// Update the theme toggle button icon
function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    if (btn) { btn.textContent = currentTheme === 'light' ? '🌙' : '☀️'; btn.title = currentTheme === 'light' ? 'Enable Dark Mode' : 'Enable Light Mode'; }
}
