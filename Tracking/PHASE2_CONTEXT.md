# PHASE 2 — IDENTITY & MULTI-USER ARCHITECTURE

> Status: **Complete** — 91 tests passing (64 backend, 27 frontend)

# Goal

Transform the collaboration platform from a single-user system into a secure multi-user system with authentication, authorization, and ownership-aware access control.

The system must:
- identify users securely
- isolate user data correctly
- prevent unauthorized access
- support stateless authenticated requests

---

# Problem Statement

Current system assumptions:
- all requests are trusted
- all notes are globally accessible
- no user identity exists
- no ownership boundaries exist

Need to implement:
- user accounts
- secure authentication
- ownership-based authorization
- protected APIs
- session persistence

---

# Core System Design Focus

This phase introduces:
- trust boundaries
- stateless authentication
- ownership isolation
- authorization enforcement
- session lifecycle management

Primary objective:
Every request must prove identity before accessing protected resources.

---

# Scope

This phase includes:
- [x] signup
- [x] login
- [x] JWT authentication
- [x] auth middleware
- [x] protected routes
- [x] ownership-aware note access
- [x] password hashing
- [x] session persistence

This phase does NOT include:
- OAuth
- refresh tokens
- RBAC
- SSO
- email verification
- password reset
- realtime auth

---

# Required Backend Changes

## 1. Users Table

Create users table. **[x]**

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
email VARCHAR(255) UNIQUE NOT NULL
password_hash TEXT NOT NULL
created_at TIMESTAMP NOT NULL DEFAULT NOW()
updated_at TIMESTAMP NOT NULL DEFAULT NOW()
```

Constraints:
- [x] email must be unique
- [x] never store plain-text passwords
- [x] password is hashed with bcrypt (10 salt rounds)

---

## 2. Note Ownership

Add ownership to notes. **[x]**

```sql
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

Relationship:

User → many Notes

- [x] migration adds `user_id` to existing notes tables
- [x] every note query enforces `WHERE user_id = ?`
- [x] `ON DELETE CASCADE` — user deletion removes their notes

---

## 3. Password Hashing

Requirements:
- [x] use bcrypt (10 salt rounds)
- [x] never store raw passwords
- [x] never log passwords
- [x] never return hashes in responses (repository layer strips `password_hash` from all return values)

---

## 4. Authentication APIs

Required endpoints:

```http
POST /auth/signup
POST /auth/login
GET  /auth/me
```

