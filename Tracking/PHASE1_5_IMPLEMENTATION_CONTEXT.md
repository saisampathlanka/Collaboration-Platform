# PHASE 1.5 — IMPLEMENTATION OBJECTIVE

# Goal

Implement optimistic concurrency control (OCC) for notes updates to prevent stale clients from overwriting newer updates.

---

# Problem To Solve

Currently:

- multiple clients can fetch same note
- stale client updates can overwrite latest data
- system has no conflict detection

Need to implement:

- stale update detection
- conflict-safe updates
- version-aware synchronization

---

# Required Backend Changes

## 1. Database Schema

Add:

```sql
version INTEGER NOT NULL DEFAULT 1
```

---

## 2. GET Note Response

Every note response must include:

```json
{
  "id": "...",
  "title": "...",
  "content": "...",
  "version": 1
}
```

---

## 3. Update Request Contract

Client MUST send:

```json
{
  "title": "...",
  "content": "...",
  "version": 1
}
```

---

## 4. Update Query

Update must only succeed if versions match.

Required query behavior:

```sql
UPDATE notes
SET
    title = $1,
    content = $2,
    version = version + 1,
    updated_at = NOW()
WHERE
    id = $3
AND version = $4;
```

---

## 5. Conflict Handling

If update affects:

```text
0 rows
```

return:

```http
409 Conflict
```

Example response:

```json
{
  "error": "Note has been modified by another client"
}
```

---

# Required Frontend Changes

Frontend must:

- store note version
- send version during update
- handle 409 conflict response

---

# Required Conflict Handling Behavior

Minimum expected behavior:

- notify user about stale update
- prevent silent overwrite
- refresh latest note state OR ask user to reload

---

# Required Testing

## 1. Integration Test — Concurrent Update Conflict

Test flow:

1. Create note
2. Fetch note twice
3. Simulate Client A + Client B
4. Client A updates successfully
5. Client B updates with stale version
6. Verify:
   - second update fails
   - 409 returned
   - DB state unchanged
   - version incremented correctly

---

## 2. API Validation Tests

Validate:

- missing version rejected
- invalid version rejected
- stale version rejected

---

# Required Logging

Log:

- successful updates
- version conflicts
- stale update attempts

Minimum log fields:

```text
note_id
client_version
current_version
```

---

# Expected Results After Phase 1.5

After implementation:

- stale clients cannot overwrite latest data
- concurrent conflicts are detected safely
- system becomes concurrency-aware
- frontend becomes synchronization-aware
- API supports version-safe updates

---

# Constraints

This phase does NOT include:

- realtime collaboration
- WebSockets
- OT
- CRDT
- live synchronization
- automatic merge resolution

Only implement:

- conflict detection
- optimistic locking
- version-safe updates

---

# Deliverables

## Backend
- schema updated
- OCC update query implemented
- 409 conflict response implemented

## Frontend
- version-aware updates
- conflict handling implemented

## Tests
- concurrent update integration test
- validation tests

## Documentation
Update project documentation with:

- OCC flow
- version-based update flow
- conflict handling flow
- test strategy

---

# Completion Criteria

Phase 1.5 is complete when:

- concurrent stale updates fail safely
- valid updates succeed correctly
- version increments correctly
- conflicts return HTTP 409
- tests validate concurrency behavior
