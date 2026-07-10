# NAFGEM HR Management System

Staff portal for **NAFGEM Tanzania** — PostgreSQL + Express + Vite/React. Brand colors match [nafgemtanzania.or.tz](https://nafgemtanzania.or.tz) (maroon + orange). Five-role RBAC, JWT login, admin-created users only.

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

- Login only at `/auth` — **no self-registration**
- Admins create users under **User Management → Add New User**
- Default seed: `admin@local.dev` / `admin123` (change before deploy)

## Hosting at hr.nafgemtanzania.or.tz (Contabo)

Same VPS as the main website. Step-by-step: **[deploy/HOSTING.md](deploy/HOSTING.md)**.

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

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
- **Staff Requests** — `/staff-requests`
- **Donor Projects** — `/hr/projects`
- **Field Activity Reports** — `/field-reports`, `/hr/field-reports`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate` | Apply schema + migrations |
| `npm run db:seed` | Seed super admin |
| `npm run server` | Express API |
| `npm run dev` | Vite frontend |
| `npm run build` | Production build |

## Architecture

- Frontend: `src/` — brand tokens in `src/index.css`
- API: `server/` — CRUD `/api/db/:table`, auth `/api/auth/login` + `/api/auth/users`, uploads `/api/storage/:bucket`
- Deploy: `Dockerfile`, `docker-compose.prod.yml`, `deploy/`
