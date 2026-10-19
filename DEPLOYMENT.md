# Deploying portfolio-BE (Render Free + Neon)

NestJS 11 + Prisma 7 + PostgreSQL, on Render's free web service with Neon
for the database.

> The full setup guide (Neon, Cloudflare, checklist, troubleshooting,
> free-tier limits) is in
> [`docs/FREE-TIER-HOSTING.md`](../../docs/FREE-TIER-HOSTING.md).

---

## Commands

| Command | What it does |
|---|---|
| `npm run start:dev` | Watch mode |
| `npm run build` | `prisma generate` (via `prebuild`) then `nest build` → `dist/` |
| `npm run start:prod` | `node dist/main` — the production start command |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:migrate` | Create a migration (local/dev) |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:status` | Show applied/pending migrations |
| `npm run db:seed` | Seed the admin user + sample content |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Unit tests |
| `npm run test:e2e` | End-to-end tests (needs a real database) |

## Deploying to Render

Either use the Blueprint (`render.yaml`) or create the service manually.

**Manual:** New → Web Service → connect `islamAbuSleem/portfolio-BE`.

| Setting | Value |
|---|---|
| Region | Oregon |
| Branch | `main` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start:prod` |
| Instance Type | Free |
| Health Check Path | `/health` |

**Blueprint:** New → Blueprint → select the repo. `render.yaml` pre-fills
everything; supply the `sync: false` values.

### Environment variables

| Key | Required | Value |
|---|---|---|
| `DATABASE_URL` | yes | Neon **pooled** URL (host contains `-pooler`) |
| `JWT_SECRET` | yes | `openssl rand -base64 48` (Render can generate it) |
| `FRONTEND_URL` | yes | `https://portfolio-fe.<sub>.workers.dev` — comma-separated allow-list |
| `APP_URL` | recommended | The same origin, used to build magic-link emails |
| `TRUST_PROXY` | recommended | `1` |
| `NODE_ENV` | — | `production` (Render sets this) |
| `PORT` | — | Injected by Render; the app listens on `0.0.0.0:$PORT` |
| `COOKIE_DOMAIN` | no | Leave empty (host-only cookie) |
| `SMTP_*`, `FROM_EMAIL` | no | Only needed for magic-link login |

The app **fails to boot** in production if `DATABASE_URL`, `JWT_SECRET` or
`FRONTEND_URL` is missing, rather than starting in a broken state.

## Database

Neon Free. You need two connection strings:

- **Pooled** → `DATABASE_URL` (runtime traffic)
- **Direct** → `DIRECT_DATABASE_URL` (migrations only)

Prisma Migrate cannot run against a transaction-mode pooler, so migrations
always use the direct URL. `prisma.config.ts` prefers `DIRECT_DATABASE_URL`
and falls back to `DATABASE_URL`.

```bash
export DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require"

npm run db:deploy   # apply migrations
npm run db:seed     # optional: admin@example.com + sample content
```

**Migrations are never run automatically by the deploy.** Review the generated
SQL before applying it.

## Endpoints

| Route | Purpose | Touches the DB |
|---|---|---|
| `GET /health` | Liveness — used as Render's health check | No |
| `GET /health/ready` | Readiness — verifies the database round-trip | Yes |
| `GET /projects` `/skills` `/experience` `/about` | Public content | Yes |
| `POST /auth/login` `/auth/register` `/auth/logout` | Session (httpOnly cookie) | Yes |
| `GET /auth/me` | Current user | Yes |

`/health` deliberately does not touch the database: a cold Neon compute must
never make Render think the service is unhealthy and restart it.

## CORS

`FRONTEND_URL` is a comma-separated allow-list, compared against the
`Origin` header exactly (trailing slashes are normalised). Requests from an
unlisted origin get no CORS headers, so the browser blocks them. Credentials
are allowed, which is what the cookie session needs.

## Files added for deployment

| File | Purpose |
|---|---|
| `render.yaml` | Render Blueprint (free plan, build/start commands, env vars) |
| `Procfile` | `web:` / `release:` commands for Heroku-style hosts (e.g. Coolify) |
| `.env.example` | Every variable, documented |
| `src/health/` | Health and readiness endpoints |
| `src/common/filters/all-exceptions.filter.ts` | Safe error handling + logging |
| `src/config/env.validation.ts` | Fail-fast validation of required env vars |
| `.github/workflows/ci.yml` | Lint, build, unit tests, e2e tests |
