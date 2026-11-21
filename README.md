# 🐛 Bug Tracker / Issue Tracker (Jira-like)

> **Python Tech Stack – 2 Week Industry-Grade Project**  
> Inspired by **Jira**, **Linear**, and **ClickUp**. Built with **FastAPI**, **SQLAlchemy**, **PostgreSQL/SQLite**, **JWT Auth**, **WebSockets**, and **React (Vite) + Tailwind CSS + Drag & Drop**.

---

## 🎯 Architecture & Tech Stack

```
CockroachBurn/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # JWT login, register, OAuth2 token & /me
│   │   │   ├── users.py         # User retrieval and Admin role management
│   │   │   ├── projects.py      # Project CRUD, keys (PROJ-1), team members
│   │   │   ├── tickets.py       # Ticket CRUD, advanced filtering, reordering
│   │   │   ├── comments.py      # Threaded discussions & nested replies
│   │   │   ├── attachments.py   # Screenshot uploads & static file serving
│   │   │   └── websockets.py    # Live WebSocket Kanban sync
│   │   ├── core/
│   │   │   ├── config.py        # Settings, JWT secret, CORS, database URL
│   │   │   ├── database.py      # SQLAlchemy session & engine
│   │   │   └── security.py      # Bcrypt password hashing & JWT encoding
│   │   ├── models/              # SQLAlchemy ORM models (User, Project, Ticket, Comment, Attachment)
│   │   ├── schemas/             # Pydantic v2 schemas & request/response DTOs
│   │   ├── seed.py              # Realistic sample data seed script
│   │   └── main.py              # FastAPI app, CORS, OpenAPI Swagger & SPA mount
│   ├── tests/
│   │   └── test_endpoints.py    # Automated test suite for all business logic
│   ├── uploads/                 # Local storage for screenshot bug attachments
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx  # Drag-and-drop workflow with @hello-pangea/dnd
│   │   │   ├── TicketModal.jsx  # Issue editor, image lightbox & threaded comments
│   │   │   ├── CreateTicketModal.jsx
│   │   │   ├── ProjectModal.jsx # Project settings & team member management
│   │   │   ├── FilterBar.jsx    # Keyword search & multi-facet filters
│   │   │   └── Navbar.jsx       # Project switcher, live WS badge & role tester
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # JWT state & persistent auth
│   │   │   └── ProjectContext.jsx # Project state & WebSocket live sync
│   │   ├── pages/
│   │   │   ├── BoardPage.jsx    # Main dashboard
│   │   │   ├── Login.jsx        # Sign-in + 1-click demo role switcher
│   │   │   └── Register.jsx     # Registration
│   │   └── services/api.js      # Axios client with JWT interceptor
│   ├── package.json
│   └── vite.config.js
├── start.bat                    # 1-click startup for Backend + Frontend
├── run_backend.bat              # Run FastAPI backend
├── run_frontend.bat             # Run Vite frontend
└── seed.bat                     # Seed database
```

---

## ⚡ 10 Detailed Use Cases Implementation

| # | Use Case | Implementation Details |
| :--- | :--- | :--- |
| **1** | **Secure user authentication & JWT** | Access tokens signed with HS256, bcrypt hashing, `/api/auth/login`, `/api/auth/register`, `/api/auth/me`. |
| **2** | **Project creation & team management** | Custom project keys (e.g. `ALPHA`), member role assignment (`Admin`, `Developer`, `Viewer`), owner controls. |
| **3** | **Ticket creation** | Types (`Bug`, `Task`, `Feature`), priorities (`Low`, `Medium`, `High`, `Urgent`), estimation, auto-increment keys (e.g. `ALPHA-1`). |
| **4** | **Assigning tickets to users** | Dynamic assignment to project members with avatar badges and initials. |
| **5** | **Kanban-based status tracking** | 5 workflow columns (`Backlog`, `To Do`, `In Progress`, `In Review`, `Done`) with fluid drag-and-drop powered by `@hello-pangea/dnd`. |
| **6** | **Threaded comments on tickets** | Self-referential comment hierarchy (`parent_id`) supporting nested discussions and reply threads. |
| **7** | **Advanced filters & keyword search** | Multi-attribute search across title, description, key, status, priority, type, and assignee. |
| **8** | **Edit/Delete with permission checks** | Guarded routes: only reporters, project owners, or Admins can delete issues; Viewers cannot edit. |
| **9** | **Role-based access (RBAC)** | Route dependencies: `Admin` (full access), `Developer` (create/edit/comment/move), `Viewer` (read-only audit). |
| **10** | **Screenshot uploads for bug clarity** | Multipart upload endpoint (`/api/attachments/ticket/{id}`), local disk storage, inline thumbnails, and lightbox modal. |

---

## 👥 Seed User Accounts

The database comes pre-seeded with sample users, projects, tickets, and discussions:

| Username / Email | Password | System Role | Permissions |
| :--- | :--- | :--- | :--- |
| **`admin`** / `admin@tracker.io` | `Password123!` | **Admin** | Full system permissions (create/delete any project, ticket, comment, manage roles). |
| **`developer`** / `dev@tracker.io` | `Password123!` | **Developer** | Create issues, drag & drop Kanban board, assign tickets, upload screenshots, comment. |
| **`elena`** / `dev2@tracker.io` | `Password123!` | **Developer** | Frontend engineer member of Alpha Cloud Platform & Mobile App. |
| **`viewer`** / `viewer@tracker.io` | `Password123!` | **Viewer** | Read-only access to boards, tickets, and comments (cannot edit or create). |

> 💡 *Note: The Web UI Navbar includes 1-click demo role buttons (`[Admin]`, `[Developer]`, `[Viewer]`) so you can test role permissions instantly.*

---

## 🚀 Quick Start Guide

### Option 1: One-Click Launch (Windows)

Double click:
```cmd
start.bat
```
This automatically launches:
1. FastAPI backend on `http://localhost:8000`
2. React frontend on `http://localhost:5173`

### Option 2: Running Services Individually

#### 1. Backend Server:
```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### 2. Frontend Development Server:
```powershell
cd frontend
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run the direct endpoint test suite:
```powershell
backend\.venv\Scripts\python.exe backend/tests/test_endpoints.py
```

Expected output:
```
Users found: ['admin', 'developer', 'elena', 'viewer']
Login logic OK! Token generated.
Projects found for admin: ['ALPHA', 'MOB']
Retrieved 6 tickets for ALPHA project.
ALL BACKEND BUSINESS LOGIC TESTS PASSED SUCCESSFULLY!
```

---

## 📡 Real-Time WebSockets

When users interact with the board in multiple browser tabs or across a team:
- Client connects to: `ws://localhost:8000/api/ws/project/{project_id}`
- Events broadcasted:
  - `TICKET_CREATED`: A new ticket was added to the project.
  - `TICKET_MOVED`: A ticket was dragged to a new status column.
  - `TICKET_UPDATED`: Fields, priority, or assignee changed.
  - `TICKET_DELETED`: Ticket was removed.
  - `COMMENT_ADDED`: A new comment or reply was posted.
  - `ATTACHMENT_UPLOADED`: A new bug screenshot was uploaded.

---

## 📦 Production Standalone Build

The frontend is already compiled into `frontend/dist`. 
When running `backend.app.main:app`, FastAPI automatically detects `frontend/dist` and mounts the entire Single Page Application at root `/`!
You can access both the API and the React frontend on a single port (`8000`).

