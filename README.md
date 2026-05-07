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
│   │   ├── config/db.js       # PostgreSQL pool + table init
│   │   ├── app.js             # Express app (testable export)
│   │   ├── controllers/       # HTTP handlers
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # SQL queries
│   │   ├── routes/            # Express routers
│   │   └── middleware/        # Request logging
│   ├── tests/
│   │   ├── setup.js           # DB init + transactional rollback
│   │   ├── unit/              # Service layer tests (mocked DB)
│   │   └── integration/       # Full API + DB tests
│   ├── server.js              # Entrypoint (listens)
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components + tests
│   │   ├── services/api.js    # Fetch API client
│   │   ├── App.jsx
│   │   └── test/setup.js      # Vitest + jest-dom setup
│   └── package.json
├── README.md
└── PHASE1_CONTEXT.md          # Phase 1 design spec
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/notes` | Create a note |
| `GET` | `/notes` | List all notes |
| `GET` | `/notes/:id` | Get a note |
| `PUT` | `/notes/:id` | Update a note |
| `DELETE` | `/notes/:id` | Delete a note |

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Monolith — CRUD notes app with React + Express + PostgreSQL | Complete |
| **2** | Real-time collaboration (OT/CRDT, WebSockets) | Planned |

## Testing

```bash
cd backend && pnpm test   # 38 tests (Jest + Supertest)
cd frontend && pnpm test  # 12 tests (Vitest + React Testing Library)
```

See [PHASE1_CONTEXT.md](./PHASE1_CONTEXT.md) for the full design specification, data model, edge cases, and testing strategy for Phase 1.