All implemented and tested. **[x]**

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /auth/signup` | [x] | Returns `{ user, token }`, duplicate email → 409 |
| `POST /auth/login`  | [x] | Returns `{ user, token }`, bad credentials → 401 |
| `GET /auth/me`      | [x] | Requires valid JWT, returns `{ user }` |

---

## 5. JWT Authentication

After successful login/signup:
- [x] generate signed JWT (HS256)
- [x] return token to client

JWT payload minimum:

```json
{
  "userId": "...",
  "email": "..."
}
```

- [x] 24 hour token expiry
- [x] `JWT_SECRET` configurable via `.env`
- [x] token returned in response body as `{ user, token }`

---

## 6. Authentication Middleware

Middleware responsibilities:
- [x] extract token from `Authorization: Bearer <token>` header
- [x] verify signature (`jsonwebtoken.verify`)
- [x] reject invalid tokens → 401
- [x] reject expired tokens → 401
- [x] attach authenticated user to `req.user` (`{ userId, email }`)

Unauthenticated requests return:

```http
401 Unauthorized
```

---

## 7. Ownership-Based Authorization

Users must ONLY access their own notes. **[x]**

All note queries enforce:

```sql
WHERE user_id = ?
```

Required protections:
- [x] cannot read others' notes (404)
- [x] cannot update others' notes (404)
- [x] cannot delete others' notes (404)

Implementation choice: **404 Not Found** — prevents information leakage about existence of other users' notes.

---

# Required Frontend Changes

## 1. Authentication UI

Implement: **[x]**
- [x] signup page/form (`SignupPage.jsx`)
- [x] login page/form (`LoginPage.jsx`)
- [x] logout functionality (in `App.jsx` header)
- [x] form validation (email format, password length)

---

## 2. Token Persistence

Store JWT securely. **[x]**

For this phase:
- [x] localStorage (with `setToken` / `getToken` in `api.js`)
- [x] localStorage mock in Vitest test setup

---

## 3. Auth State Management

Frontend must:
- [x] track authenticated user via `AuthContext` (React context + reducer)
- [x] show loading spinner while restoring session on refresh
- [x] restore session on refresh (check localStorage token + validate via `GET /auth/me`)
- [x] clear session on logout (remove token from localStorage, clear state)
- [x] attach token to API requests via `authHeaders()` in `api.js`
- [x] handle invalid/expired tokens gracefully (clear token, redirect to auth page)

---

## 4. Protected Routes

- [x] unauthenticated users see auth page (login/signup toggle)
- [x] authenticated users see notes UI
- [x] no protected API calls made without valid token

---

## 5. Unauthorized Handling

Frontend must:
- [x] redirect unauthenticated users to login
- [x] handle expired/invalid tokens gracefully (clear state, show auth page)

---

## 6. Additional Frontend UX

Beyond the design spec, the following UX improvements were implemented:

- [x] **Read-only note view** — clicking a note's title or content opens a read-only view (instead of immediately showing an edit form)
- [x] **"Edit" button** — switches from read-only view to edit mode
- [x] **Cancel button conditional rendering** — only shown when there are unsaved changes (`hasChanges` prop compares draft vs original)
- [x] **"Note saved!" success banner** — appears for 2 seconds after successful save; form stays open after save
- [x] **Delete-while-editing fix** — if the currently-editing note is deleted, editing state is cleared to avoid stale form

---

# Required Testing

## 1. Authentication Tests

Test: **[x]**
- [x] signup success (201, returns user + token)
- [x] duplicate email rejection (409)
- [x] login success (200, returns user + token)
- [x] invalid password rejection (401)
- [x] invalid token rejection (401)
- [x] missing fields rejection (400)

14 auth integration tests total.

---

## 2. Authorization Tests

Critical requirement:

User A must NOT access User B notes. **[x]**

Verify:
- [x] read blocked (404)
- [x] update blocked (404)
- [x] delete blocked (404)

---

## 3. Middleware Tests

Verify:
- [x] missing token rejected (401)
- [x] malformed token rejected (401)
- [x] invalid token rejected (401)
- [x] expired token rejected (401)

---

## 4. Password Security Tests

Verify:
- [x] passwords stored hashed (bcrypt comparison in test)
- [x] hashes not returned in API responses (check response body for `password_hash` field)

---

## 5. Frontend Tests

- [x] AuthContext loading state test
- [x] Session restore on refresh test
- [x] Invalid token cleanup test
- [x] NoteForm cancel button visibility tests

---

# Required Logging

**[x]** — Structured logging via `requestLogger` middleware.

Log:
- [x] signup attempts
- [x] login success/failure
- [x] unauthorized access attempts
- [x] invalid token usage

Do NOT log:
- [x] passwords
- [x] password hashes
- [x] JWT secrets
- [x] full tokens

---

# Implementation Details

## Key Files

| Layer | File | Purpose |
|-------|------|---------|
| Database | `backend/src/config/db.js` | Creates `users` table + `user_id` FK on `notes` + migration for existing tables |
| Middleware | `backend/src/middleware/auth.js` | JWT verification, 401 on missing/invalid/expired tokens |
| Repository | `backend/src/repositories/userRepository.js` | User CRUD, never exposes `password_hash` |
| Service | `backend/src/services/authService.js` | bcrypt hashing, JWT sign/verify, signup/login/me logic, logging |
| Controller | `backend/src/controllers/authController.js` | Maps service errors to HTTP (400, 401, 404, 409) |
| Routes | `backend/src/routes/authRoutes.js` | POST /auth/signup, POST /auth/login, GET /auth/me |
| Note Repo | `backend/src/repositories/noteRepository.js` | Ownership-aware queries (`findAllByUserId`, `findByIdAndUserId`, `deleteByIdAndUserId`) |
| Note Service | `backend/src/services/noteService.js` | All operations accept `userId`, ownership enforcement, OCC conflict detection |
| Note Controller | `backend/src/controllers/noteController.js` | Extracts `req.user.userId` from auth middleware |
| Note Routes | `backend/src/routes/noteRoutes.js` | All routes protected by `authMiddleware` |
| Auth Context | `frontend/src/context/AuthContext.jsx` | Auth state management, login/signup/logout, session restore |
| Auth Pages | `frontend/src/pages/LoginPage.jsx`, `SignupPage.jsx` | Form components with validation |
| API Client | `frontend/src/services/api.js` | JWT-bearing requests via `authHeaders()`, auth endpoint functions |
| App Root | `frontend/src/App.jsx` | Auth-aware root, read-only view, editing with draft, save indicator, conflict UI |
| Component | `frontend/src/components/NoteForm.jsx` | Read-only view mode, cancel button only when `hasChanges` is true |

## Test Files

| File | Count | Scope |
|------|-------|-------|
| `backend/tests/integration/auth.test.js` | 14 tests | Signup, login, duplicate, password security, me, invalid tokens |
| `backend/tests/integration/notes.test.js` | ~30 tests | CRUD with auth, ownership isolation, OCC with auth |
| `backend/tests/unit/` | ~20 tests | Service layer with mocked DB |
| `frontend/src/context/AuthContext.test.jsx` | 3 tests | Loading state, session restore, invalid token |
| `frontend/src/components/NoteForm.test.jsx` | ~10 tests | Form rendering, cancel button visibility |

---

# Required Documentation

Updated project tracking docs with:

## 1. Authentication Flow

**[x]** — Documented in README.md

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

## 2. Ownership Model

**[x]**

- Notes belong to users via `user_id` foreign key
- All repository queries filter by `user_id` (defense in depth — even if controller doesn't filter, the query won't return cross-user data)
- Authorization returns 404 (not 403) to avoid leaking note existence

## 3. Security Decisions

**[x]** — Documented in README.md

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Password hashing | bcrypt (10 rounds) | Industry standard, constant-time comparison, built-in salt |
| Token format | JWT (HS256) | Stateless, no server-side session storage needed |
| Token expiry | 24 hours | Balanced security vs UX; refresh tokens out of scope |
| Token storage | localStorage | Simple for this phase; httpOnly cookies recommended for production |
| Authorization | 404 on cross-user access | Prevents information leakage about existence of other users' notes |
| API protection | Middleware on every route | Consistent enforcement; no unprotected paths for notes |
| No password logging | Ensured at code level | Passwords/hashes never appear in logs |

---

# Expected Final Outcomes

After Phase 2:

- [x] system becomes multi-user
- [x] requests become identity-aware
- [x] notes become ownership-isolated
- [x] unauthorized access becomes impossible
- [x] APIs become trust-boundary aware

---

# Completion Criteria

Phase 2 is complete when:

- [x] users can signup/login securely
- [x] passwords are hashed correctly
- [x] JWT authentication works
- [x] protected APIs reject unauthenticated requests
- [x] users cannot access other users' notes
- [x] ownership tests pass
- [x] frontend restores authenticated sessions correctly
- [x] 91 tests passing (64 backend, 27 frontend)

---

# Known Limitations

- Token revocation not implemented (valid until expiry)
- No refresh token rotation (single long-lived JWT)
- localStorage vulnerable to XSS (mitigated by CSP in production)
- No rate limiting on auth endpoints
- No email verification on signup
