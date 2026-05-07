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
│   │   ├── config/db.js       # PostgreSQL pool + table init (OCC: version column)
│   │   ├── app.js             # Express app (testable export)
│   │   ├── controllers/       # HTTP handlers (OCC: 409 conflict)
│   │   ├── services/          # Business logic (OCC: version validation)
│   │   ├── repositories/      # SQL queries (OCC: version-aware UPDATE)
│   │   ├── routes/            # Express routers
│   │   └── middleware/        # Request + OCC logging
│   ├── tests/
│   │   ├── setup.js           # DB init + transactional rollback
│   │   ├── unit/              # Service layer tests (mocked DB, OCC)
│   │   └── integration/       # Full API + DB tests (OCC concurrency)
│   ├── server.js              # Entrypoint (listens)
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components + tests
│   │   ├── services/api.js    # Fetch API client (OCC: version + 409)
│   │   ├── App.jsx            # Conflict banner + retry flow
│   │   └── test/setup.js      # Vitest + jest-dom setup
│   └── package.json
├── README.md
├── PHASE1_CONTEXT.md          # Phase 1 design spec (CRUD, data model, API)
└── PHASE1.5_CONTEXT.md        # Phase 1.5 design spec (OCC, conflict detection)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notes` | Create a note (version starts at 1) |
| `GET` | `/notes` | List all notes (includes version) |
| `GET` | `/notes/:id` | Get a note (includes version) |
| `PUT` | `/notes/:id` | Update a note (requires version, increments on success) |
| `DELETE` | `/notes/:id` | Delete a note |

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Monolith — CRUD notes app with React + Express + PostgreSQL | Complete |
| **1.5** | Optimistic Concurrency Control (version-based conflict detection) | Complete |
| **2** | Real-time collaboration (OT/CRDT, WebSockets) | Planned |

## Testing

```bash
cd backend && pnpm test   # 51 tests (Jest + Supertest)
cd frontend && pnpm test  # 12 tests (Vitest + React Testing Library)
```

## Documentation

- [PHASE1_CONTEXT.md](./PHASE1_CONTEXT.md) — Phase 1 design spec (CRUD, data model, API, edge cases)
- [PHASE1.5_CONTEXT.md](./PHASE1.5_CONTEXT.md) — Phase 1.5 design spec (OCC, conflict detection, version flow)
