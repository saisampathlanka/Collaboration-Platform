# Collab

A collaborative notes platform built in phases, starting as a monolith and evolving toward real-time collaboration.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL

### Backend
```bash
cd backend
cp .env.example .env   # edit with your PostgreSQL credentials
pnpm install
pnpm start
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

## Architecture

```
┌──────────┐   HTTP/JSON   ┌──────────────────┐   SQL   ┌──────────────┐
│  React   │ ◀────────────▶│  Express (Node)  │ ◀─────▶│  PostgreSQL  │
│  (Vite)  │               │  Controller →    │         │              │
│          │               │  Service → Repo  │         │              │
└──────────┘               └──────────────────┘         └──────────────┘
```

## Project Structure

```
collab/
├── backend/
│   ├── src/
│   │   ├── config/db.js         # PostgreSQL pool + table init (users + notes)
│   │   ├── app.js               # Express app (testable export)
│   │   ├── controllers/
│   │   │   ├── noteController   # HTTP handlers (OCC: 409 conflict)
│   │   │   └── authController   # Signup/login/me handlers
│   │   ├── services/
│   │   │   ├── noteService      # Business logic + OCC + ownership checks
│   │   │   └── authService      # Password hashing + JWT generation
│   │   ├── repositories/
│   │   │   ├── noteRepository   # SQL queries (OCC + ownership filtering)
│   │   │   └── userRepository   # User CRUD (no password_hash exposure)
│   │   ├── routes/
│   │   │   ├── noteRoutes.js    # Protected by auth middleware
│   │   │   └── authRoutes.js    # Public endpoints
│   │   └── middleware/
│   │       ├── requestLogger    # Request/response logging
│   │       └── auth             # JWT verification middleware
│   ├── tests/
│   │   ├── setup.js             # DB init + transactional rollback
│   │   ├── helpers.js           # createUserAndGetToken helper
│   │   ├── unit/                # Service layer tests (mocked DB)
│   │   └── integration/
│   │       ├── notes.test.js    # CRUD + OCC + authorization isolation
│   │       └── auth.test.js     # Signup/login/me + password security
│   ├── server.js                # Entrypoint (listens)
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Auth state management (login/signup/logout)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx    # Login form
│   │   │   └── SignupPage.jsx   # Signup form
│   │   ├── components/          # React components + tests
│   │   ├── services/api.js      # Fetch API client (JWT-bearing, 409-aware)
│   │   ├── App.jsx              # Auth-aware root + notes UI + conflict UI
│   │   ├── main.jsx             # Wrapped with AuthProvider
│   │   └── test/setup.js        # Vitest + jest-dom + localStorage mock
│   └── package.json
├── Tracking/
│   ├── PHASE1_CONTEXT.md        # Phase 1 design spec (CRUD, data model)
│   ├── PHASE1.5_CONTEXT.md      # Phase 1.5 design spec (OCC, version flow)
│   └── PHASE2_CONTEXT.md        # Phase 2 design spec (auth, ownership)
├── README.md
└── package.json
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/signup` | No | Create account (returns JWT) |
| `POST` | `/auth/login` | No | Login (returns JWT) |
| `GET` | `/auth/me` | Yes | Get current user |
| `POST` | `/notes` | Yes | Create a note (version starts at 1) |
| `GET` | `/notes` | Yes | List own notes (ownership-isolated) |
| `GET` | `/notes/:id` | Yes | Get a note (ownership-checked) |
| `PUT` | `/notes/:id` | Yes | Update a note (OCC + ownership-checked) |
| `DELETE` | `/notes/:id` | Yes | Delete a note (ownership-checked) |

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Monolith — CRUD notes app with React + Express + PostgreSQL | Complete |
| **1.5** | Optimistic Concurrency Control (version-based conflict detection) | Complete |
| **2** | Identity & Multi-User Architecture (auth, JWT, ownership isolation) | Complete |

## Testing

```bash
cd backend && pnpm test   # 64 tests (Jest + Supertest)
cd frontend && pnpm test  # 27 tests (Vitest + React Testing Library)
```

## Documentation

- [PHASE1_CONTEXT.md](./Tracking/PHASE1_CONTEXT.md) — Phase 1 design spec (CRUD, data model, API, edge cases)
- [PHASE1.5_CONTEXT.md](./Tracking/PHASE1.5_CONTEXT.md) — Phase 1.5 design spec (OCC, conflict detection, version flow)
- [PHASE2_CONTEXT.md](./Tracking/PHASE2_CONTEXT.md) — Phase 2 design spec (auth, JWT, ownership isolation)

---

## Authentication Flow

```
Frontend                    Backend
   │                          │
   ├── POST /auth/signup ────▶│  hash password (bcrypt)
   │                          │  create user in DB
   │                          │  generate JWT (userId, email)
   │◀──────── token ──────────┤  return { user, token }
   │                          │
   │  store token in          │
   │  localStorage            │
   │                          │
   ├── GET /notes ────────────▶│  auth middleware:
   │  Authorization: Bearer   │    verify JWT signature
   │  <token>                 │    attach req.user
   │                          │  service: filter notes by user_id
   │◀───── notes (owned) ─────┤  return only this user's notes
   │                          │
```

## Security Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Password hashing | **bcrypt** (salt rounds: 10) | Industry standard, constant-time comparison, built-in salt |
| Token format | **JWT (HS256)** | Stateless, no server-side session storage needed |
| Token expiry | **24 hours** | Balanced security vs UX; refresh tokens out of scope |
| Token storage | **localStorage** | Simple for this phase; httpOnly cookies or secure storage recommended for production |
| Authorization | **404 Not Found** on cross-user access | Prevents information leakage about existence of other users' notes |
| API protection | **Middleware on every route** | Consistent enforcement; no unprotected paths for notes |
| No password logging | Ensured at code level | Passwords/hashes never appear in logs |

## Known Limitations

- Token revocation not implemented (valid until expiry)
- No refresh token rotation (single long-lived JWT)
- localStorage vulnerable to XSS (mitigated by CSP in production)
- No rate limiting on auth endpoints
- No email verification on signup
