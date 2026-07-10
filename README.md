# NAFGEM HR Management System

Staff portal for **NAFGEM Tanzania** — PostgreSQL + Express + Vite/React. Branded for NAFGEM (teal + orange), with five-role RBAC, JWT login, and modules for training, staff requests, donor projects, and field activity reports.

## Prerequisites

- Node.js 18+
- **Docker Desktop** for local PostgreSQL

## Quick start

```sh
npm install
npm run server:install
npm run db:up
npm run db:migrate
npm run db:seed
npm run server    # API :4000
npm run dev       # UI :8080
```

Open http://localhost:8080

### Local dev (no login)

Set in `.env`:

```
AUTH_DISABLED=true
VITE_AUTH_DISABLED=true
```

You enter as stub **Super Admin** (`admin@local.dev`).

### Production login

Default seed password: `admin123` (change before deploy).

Login page: `/auth` — footer links to https://nafgemtanzania.or.tz

## Environment

```
DATABASE_URL=postgresql://harmony:harmony@localhost:5432/harmony_hr
PORT=4000
VITE_API_URL=http://localhost:4000
JWT_SECRET=change-me-in-production
AUTH_DISABLED=true
VITE_AUTH_DISABLED=true
VITE_MAIN_SITE_URL=https://nafgemtanzania.or.tz
VITE_HR_PORTAL_URL=https://hr.nafgemtanzania.or.tz
```

## Roles

| Role | Access |
|------|--------|
| Super Admin | Full access |
| HR Admin | All HR features, records, reports, staff requests |
| Manager | Team-scoped (via `manager_id`) — tasks, field reports |
| Employee | Own profile, tasks, leave, staff requests, field reports |
| Field Officer | Own field reports only |

## Modules

- **Training & Certifications** — `/training`, `/hr/training`
- **Staff Requests** — `/staff-requests` (maintenance, IT, supplies, etc.; leave-style two-stage approval)
- **Donor Projects** — `/hr/projects` with staff allocation
- **Field Activity Reports** — `/field-reports`, `/hr/field-reports` (filter + CSV export)

## Main website integration

On [nafgemtanzania.or.tz](https://nafgemtanzania.or.tz), add a navbar link **Staff Portal** → `https://hr.nafgemtanzania.or.tz`. No shared user database.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate` | Apply `schema.sql` + `migrate_v2*.sql` + `migrate_v3.sql` + `migrate_v4.sql` |
| `npm run db:seed` | Seed super admin + leave balances |
| `npm run server` | Express API |
| `npm run dev` | Vite frontend |
| `npm run build` | Production build |

## Architecture

- Frontend: `src/` — NAFGEM brand tokens in `src/index.css`
- API: `server/` — CRUD `/api/db/:table`, auth `/api/auth/login`, uploads `/api/storage/:bucket`
- Migrations: `server/db/schema.sql`, `server/db/migrate_v2.sql`
