# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Commercio is a **merchant operating system** — a unified back-office dashboard for products/inventory, customers, orders, and analytics, with LLM-driven inventory analysis and sales summarization. See [SPEC.md](SPEC.md) for the full product specification. The app is owner-only for the MVP (single full-access user, no role system yet).

## Running the project

### Full stack (recommended)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend: http://localhost:5173
- API + Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Backend only (local dev)

```bash
cd backend
python -m venv .venv
.venv/Scripts/Activate.ps1        # Windows PowerShell
pip install -r requirements.txt
# ensure backend/.env exists and DATABASE_URL points at a running Postgres
uvicorn app.main:app --reload
```

### Frontend only (local dev)

```bash
cd frontend
npm install
npm run dev
```

### Database migrations

```bash
cd backend
alembic revision --autogenerate -m "<message>"
alembic upgrade head
```

### Seed demo data

```bash
cd backend
python -m app.seed
```

(Scaffold only — population logic added once ORM models exist.)

## Architecture

### Monorepo layout

```
backend/   FastAPI app
frontend/  Vite + React + TypeScript app
```

### Backend (`backend/app/`)

| Path | Purpose |
|------|---------|
| `main.py` | FastAPI app factory, CORS, router registration |
| `config.py` | All env vars via `pydantic-settings`; access via `settings` singleton |
| `database.py` | SQLAlchemy engine, `SessionLocal`, `Base`, and `get_db()` FastAPI dependency |
| `core/auth.py` | `get_current_user` dependency — verifies Clerk JWT using PyJWT + JWKS; returns a stub `AuthUser` when `AUTH_DISABLED=true` |
| `routers/` | One file per module: `products`, `customers`, `orders`, `analytics`, `ai` |
| `models/` | SQLAlchemy ORM models (to be added); import them in `models/__init__.py` so Alembic autogenerate sees them |
| `schemas/` | Pydantic request/response schemas and schema-constrained LLM output models |
| `seed.py` | Demo data seeder — run once to populate a usable demo account |
| `alembic/env.py` | Reads `settings.database_url`; imports `app.models` for autogenerate |

All protected routes accept a Clerk JWT as a Bearer token. Add `Depends(get_current_user)` to any route that needs auth.

### Frontend (`frontend/src/`)

| Path | Purpose |
|------|---------|
| `main.tsx` | Root — mounts ClerkProvider (conditional on `VITE_CLERK_PUBLISHABLE_KEY`), QueryClientProvider, BrowserRouter |
| `App.tsx` | Route tree; all module pages are children of `Layout` |
| `components/Layout.tsx` | Sidebar nav shell using React Router `NavLink` and `Outlet` |
| `lib/api.ts` | `apiFetch<T>()` — thin fetch wrapper; pass `token` to attach `Authorization: Bearer` header |
| `lib/queryClient.ts` | Shared `QueryClient` instance (30 s stale time, no refetch-on-focus) |
| `pages/` | One file per module; currently placeholder pages |

### Key data decisions (from SPEC.md)

- **Stock deducts at order creation**; orders that exceed `stock_quantity` are rejected (no oversell).
- **4-state order lifecycle:** `PENDING → PROCESSING → COMPLETED` and `PENDING/PROCESSING → CANCELLED`. Completed and Cancelled are terminal. Cancelling from Processing **restocks** inventory.
- **Revenue** is counted from `COMPLETED` orders only.
- **Products** have no timestamps and no variants. `cost` enables margin analytics.
- **LLM features** (inventory analysis, sales summarization) hit OpenRouter using free models with a Pydantic-validated, auto-retry/repair robustness layer and a model-fallback list (`OPENROUTER_MODELS`).

### Auth flow

1. Frontend sends Clerk JWT as `Authorization: Bearer <token>`.
2. FastAPI `get_current_user` dependency verifies the JWT against Clerk's JWKS endpoint.
3. Set `AUTH_DISABLED=true` in `backend/.env` to skip verification during local dev (returns a stub `AuthUser(id="demo-owner")`).

### Adding shadcn/ui components

shadcn/ui components are pulled in on-demand — they are not pre-installed:

```bash
cd frontend
npx shadcn@latest add <component-name>
```
