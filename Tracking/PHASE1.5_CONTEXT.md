# Phase 1.5 — Optimistic Concurrency Control (OCC)

> Status: Complete
> Builds on: Phase 1 (Monolith Base)

---

## Goal

Prevent stale clients from silently overwriting newer note updates by implementing version-based conflict detection (optimistic locking).

---

## Problem Solved

### Before Phase 1.5
```
Client A ── GET /notes/1 ──► { title: "Hello" }
Client B ── GET /notes/1 ──► { title: "Hello" }
Client A ── PUT /notes/1 ──► { title: "From A" }       ✓ saved
Client B ── PUT /notes/1 ──► { title: "From B" }       ✓ saved (silently overwrites A!)
```

### After Phase 1.5
```
Client A ── GET /notes/1 ──► { title: "Hello", version: 1 }
Client B ── GET /notes/1 ──► { title: "Hello", version: 1 }
Client A ── PUT /notes/1 ──► { title: "From A", version: 1 }   ✓ saved, version → 2
Client B ── PUT /notes/1 ──► { title: "From B", version: 1 }   ✗ 409 Conflict
```

---

## Architecture Changes

### Data Model

Added `version` column to `notes` table:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `version` | `INTEGER` | `NOT NULL`, `DEFAULT 1` | Incremented on every successful update |

Migration is idempotent — existing tables get the column added via `ALTER TABLE ADD COLUMN IF NOT EXISTS`.

### OCC Update Flow

```
┌──────────┐                              ┌──────────┐
│ Client   │                              │ Server   │
└────┬─────┘                              └────┬─────┘
     │  GET /notes/:id                         │
     │ ──────────────────────────────────────► │
     │                                         │
     │  { id, title, content, version: 3 }     │
     │ ◄────────────────────────────────────── │
     │                                         │
     │  PUT /notes/:id                         │
     │  { title, content, version: 3 }         │
     │ ──────────────────────────────────────► │
     │                                         │
     │                           Check version │
     │                           3 == 3? YES   │
     │                                         │
     │  UPDATE notes                           │
     │  SET version = version + 1              │
     │  WHERE id = $1 AND version = $2         │
     │                                         │
     │  { id, title, content, version: 4 }     │
     │ ◄────────────────────────────────────── │  200 OK
     │                                         │
     │  PUT /notes/:id (stale)                 │
     │  { title, content, version: 3 }         │
     │ ──────────────────────────────────────► │
     │                                         │
     │                           Check version │
     │                           3 == 4? NO    │
     │                                         │
     │  { error, noteId,                       │
     │    clientVersion, currentVersion }      │
     │ ◄────────────────────────────────────── │  409 Conflict
```

### SQL Query

```sql
UPDATE notes
SET
    title = $1,
    content = $2,
    version = version + 1,
    updated_at = clock_timestamp()
WHERE
    id = $3
    AND version = $4
RETURNING *;
```

Returns the updated row if version matched, empty result if it didn't (race condition guard).

---

## API Contract

### GET Response (all endpoints returning notes)

```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "version": 3,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

### PUT Request

```json
{
  "title": "string",
  "content": "string",
  "version": 3
}
```

`version` is required. Without it, the request returns `400`.

### PUT 409 Conflict Response

```json
{
  "error": "Note has been modified by another client",
  "noteId": "uuid",
  "clientVersion": 1,
  "currentVersion": 3
}
```

---

## Implementation Details

### Backend Layer Responsibilities

| Layer | Responsibility | File |
|-------|---------------|------|
| Repository | Version-aware SQL (`updateWithVersion`) | `src/repositories/noteRepository.js` |
| Service | Version validation, conflict detection, `ConflictError` | `src/services/noteService.js` |
| Controller | 409 response mapping, conflict details | `src/controllers/noteController.js` |

### Version Validation Rules

| Input | Result |
|-------|--------|
| `version` missing | `400` — "Version is required for updates" |
| `version` is string | `400` — "Invalid version number" |
| `version` is float | `400` — "Invalid version number" |
| `version` ≤ 0 | `400` — "Invalid version number" |
| `version` < current | `409` — stale update |
| `version` == current | `200` — update succeeds, version +1 |

### Logging Format

```
OCC UPDATE: note_id=<uuid> version 3 -> 4
OCC CONFLICT: note_id=<uuid> client_version=1 current_version=3
```

---

## Frontend Behavior

### On Successful Update
1. Sends current `version` with title/content
2. Receives updated note with incremented `version`
3. Closes edit form, refreshes note list

### On 409 Conflict
1. Shows yellow conflict banner with message:
   - "Note has been modified by another client"
   - "Your version (v1) was stale. Current version is v3."
2. Refreshes note list to show latest data
3. Opens edit form with the latest version so user can retry
4. Dismiss button closes conflict state

---

## Test Coverage

### Backend — OCC Integration Tests (13 tests)

| Test | What It Verifies |
|------|-----------------|
| Concurrent update conflict | Client A succeeds, Client B gets 409 |
| DB state unchanged after conflict | Stale update doesn't modify data |
| Version increments correctly | 5 sequential updates: v1→v2→v3→v4→v5→v6 |
| Retry succeeds after resolving | Client B retries with `currentVersion`, succeeds |
| Stale version far behind | v1 submitted when current is v5 → 409 |
| Missing version → 400 | No `version` in body |
| Invalid version (string) → 400 | `"abc"` |
| Zero version → 400 | `0` |
| Negative version → 400 | `-1` |
| Float version → 400 | `1.5` |
| Updated response includes version | `version` field in 200 response |
| GET response includes version | All notes have `version` field |
| Full CRUD lifecycle with version | Create(v1) → Read(v1) → Update(v2) → Delete |

### Frontend — Component Tests

Existing component tests updated to work with version-aware components.

---

## Constraints (Out of Scope)

This phase deliberately does NOT implement:

- Real-time collaboration
- WebSockets or live sync
- Operational Transforms (OT)
- CRDTs
- Automatic merge resolution

Only conflict detection and prevention — no resolution.

---

## Completion Checklist

- [x] `version` column added to database schema
- [x] OCC update query implemented with version check
- [x] 409 conflict response with version details
- [x] Version validation (required, integer ≥ 1)
- [x] Frontend stores and sends version on update
- [x] Frontend handles 409 with user notification
- [x] Conflict logging (note_id, client_version, current_version)
- [x] Concurrent update integration test
- [x] Version validation tests
- [x] All existing tests pass with version field
- [x] Documentation updated

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/config/db.js` | `version` column + migration |
| `backend/src/repositories/noteRepository.js` | `updateWithVersion()` method |
| `backend/src/services/noteService.js` | Version validation, `ConflictError`, OCC logic |
| `backend/src/controllers/noteController.js` | 409 handling with conflict details |
| `backend/tests/setup.js` | Schema includes `version` |
| `backend/tests/unit/noteService.test.js` | OCC unit tests |
| `backend/tests/integration/notes.test.js` | 13 OCC integration tests |
| `frontend/src/services/api.js` | Version in request, 409 error parsing |
| `frontend/src/App.jsx` | Conflict state, banner UI, retry flow |
| `frontend/src/App.css` | `.conflict-banner` styles |
