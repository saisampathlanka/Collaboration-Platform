# Collab — Phase 1: Monolith Base

> Tech Stack: React, Node.js, Express, PostgreSQL

## Table of Contents
1. [Problem Specification](#1-problem-specification)
2. [High-Level Design](#2-high-level-design)
3. [Data Model](#3-data-model)
4. [API Design](#4-api-design)
5. [Implementation Decisions](#5-implementation-decisions)
6. [Critical Engineering Thinking](#6-critical-engineering-thinking)
7. [Edge Cases](#7-edge-cases)
8. [Testing Strategy](#8-testing-strategy)
9. [Observability & Measurement](#9-observability--measurement)

---

## 1. Problem Specification

### 1.1 Functional Requirements

| # | Requirement | Status | Endpoint(s) |
|---|-------------|--------|-------------|
| 1 | Create a new note | [ ] | `POST /notes` |
| 2 | Edit an existing note | [ ] | `PUT /notes/:id` |
| 3 | Delete a note | [ ] | `DELETE /notes/:id` |
| 4 | View all notes | [ ] | `GET /notes` |
| 5 | View a single note | [ ] | `GET /notes/:id` |
| 6 | Data persistence across restarts | [ ] | Database |

### 1.2 Non-Functional Requirements

| # | Requirement | Target | Notes |
|---|-------------|--------|-------|
| 1 | Request latency | < 200ms (local) | Measured via request logger |
| 2 | Data integrity | Zero data loss | PostgreSQL ACID guarantees |
| 3 | Extensibility | Low coupling | Layered architecture (Controller → Service → Repository) |

---

## 2. High-Level Design

```
┌─────────────┐     HTTP/JSON     ┌──────────────────────────┐     SQL     ┌──────────────┐
│  Frontend   │ ──────────────────▶│  Backend (Monolith)      │ ──────────▶│  PostgreSQL  │
│  (React)    │ ◀───────────────── │  Express + Node.js       │ ◀────────── │  (relational)│
└─────────────┘                    │                          │            └──────────────┘
                                   │  ├── Controllers (HTTP)  │
                                   │  ├── Services (Logic)    │
                                   │  └── Repositories (DB)   │
                                   └──────────────────────────┘
```

**Data Flow:**
1. Frontend makes fetch call to Express API
2. Controller validates request and delegates to Service
3. Service applies business rules and delegates to Repository
4. Repository executes parameterized SQL against PostgreSQL
5. Result bubbles back through the layers to the client

---

## 3. Data Model

### Table: `notes`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Globally unique identifier |
| `title` | `VARCHAR(255)` | `NOT NULL`, `DEFAULT 'Untitled'` | Note heading |
| `content` | `TEXT` | `NOT NULL`, `DEFAULT ''` | Note body (supports large text) |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Last modification timestamp (auto-updated via trigger) |

### Trigger: `update_notes_updated_at`

Automatically sets `updated_at = CURRENT_TIMESTAMP` before every `UPDATE` on the `notes` table.

### ERD

```
┌──────────────────────────────────────┐
│ notes                                │
├──────────────┬───────────────────────┤
│ PK id        │ UUID                  │
│    title     │ VARCHAR(255)          │
│    content   │ TEXT                  │
│    created_at│ TIMESTAMP WITH TZ     │
│    updated_at│ TIMESTAMP WITH TZ     │
└──────────────┴───────────────────────┘
```

---

## 4. API Design

### 4.1 Endpoints

| Method | Path | Status Codes | Description |
|--------|------|--------------|-------------|
| `POST` | `/notes` | `201` Created, `400` Bad Request | Create a new note |
| `GET` | `/notes` | `200` OK | List all notes (ordered by `created_at DESC`) |
| `GET` | `/notes/:id` | `200` OK, `404` Not Found | Retrieve a single note |
| `PUT` | `/notes/:id` | `200` OK, `400` Bad Request, `404` Not Found | Update an existing note (partial update supported) |
| `DELETE` | `/notes/:id` | `204` No Content, `404` Not Found | Delete a note |

### 4.2 Request/Response Schemas

**POST /notes**

```json
// Request
{ "title": "string?", "content": "string?" }

// Response 201
{ "id": "uuid", "title": "string", "content": "string", "created_at": "ISO8601", "updated_at": "ISO8601" }
```

**PUT /notes/:id**

```json
// Request (partial — omit fields to keep existing values)
{ "title": "string?", "content": "string?" }

// Response 200
{ "id": "uuid", "title": "string", "content": "string", "created_at": "ISO8601", "updated_at": "ISO8601" }
```

**GET /notes**

```json
// Response 200
[
  { "id": "uuid", "title": "string", "content": "string", "created_at": "ISO8601", "updated_at": "ISO8601" }
]
```

**Error Response (4xx/5xx)**

```json
{ "error": "string" }
```

---

## 5. Implementation Decisions

### 5.1 Architecture

| Layer | Responsibility | File |
|-------|---------------|------|
| Controller | HTTP parsing, validation, status codes | `src/controllers/noteController.js` |
| Service | Business logic, error handling, orchestration | `src/services/noteService.js` |
| Repository | SQL queries, parameter binding | `src/repositories/noteRepository.js` |

### 5.2 Technology Choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| Database | PostgreSQL | ACID compliance, native UUID, triggers |
| ID Generation | Application-level UUID v4 | Scales beyond single DB, works for future distributed systems |
| ORM | Raw `pg` queries | Transparent SQL, no abstraction overhead, easy to audit |
| Frontend | React + Vite | Fast dev server, minimal boilerplate |
| State Management | React `useState` + inline fetch | Single resource, no need for external state library yet |

---

## 6. Critical Engineering Thinking

### 6.1 UUID vs Auto-Increment

- **UUID chosen** for distributed-system readiness and to avoid ID enumeration attacks
- **Trade-off**: larger index, slightly slower inserts — acceptable at this scale
- **Future consideration**: UUID v7 (time-ordered) if write throughput becomes a bottleneck

### 6.2 Full Content Overwrite (No OT/CRDT)

- **Current approach**: client sends complete new content, server overwrites
- **Known limitation**: concurrent edits will race — last write wins
- **Noted for Phase 2**: Operational Transforms (OT) or CRDTs needed for real-time collaboration
- **Mitigation**: `updated_at` timestamp visible so users can detect stale saves

### 6.3 N+1 Query Avoidance

- All endpoints execute a single query — no joins needed yet
- Pagination not implemented (assumes reasonable note count for Phase 1)

---

## 7. Edge Cases

| Scenario | Current Behavior | Status |
|----------|-----------------|--------|
| Update a non-existent note | Returns `404 { "error": "Note not found" }` | [ ] Handled |
| Delete the same note twice | Second delete returns `404` | [ ] Handled |
| Create note with empty title | Defaults to `"Untitled"` | [ ] Handled |
| Create note with empty content | Stored as `""` (valid) | [ ] Handled |
| Create note with no body fields | Returns `400` | [ ] Handled |
| Very large content (>1MB) | PostgreSQL `TEXT` handles up to 1GB; may add validation later | [ ] Deferred |
| Invalid UUID format on `:id` | PostgreSQL returns error → `400` | [ ] Handled |
| Concurrent duplicate deletes | Second request gets `404` | [ ] Handled |

---

## 8. Testing Strategy

### 8.1 Unit Tests — Service Layer

| Test Case | Expected Result |
|-----------|----------------|
| `create({ title, content })` → returns note with generated UUID | Pass |
| `create({})` → throws "Title or content is required" | Pass |
| `findById(existingId)` → returns note | Pass |
| `findById(nonExistentId)` → throws "Note not found" | Pass |
| `update(id, { title })` → updates only title, keeps content | Pass |
| `update(badId, ...)` → throws "Note not found" | Pass |
| `delete(existingId)` → returns true | Pass |
| `delete(badId)` → throws "Note not found" | Pass |

### 8.2 Integration Tests — API + Database

| Test Case | Flow |
|-----------|------|
| CRUD lifecycle | `POST` → `GET /:id` → `PUT` → `GET /:id` → `DELETE` → `GET /:id` (404) |
| List ordering | Create 3 notes → `GET /` returns newest first |
| Error responses | Invalid body → 400, missing resource → 404 |

### 8.3 Test Runner

- **Tool**: TBD (e.g., `vitest` for frontend, `supertest` + `jest` for backend)
- **DB**: Use a test database or transactional rollback per test

---

## 9. Observability & Measurement

### 9.1 Request Time Logging

- Middleware logs `METHOD PATH - STATUS - {duration}ms` for every HTTP request
- Target: < 200ms for all endpoints under local load

### 9.2 Database Query Time Logging

- `pool.query` wrapped to log SQL snippet + duration
- Helps identify slow queries before they become bottlenecks

### 9.3 Future Additions

- Structured JSON logging (for aggregation tools)
- Prometheus metrics endpoint (`/metrics`)
- Slow query threshold alerts (> 50ms)

---

## Project Structure

```
collab/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # PostgreSQL pool + init
│   │   ├── controllers/           # HTTP layer
│   │   ├── services/              # Business logic
│   │   ├── repositories/          # SQL queries
│   │   ├── routes/                # Express routers
│   │   └── middleware/            # Request logging
│   ├── server.js                  # App entrypoint
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── services/api.js        # Fetch API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```
