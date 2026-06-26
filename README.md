# Commercio

A **merchant operating system** — a unified back-office dashboard that consolidates
four commerce modules (**Products/Inventory, Customers, Orders, Analytics**) for a
single merchant business, with **LLM-driven inventory analysis and sales
summarization**.

See [SPEC.md](SPEC.md) for the full product specification.

> **Status:** scaffold. The project structure, tooling, and wiring are in place.
> Business features are implemented in later phases.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React + TypeScript, Vite, Tailwind CSS + shadcn/ui, Recharts, React Router, React Query, Clerk |
| Backend  | FastAPI, SQLAlchemy + Alembic, Pydantic, Clerk JWT verification |
| Database | PostgreSQL |
| LLM      | OpenRouter (free models, with fallback list) |

## Repository layout

```
.
├── SPEC.md                 # Full product specification
├── docker-compose.yml      # Postgres + backend + frontend
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── main.py         # App entrypoint + router wiring
│   │   ├── config.py       # Env-based settings
│   │   ├── database.py     # SQLAlchemy engine/session/base
│   │   ├── core/auth.py    # Clerk JWT verification dependency
│   │   ├── routers/        # products, customers, orders, analytics, ai
│   │   ├── models/         # ORM models (later phase)
│   │   ├── schemas/        # Pydantic schemas (later phase)
│   │   └── seed.py         # Demo data seeder (later phase)
│   └── alembic/            # Migrations
└── frontend/               # Vite + React + TS app
    └── src/
        ├── main.tsx        # Providers: Clerk, React Query, Router
        ├── App.tsx         # Routes
        ├── components/     # Layout + shared UI
        ├── pages/          # Dashboard, Products, Orders, Customers, Analytics
        └── lib/            # api client, query client
```

## Quick start (Docker Compose)

The fastest way to run the whole stack locally.

1. Create the env files from the examples:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Bring everything up:

   ```bash
   docker compose up --build
   ```

3. Open the apps:

   - Frontend: http://localhost:5173
   - API docs (Swagger): http://localhost:8000/docs
   - API health check: http://localhost:8000/health

> Auth is disabled by default (`AUTH_DISABLED=true` in `backend/.env`) and the
> frontend runs without Clerk until you add `VITE_CLERK_PUBLISHABLE_KEY`, so the
> scaffold runs out of the box. Add your Clerk and OpenRouter keys to the `.env`
> files when you're ready to enable auth and AI features.

## Running without Docker (local dev)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env             # then point DATABASE_URL at your Postgres
uvicorn app.main:app --reload
```

Database migrations (once models exist):

```bash
alembic revision --autogenerate -m "message"
alembic upgrade head
```

Seed demo data (later phase):

```bash
python -m app.seed
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment variables

### `backend/.env`

| Variable             | Purpose                                            |
|----------------------|----------------------------------------------------|
| `DATABASE_URL`       | PostgreSQL connection string                       |
| `CLERK_JWKS_URL`     | Clerk JWKS endpoint for token verification         |
| `CLERK_ISSUER`       | Expected token issuer                              |
| `CLERK_AUDIENCE`     | Expected audience claim (optional)                 |
| `AUTH_DISABLED`      | `true` to bypass auth in local dev                 |
| `OPENROUTER_API_KEY` | OpenRouter API key                                 |
| `OPENROUTER_MODELS`  | Comma-separated free-model fallback list           |
| `CORS_ORIGINS`       | Allowed frontend origins                           |

### `frontend/.env`

| Variable                      | Purpose                          |
|-------------------------------|----------------------------------|
| `VITE_CLERK_PUBLISHABLE_KEY`  | Clerk publishable key            |
| `VITE_API_BASE_URL`           | Base URL of the Commercio API    |
