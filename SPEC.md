# Commercio — Project Specification

## 1. Overview
**Commercio** is a *merchant operating system*: a unified back-office dashboard that
consolidates four commerce modules — **Products/Inventory, Customers, Orders, and
Analytics** — for a single merchant business. It includes **LLM-driven inventory
analysis and sales summarization** with schema-constrained structured outputs.

## 2. Users & Scope
- **Primary user (MVP):** the business **owner** — single full-access user. No
  roles/permissions built yet, but the data model stays org-aware so staff + roles
  can be added later without a rewrite.
- **Auth:** Clerk. The owner signs in; the Clerk JWT is sent as a Bearer token to
  FastAPI, verified on every request.
- **No customer-facing storefront.** Orders are entered manually by the owner.
  "Customers" is a CRM-lite record list.
- **Demo data:** a seeded demo account pre-populated with products, customers, and
  orders so the app is immediately explorable.

## 3. Modules & Features

### Products / Inventory
- Fields: `name`, `sku` (unique), `description`, `price`, `cost`, `stock_quantity`,
  `reorder_threshold`, `category`, `image_url`. **No variants. No timestamps.**
- Inventory: **stock deducts at order creation**; orders exceeding available stock
  are **blocked (oversell rejected)**.

### Customers
- Fields: `name`, `email` (optional, unique if present), `phone` (optional),
  `created_at`.
- Computed (not stored): total orders, total spent, last order date.

### Orders
- Entities: **Order** (customer, status, timestamps, total) + **Order line items**
  (product, quantity, unit price captured at sale time).
- **4-state lifecycle:** `PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`.
- **Transitions:** Pending→Processing, Pending→Cancelled, Processing→Completed,
  Processing→Cancelled. Completed & Cancelled are terminal. Enforced as a
  server-side state machine.
- **Cancellation restocks** the order's inventory.

### Analytics
- **KPI cards:** Total revenue (Completed only), order count by status, average
  order value, total profit/margin (uses `cost`).
- **Charts/tables:** revenue over time (line), top-selling products (bar), low-stock
  products (table, at/below `reorder_threshold`).
- **Revenue = Completed orders only** (realized); Processing shown separately as
  pipeline.

### AI / LLM (OpenRouter, free models, on-demand)
- **Inventory analysis** → structured: `restock_recommendations[]`,
  `overstock_warnings[]`, `summary`. Fed by stock, thresholds, recent sales velocity.
- **Sales summarization** (time range) → structured: `headline`, `key_insights[]`,
  `trends[]`, `recommendations[]`. Fed by analytics aggregates.
- **Robustness layer:** output schemas defined as **Pydantic models**; request
  structured output from OpenRouter, then **validate + auto-retry/repair** on
  malformed responses, with a **model-fallback list** (free models can be
  rate-limited/unavailable).

## 4. Tech Stack
- **Frontend:** React + TypeScript, **Vite**, **Tailwind CSS + shadcn/ui**,
  **Recharts**, **React Router**, **React Query**, **Clerk** (React SDK).
- **Backend:** **FastAPI** (Python), **SQLAlchemy ORM + Alembic** migrations,
  Pydantic, Clerk JWT verification.
- **Database:** **PostgreSQL**.
- **LLM:** OpenRouter (free models, fallback list).

## 5. Architecture
- **Monorepo:** `/frontend` + `/backend`.
- **API:** REST, route groups per module — `/products`, `/orders`, `/customers`,
  `/analytics`, `/ai`.
- Frontend ↔ Backend: React Query over REST; Clerk JWT as Bearer; FastAPI verifies
  per request.

## 6. Deployment
- **GitHub-hosted repo** + **local via full Docker Compose** (frontend + backend +
  Postgres).
- Includes `docker-compose.yml`, `.gitignore`, README (clone-and-run), seed script,
  Alembic migrations.

## 7. Data Model (summary)
- **Products** — name, sku, description, price, cost, stock_quantity,
  reorder_threshold, category, image_url
- **Customers** — name, email, phone, created_at
- **Orders** — customer, status, created_at, updated_at, total
- **Order line items** — order, product, quantity, unit_price (captured at sale time)
