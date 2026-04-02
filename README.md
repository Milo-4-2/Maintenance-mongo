# Task Manager — Full-Stack Web Application

A task management web app built with **Node.js**, **Express**, **MongoDB**, and a vanilla **HTML/CSS/JS** frontend. The backend follows a **clean layered architecture** (Controller → Service → Repository) inspired by the [R4.01 Architecture Logicielle TD](https://flouvat.github.io/R4.01-Architecture-logicielle-Pages/TD/td1-mvc).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture & Workflow](#architecture--workflow)
  - [Backend Layers](#backend-layers)
  - [Frontend Modules](#frontend-modules)
  - [Request Flow](#request-flow)
- [Class Diagram](#class-diagram)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Features

- **Authentication** — Register, login, logout with JWT tokens
- **Task CRUD** — Create, read, update, soft-delete tasks
- **Subtasks** — Add, update, remove subtasks within a task
- **Comments** — Add and remove comments on tasks
- **User Assignment** — Assign/unassign users to tasks
- **Filtering & Search** — Filter by status, priority, category, tags, date ranges; full-text search
- **Pagination** — Paginated task lists, trash, and submitted views
- **Trash & Restore** — Soft delete with restore capability; permanent delete
- **Submit/Unsubmit** — Submit tasks for review; unsubmit to return to active
- **Statistics Dashboard** — Task counts by status and priority
- **Dark Mode** — Toggle between light and dark themes
- **Responsive UI** — Mobile-friendly design

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Runtime  | Node.js                             |
| Backend  | Express.js                          |
| Database | MongoDB + Mongoose                  |
| Auth     | JWT (jsonwebtoken) + bcryptjs       |
| Frontend | Vanilla HTML / CSS / JavaScript     |

---

## Project Structure

```
├── server.js                  # Entry point — Express app setup
├── package.json
│
├── config/
│   └── database.js            # MongoDB connection (Mongoose)
│
├── models/
│   ├── Task.js                # Task schema (subtasks, comments, history)
│   └── User.js                # User schema (password hashing)
│
├── repositories/
│   ├── taskRepository.js      # Data access layer — all Mongoose queries
│   └── userRepository.js      # User data access
│
├── services/
│   ├── taskService.js         # Business logic — validation, orchestration
│   └── authService.js         # Auth logic — register, login, token generation
│
├── controllers/
│   ├── taskController.js      # HTTP handlers — parse request, call service, send response
│   └── authController.js      # Auth HTTP handlers
│
├── middlewares/
│   ├── auth.js                # JWT verification (protect middleware)
│   ├── errorHandler.js        # Global error handling
│   └── validateObjectId.js    # MongoDB ObjectId validation
│
├── routes/
│   ├── taskRoutes.js          # Task API route definitions
│   └── authRoutes.js          # Auth API route definitions
│
├── utils/
│   ├── ApiError.js            # Custom error class with status code
│   └── asyncHandler.js        # Async/await error wrapper for controllers
│
└── public/                    # Frontend (served as static files)
    ├── index.html             # Single-page application
    ├── css/
    │   └── style.css          # Styles + dark mode (CSS variables)
    └── js/
        ├── utils.js           # Shared state, config, helper functions
        ├── api.js             # API client — all fetch calls to backend
        ├── auth.js            # Auth UI logic — login/register/logout
        ├── ui.js              # DOM rendering — cards, lists, pagination
        └── app.js             # Controller — event listeners, actions, routing
```

---

## Architecture & Workflow

### Backend Layers

The backend separates concerns into 4 layers. **Each layer only depends on the layer directly below it** — never skipping layers or reaching upward.

```
┌──────────────────────────────────────────────────┐
│                    Routes                        │
│  Define URL paths and HTTP methods               │
│  Map endpoints to controller functions           │
└────────────────────┬─────────────────────────────┘
                     │ calls
┌────────────────────▼─────────────────────────────┐
│                 Controllers                      │
│  Parse HTTP request (params, body, query)        │
│  Call the appropriate service method             │
│  Format and send the HTTP response               │
└────────────────────┬─────────────────────────────┘
                     │ calls
┌────────────────────▼─────────────────────────────┐
│                  Services                        │
│  Business logic: validation, authorization       │
│  Orchestrates repository calls                   │
│  Throws ApiError for error cases                 │
└────────────────────┬─────────────────────────────┘
                     │ calls
┌────────────────────▼─────────────────────────────┐
│                Repositories                      │
│  Data access: all Mongoose queries live here     │
│  Only layer that imports Models                  │
│  Returns plain data to the service               │
└────────────────────┬─────────────────────────────┘
                     │ uses
┌────────────────────▼─────────────────────────────┐
│                   Models                         │
│  Mongoose schemas + validation rules             │
│  Pre-save hooks (e.g., password hashing)         │
└──────────────────────────────────────────────────┘
```

**Why this matters:**
- **Models** are never imported outside of repositories — if you switch databases, only the repository layer changes.
- **Services** contain no HTTP logic (no `req`/`res`) — they can be reused from CLI tools, tests, or other entry points.
- **Controllers** contain no business logic — they're thin wrappers that translate HTTP ↔ service calls.

### Frontend Modules

The frontend follows the same separation principle:

| File       | Role                | Responsibility                                                     |
|------------|---------------------|--------------------------------------------------------------------|
| `utils.js` | Shared State        | Global variables (`currentPage`, `token`), config, DOM helpers     |
| `api.js`   | Data Access (Model) | Generic `api()` fetch helper; all backend communication            |
| `auth.js`  | Auth Service        | Login/register forms, token management, user session               |
| `ui.js`    | View / Presenter    | DOM rendering: task cards, lists, pagination, modals, stats        |
| `app.js`   | Controller          | Event listeners, user actions, coordinates api→ui flow             |

Scripts are loaded in dependency order in `index.html`:
```
utils.js → api.js → auth.js → ui.js → app.js
```

### Request Flow

Here's how a typical request flows through the system:

```
User clicks "Create Task"
       │
       ▼
  [app.js]  Event listener fires → collects form data
       │
       ▼
  [api.js]  TaskAPI.create(data) → fetch POST /api/tasks
       │
       ▼
  [routes/taskRoutes.js]  POST / → protect middleware → createTask controller
       │
       ▼
  [middlewares/auth.js]  Verifies JWT → attaches req.user
       │
       ▼
  [controllers/taskController.js]  Extracts req.body, req.user.id → calls taskService.createTask()
       │
       ▼
  [services/taskService.js]  Sets createdBy → calls taskRepository.create()
       │
       ▼
  [repositories/taskRepository.js]  Task.create(data) → MongoDB insert
       │
       ▼
  Response bubbles back: repository → service → controller → JSON response → api.js → app.js → ui.js renders the new task
```

---

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           CONTROLLERS (HTTP Layer)                                                │
│                                                                                                                   │
│  ┌──────────────────────────────────────────┐          ┌──────────────────────────────────┐                       │
│  │          TaskController                  │          │        AuthController            │                       │
│  │          <<static>>                      │          │        <<static>>                │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │                                          │          │                                  │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │ + getTasks(req, res)                     │          │ + register(req, res)             │                       │
│  │ + getTask(req, res)                      │          │ + login(req, res)                │                       │
│  │ + createTask(req, res)                   │          │ + getMe(req, res)                │                       │
│  │ + updateTask(req, res)                   │          │ + logout(req, res)               │                       │
│  │ + deleteTask(req, res)                   │          │ + getUsers(req, res)             │                       │
│  │ + addSubtask(req, res)                   │          └───────────────┬──────────────────┘                       │
│  │ + updateSubtask(req, res)                │                          │                                          │
│  │ + deleteSubtask(req, res)                │                          │ uses                                     │
│  │ + addComment(req, res)                   │                          │                                          │
│  │ + deleteComment(req, res)                │                          │                                          │
│  │ + getTrash(req, res)                     │                          │                                          │
│  │ + restoreTask(req, res)                  │                          │                                          │
│  │ + permanentDelete(req, res)              │                          │                                          │
│  │ + submitTask(req, res)                   │                          │                                          │
│  │ + getSubmitted(req, res)                 │                          │                                          │
│  │ + unsubmitTask(req, res)                 │                          │                                          │
│  │ + getStats(req, res)                     │                          │                                          │
│  │ + assignUser(req, res)                   │                          │                                          │
│  │ + unassignUser(req, res)                 │                          │                                          │
│  │ - ok(res, data, status)                  │                          │                                          │
│  │ - paginated(res, result)                 │                          │                                          │
│  └─────────────────────┬────────────────────┘                          │                                          │
│                        │                                               │                                          │
│                        │ uses                                          │                                          │
└────────────────────────┼───────────────────────────────────────────────┼──────────────────────────────────────────┘
                         │                                               │
                         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           SERVICES (Business Logic)                                               │
│                                                                                                                   │
│  ┌──────────────────────────────────────────┐          ┌──────────────────────────────────┐                       │
│  │           TaskService                    │          │         AuthService              │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │                                          │          │                                  │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │ + buildFilter(query)                     │          │ + register(userData)             │                       │
│  │ + getAllTasks(query)                      │          │ + login(email, password)         │                       │
│  │ + getTaskById(id)                        │          │ + getCurrentUser(userId)         │                       │
│  │ + createTask(data, userId)               │          │ + getAllUsers()                  │                       │
│  │ + updateTask(id, data)                   │          │ - generateToken(userId)          │                       │
│  │ + deleteTask(id, userId)                 │          └───────────────┬──────────────────┘                       │
│  │ + addSubtask(taskId, data)               │                          │                                          │
│  │ + updateSubtask(taskId, subtaskId, data) │                          │ uses                                     │
│  │ + deleteSubtask(taskId, subtaskId)       │                          │                                          │
│  │ + addComment(taskId, data)               │                          │                                          │
│  │ + deleteComment(taskId, commentId)       │                          │                                          │
│  │ + getTrash(query)                        │    ┌─────────────────────────────────┐                              │
│  │ + restoreTask(id, userId)                │    │          ApiError               │                              │
│  │ + permanentDelete(id, userId)            │    ├─────────────────────────────────┤                              │
│  │ + submitTask(id, userId)                 │    │ + statusCode : Number           │                              │
│  │ + getSubmitted(query)                    │    │ + isOperational : Boolean        │                              │
│  │ + unsubmitTask(id)                       │    ├─────────────────────────────────┤                              │
│  │ + getStats()                             │    │ + constructor(statusCode,       │                              │
│  │ + assignUser(taskId, userId)             │    │     message, isOperational,     │                              │
│  │ + unassignUser(taskId, userId)           │    │     stack)                      │                              │
│  │ - _findTask(id, filter, msg)             │    └────────────────┬────────────────┘                              │
│  │ - _paginate(filter, sort, query)         │                     │                                               │
│  │ - _checkOwnership(task, userId)          │- - throws - ▶      │ extends                                       │
│  └─────────────────────┬────────────────────┘                     │                                               │
│                        │                               ┌──────────▼────────────────┐                              │
│                        │ uses                          │         Error              │                              │
│                        │                               │     (built-in)            │                              │
│                        │                               └───────────────────────────┘                              │
└────────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┘
                         │                                               │
                         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           REPOSITORIES (Data Access)                                              │
│                                                                                                                   │
│  ┌──────────────────────────────────────────┐          ┌──────────────────────────────────┐                       │
│  │         TaskRepository                   │          │       UserRepository             │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │                                          │          │                                  │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │ + findAll(filter, sort, skip, limit)     │          │ + findById(id)                   │                       │
│  │ + findOne(filter)                        │          │ + findByEmailOrUsername(email,    │                       │
│  │ + create(data)                           │          │     username)                    │                       │
│  │ + findByIdAndUpdate(id, data)            │          │ + findByEmailWithPassword(email) │                       │
│  │ + count(filter)                          │          │ + findAll()                      │                       │
│  │ + aggregate(pipeline)                    │          │ + create(data)                   │                       │
│  │ + deleteById(id)                         │          └───────────────┬──────────────────┘                       │
│  │ + softDelete(id, userId)                 │                          │                                          │
│  │ + restore(id)                            │                          │ queries                                  │
│  │ + submit(id, userId)                     │                          │                                          │
│  │ + unsubmit(id)                           │                          │                                          │
│  │ + addSubtask(taskId, data)               │                          │                                          │
│  │ + updateSubtask(taskId, subtaskId, data) │                          │                                          │
│  │ + removeSubtask(taskId, subtaskId)       │                          │                                          │
│  │ + addComment(taskId, data)               │                          │                                          │
│  │ + removeComment(taskId, commentId)       │                          │                                          │
│  │ + hasAssignment(taskId, userId)          │                          │                                          │
│  │ + addAssignment(taskId, userId)          │                          │                                          │
│  │ + removeAssignment(taskId, userId)       │                          │                                          │
│  │ + addHistoryEntry(taskId, entry)         │                          │                                          │
│  └─────────────────────┬────────────────────┘                          │                                          │
│                        │                                               │                                          │
│                        │ queries                                       │                                          │
└────────────────────────┼───────────────────────────────────────────────┼──────────────────────────────────────────┘
                         │                                               │
                         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           MODELS (Mongoose Schemas)                                               │
│                                                                                                                   │
│  ┌──────────────────────────────────────────┐          ┌──────────────────────────────────┐                       │
│  │             Task                         │          │            User                  │                       │
│  │         <<Mongoose Model>>               │          │        <<Mongoose Model>>        │                       │
│  ├──────────────────────────────────────────┤          ├──────────────────────────────────┤                       │
│  │ + titre : String                         │          │ + username : String              │                       │
│  │ + description : String                   │          │ + email : String                 │                       │
│  │ + statut : String                        │          │ + password : String              │                       │
│  │ + priorite : String                      │          │ + firstName : String             │                       │
│  │ + dateCreation : Date                    │          │ + lastName : String              │                       │
│  │ + echeance : Date                        │          ├──────────────────────────────────┤                       │
│  │ + categorie : String                     │          │ + comparePassword(candidate)     │                       │
│  │ + etiquettes : String[]                  │          └──────────────────────────────────┘                       │
│  │ + createdBy : ObjectId                   │                                                                     │
│  │ + deleted : Boolean                      │                                                                     │
│  │ + submitted : Boolean                    │                                                                     │
│  │ + assignedTo : Object[]                  │                                                                     │
│  │ + sousTaches : Subtask[]                 │                                                                     │
│  │ + commentaires : Comment[]               │                                                                     │
│  │ + historique : History[]                  │                                                                     │
│  ├──────────────────────────────────────────┤                                                                     │
│  │                                          │                                                                     │
│  └──────────────────────────────────────────┘                                                                     │
│                                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Legend:**
- `+` = public method/attribute, `-` = private method
- `<<static>>` = all methods are static (controllers)
- `<<Mongoose Model>>` = database schema, not a JS class
- `───▶` = dependency (uses/queries), `- - ▶` = throws
- `extends` = inheritance (ApiError extends Error)
- Each layer only depends on the layer directly below it

---

## API Endpoints

### Authentication

| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login, receive JWT   |
| GET    | `/api/auth/me`       | Get current user     |
| POST   | `/api/auth/logout`   | Logout               |
| GET    | `/api/auth/users`    | List all users       |

### Tasks

| Method | Endpoint                          | Description                   |
|--------|-----------------------------------|-------------------------------|
| GET    | `/api/tasks`                      | List tasks (filtered, paginated) |
| POST   | `/api/tasks`                      | Create task                   |
| GET    | `/api/tasks/stats`                | Get task statistics           |
| GET    | `/api/tasks/trash`                | List soft-deleted tasks       |
| GET    | `/api/tasks/submitted`            | List submitted tasks          |
| GET    | `/api/tasks/:id`                  | Get single task               |
| PUT    | `/api/tasks/:id`                  | Update task                   |
| DELETE | `/api/tasks/:id`                  | Soft-delete task              |
| PATCH  | `/api/tasks/:id/restore`          | Restore from trash            |
| DELETE | `/api/tasks/:id/permanent`        | Permanently delete            |
| POST   | `/api/tasks/:id/submit`           | Submit task                   |
| PATCH  | `/api/tasks/:id/unsubmit`         | Unsubmit task                 |
| POST   | `/api/tasks/:id/subtasks`         | Add subtask                   |
| PUT    | `/api/tasks/:id/subtasks/:sid`    | Update subtask                |
| DELETE | `/api/tasks/:id/subtasks/:sid`    | Remove subtask                |
| POST   | `/api/tasks/:id/comments`         | Add comment                   |
| DELETE | `/api/tasks/:id/comments/:cid`    | Remove comment                |
| POST   | `/api/tasks/:id/assign`           | Assign user to task           |
| DELETE | `/api/tasks/:id/assign/:uid`      | Unassign user from task       |

### Query Parameters (GET `/api/tasks`)

| Parameter      | Description                         |
|----------------|-------------------------------------|
| `page`         | Page number (default: 1)            |
| `limit`        | Items per page (default: 10)        |
| `tri`          | Sort field (default: `dateCreation`)|
| `ordre`        | Sort order: `asc` or `desc`         |
| `statut`       | Filter by status                    |
| `priorite`     | Filter by priority                  |
| `categorie`    | Filter by category (regex)          |
| `etiquette`    | Filter by tag                       |
| `recherche`    | Search in title and description     |
| `dateDebut`    | Created after date                  |
| `dateFin`      | Created before date                 |
| `echeanceDebut`| Deadline after date                 |
| `echeanceFin`  | Deadline before date                |

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or Atlas)

### Installation

```bash
git clone https://github.com/ngthienhuy/BBD.git
cd BBD
npm install
```

### Running

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

The app runs on `http://localhost:3000` by default.

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_jwt_secret_key
```

| Variable    | Description                     | Default |
|-------------|---------------------------------|---------|
| `PORT`      | Server port                     | 3000    |
| `MONGO_URI` | MongoDB connection string       | —       |
| `JWT_SECRET`| Secret key for JWT signing      | —       |

---

## Backend Directory Breakdown

### `config/`

- **`database.js`** — Exports a single `connectDB()` function that connects Mongoose to MongoDB using `MONGO_URI` from `.env`. Called once at startup from `server.js`. Exits the process on connection failure.

### `models/`

- **`Task.js`** — Mongoose schema with 15+ fields. Includes embedded sub-schemas for subtasks, comments, and history. Pre-save hook automatically records a creation history entry. Virtual fields compute progress percentage and overdue status. Database indexes on status, priority, deadline, category, author email, `createdBy`, and `deleted` for query performance.
- **`User.js`** — Mongoose schema with a pre-save hook that bcrypt-hashes passwords (salt rounds = 10). Provides a `comparePassword()` instance method used during login. The password field is excluded from queries by default (`select: false`).

### `repositories/`

- **`taskRepository.js`** — Data access class wrapping all Mongoose queries for tasks: CRUD (`findAll`, `findOne`, `create`, `update`, `deleteById`), soft delete/restore, submit/unsubmit, subtask and comment operations, user assignment, and history entries. **Only layer that imports the Task model.**
- **`userRepository.js`** — Data access class for users: find by ID, find by email or username (with or without the password field), list all users, and create new users.

### `services/`

- **`taskService.js`** — Business logic layer. Builds query filters from request parameters, paginates results, checks task ownership before restore/permanent-delete, prevents duplicate user assignments, and runs a MongoDB aggregation pipeline for statistics. Calls the repository layer and throws `ApiError` on business rule violations.
- **`authService.js`** — Generates JWT tokens (30-day expiry), handles registration (checks for duplicate email/username), handles login (verifies credentials via `comparePassword()`), fetches the current user profile, and lists all users for the assignment dropdown.

### `controllers/`

- **`taskController.js`** — 18 thin handler functions (one per endpoint). Each extracts data from `req` (params, body, query, user), calls the matching `taskService` method, and sends JSON via `ok()` or `paginated()` response helpers. All wrapped in `asyncHandler` to forward errors automatically.
- **`authController.js`** — 5 handler functions: `register`, `login`, `getMe`, `logout`, `getUsers`. Same thin pattern — delegates entirely to `authService`.

### `middlewares/`

- **`auth.js`** — `protect` middleware: extracts the Bearer token from the `Authorization` header, verifies the JWT signature, looks up the user via `userRepository` (not the model directly), and attaches `req.user` for downstream handlers. Returns 401 if the token is missing, invalid, or the user no longer exists.
- **`errorHandler.js`** — Global Express error handler. Converts Mongoose `ValidationError` → 400, duplicate key error (code 11000) → 400, `CastError` (invalid ObjectId) → 400, and `ApiError` → its own `statusCode`. Includes stack traces only in development.
- **`validateObjectId.js`** — Route-level middleware that validates the `:id` parameter is a valid MongoDB ObjectId. Returns 400 immediately if invalid, preventing the controller from executing.

### `routes/`

- **`taskRoutes.js`** — Maps all 18 task endpoints to their controller functions. Applies `protect` middleware to every route and `validateObjectId` to routes with `:id`. Special routes (`/stats`, `/trash`, `/submitted`) are defined before `/:id` to avoid parameter conflicts.
- **`authRoutes.js`** — Maps 5 auth endpoints. Public: `POST /register`, `POST /login`. Protected (behind `protect`): `GET /me`, `POST /logout`, `GET /users`.

### `utils/`

- **`ApiError.js`** — Custom `Error` subclass with a `statusCode` property and an `isOperational` flag. Thrown throughout services and middlewares, caught by `errorHandler`.
- **`asyncHandler.js`** — Higher-order function that wraps async controller handlers to automatically catch rejected promises and forward them to `next()`. Eliminates repetitive try/catch blocks in controllers.

### Root Files

- **`server.js`** — Entry point. Loads `.env`, creates the Express app, connects to the database, registers global middleware (CORS, JSON parsing, static files), mounts API routes, and attaches the error handler. Listens on `PORT`.
- **`fix-all-tasks.js`** — One-time migration script. Sets `deleted: false` and `submitted: false` on all existing tasks that were created before those features were added.

---

## Frontend Refactoring: `app.old.js` → Modular Scripts

### What Changed

The original frontend was a **single monolithic file** (`app.old.js`, ~1 300 lines) containing everything: global state, API calls, authentication, DOM rendering, and event handling all mixed together. It was split into **5 specialized modules**:

| New File   | What was extracted from `app.old.js`                                                                 |
|------------|------------------------------------------------------------------------------------------------------|
| `utils.js` | Global variables (`currentPage`, `authToken`, `currentFilters`, etc.), label maps (`STATUS_LABELS`, `PRIORITY_LABELS`), `getHeaders()`, `escapeHtml()`, `showSuccess()`/`showError()`, `showLoading()`/`hideLoading()`, theme functions (`initializeTheme`, `toggleTheme`, `updateThemeIcon`) |
| `api.js`   | All raw `fetch()` calls were replaced by a generic `api()` helper and organized into `TaskAPI`, `AuthAPI`, and `AssignAPI` objects with named methods (e.g., `TaskAPI.getTasks()`, `AuthAPI.login()`) |
| `auth.js`  | `login()`, `register()`, `logout()`, `checkAuth()`, `loadCurrentUser()`, page-switching functions (`showLoginPage`, `showRegisterPage`, `showMainApp`) |
| `ui.js`    | All DOM/HTML rendering: `renderTasks()`, `renderTrash()`, `renderSubmitted()`, `renderMembers()`, `renderTaskDetail()`, `renderStats()`, card creation functions (`createTaskCard`, `createSubmittedCard`, `createTrashCard`), pagination updates, generic `renderList()` helper |
| `app.js`   | Kept only as the **controller**: `DOMContentLoaded` entry point, `initializeEventListeners()`, and action handlers (`loadTasks`, `saveTask`, `deleteTask`, `editTask`, `addSubtask`, `addComment`, filters, stats, export, member assignment) |

### Why

1. **Separation of Concerns (MVC pattern)** — The refactoring mirrors the backend architecture (Controller → Service → Repository). Each frontend file has a single responsibility, matching the [R4.01 Architecture Logicielle](https://flouvat.github.io/R4.01-Architecture-logicielle-Pages/TD/td1-mvc) course structure:
   - `api.js` = Model/Data Access (like repositories)
   - `ui.js` = View/Presenter (like templates)
   - `app.js` = Controller (like controllers)
   - `auth.js` = Auth Service (like authService)
   - `utils.js` = Shared utilities (like utils/)

2. **Eliminated code duplication** — Repeated `fetch()` calls with manual `getHeaders()` and `response.json()` in every function were replaced by a single `api()` wrapper. Repeated render patterns were consolidated into `renderList()`.

3. **Readability & maintainability** — Instead of scrolling through 1 300 lines to find a function, each file is focused and short. Changes to the UI don't risk breaking API calls, and vice versa.

4. **Dependency order is explicit** — Scripts load in order: `utils.js → api.js → auth.js → ui.js → app.js`. Each module only uses functions defined in scripts loaded before it.

### Front-to-Back Connection: Before vs After

The backend API was **not changed** — the refactoring only reorganized how the frontend calls it.

**Before** — everything in one file (`app.old.js`):

```
User clicks "Create Task"
       │
       ▼
  [app.old.js]  Event listener fires
       │        Collects form data
       │        Builds fetch() with headers
       │        Sends POST /api/tasks ──────────────► Backend API
       │        Parses response                          │
       │        Renders DOM with innerHTML               │
       │        (all in the same function)          ◄────┘
       ▼
  Task card appears
```

Every function in `app.old.js` did **all 4 jobs**: listen for events, call the API, parse the response, and update the DOM. Example from `app.old.js`:

```js
// One function did everything:
async function loadTasks() {
    showLoading();                                          // utils concern
    const response = await fetch(`${API_URL}?...`, {        // api concern
        headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await response.json();                     // api concern
    tasksContainer.innerHTML = '';                           // ui concern
    tasks.forEach(task => {                                 // ui concern
        const card = createTaskCard(task);
        tasksContainer.appendChild(card);
    });
    hideLoading();                                          // utils concern
}
```

**After** — each file handles one layer:

```
User clicks "Create Task"
       │
  [app.js]        Event listener fires, collects form data
       │
  [api.js]        TaskAPI.createTask(data) → fetch POST /api/tasks ──► Backend API
       │                                                                   │
  [app.js]        Receives response, calls render function            ◄────┘
       │
  [ui.js]         renderTasks(data) → builds DOM
       │
  [utils.js]      escapeHtml(), showSuccess(), hideLoading()
       ▼
  Task card appears
```

Same flow with modules:

```js
// app.js — controller only
async function loadTasks() {
    showLoading();                          // defined in utils.js
    const data = await TaskAPI.getTasks(    // defined in api.js
        currentPage, currentFilters
    );
    if (data.success) {
        renderTasks(data.data);             // defined in ui.js
        updatePagination();                 // defined in ui.js
    }
    hideLoading();                          // defined in utils.js
}
```

**The backend sees no difference.** Both versions send the exact same HTTP requests to the exact same endpoints. The refactoring only changed how the frontend organizes the code that builds those requests and handles the responses.
