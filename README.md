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
├── backend/          # Express API (port 3000)
│   └── src/
│       ├── config/   # DB connection + table init
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── routes/
│       └── middleware/
├── frontend/         # React SPA (Vite dev server)
│   └── src/
│       ├── components/
│       └── services/
├── PHASE1_CONTEXT.md # Detailed design spec for Phase 1
└── README.md
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
| **1** | Monolith — CRUD notes app with React + Express + PostgreSQL | In Progress |
| **2** | Real-time collaboration (OT/CRDT, WebSockets) | Planned |

See [PHASE1_CONTEXT.md](./PHASE1_CONTEXT.md) for the full design specification, data model, edge cases, and testing strategy for Phase 1.
