// ============================================
// Auth Service (Frontend)
// Handles login, register, logout flows.
// Manages page visibility (login/register/main).
// Equivalent to UserChecking on the client side.
// ============================================

// Switch between login, register, and main app pages
function showPage(page) {
    ['loginPage', 'registerPage', 'mainApp'].forEach(id => {
        document.getElementById(id).classList.toggle('hidden', id !== page);
    });
}
const showLoginPage = () => showPage('loginPage');
const showRegisterPage = () => showPage('registerPage');
const showMainApp = () => showPage('mainApp');

// Fetch the current user's profile using the stored token
async function loadCurrentUser() {
    try {
        const data = await AuthAPI.getMe();
        if (data.success) {
            currentUser = data.data;
            document.getElementById('userInfo').textContent = `Hello, ${currentUser.firstName}!`;
            loadTasks(); // Load task list after successful auth
        } else { logout(); }
    } catch { logout(); } // Token invalid or expired
}

// Check if user is already logged in (token exists in localStorage)
function checkAuth() {
    if (authToken) { showMainApp(); loadCurrentUser(); }
    else { showLoginPage(); }
}

// Handle registration form submission
async function register(e) {
    e.preventDefault();
    const get = id => document.getElementById(id).value;
    const password = get('registerPassword');
    // Validate password confirmation
    if (password !== get('registerConfirmPassword')) return;
    try {
        const data = await AuthAPI.register({
            firstName: get('registerFirstName'), lastName: get('registerLastName'),
            username: get('registerUsername'), email: get('registerEmail'), password
        });
        if (data.success) {
            // Store token and redirect to main app
            authToken = data.data.token; localStorage.setItem('token', authToken);
            currentUser = data.data;
            showMainApp(); loadTasks();
        }
    } catch {}
}

// Handle login form submission
async function login(e) {
    e.preventDefault();
    try {
        const data = await AuthAPI.login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
        if (data.success) {
            // Store token and redirect to main app
            authToken = data.data.token; localStorage.setItem('token', authToken);
            currentUser = data.data;
            showMainApp(); document.getElementById('userInfo').textContent = `Hello, ${currentUser.firstName}!`;
            loadTasks();
        }
    } catch {}
}

// Clear token and redirect to login page
function logout() {
    authToken = null; currentUser = null; localStorage.removeItem('token');
    showLoginPage();
}
