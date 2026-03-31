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
