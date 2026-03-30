# Next.js Vibe Starter

Starter kit for shipping quickly with:

- Next.js 16 + App Router
- Drizzle ORM + PostgreSQL
- shadcn/ui-style primitives
- Recharts demo page
- Coolify-friendly build output

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env` and update values.

3. Start development:

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

```bash
pnpm dev          # normal Next.js dev server
pnpm dev:env      # auto-restarts dev server when .env* files change
pnpm lint
pnpm build
pnpm start
pnpm start:standalone
```

## Database (Drizzle + Postgres)

Files:

- `db/schema.ts`: Drizzle schema
- `db/client.ts`: Postgres client + Drizzle instance
- `drizzle.config.ts`: Drizzle CLI config (loads `.env*` using `@next/env`)

Commands:

```bash
pnpm db:generate  # create SQL migrations from schema changes
pnpm db:migrate   # apply migrations
pnpm db:push      # push schema directly (fast iteration)
pnpm db:studio    # open Drizzle Studio
```

DB health endpoint:

- `GET /api/health/db`

## Charts Demo

Visit:

- `/charts`

This page demonstrates multiple Recharts visualizations styled with shadcn-style UI card components.

## Coolify Notes

- `next.config.ts` is set to `output: "standalone"` for container-friendly deployments.
- `pnpm start:standalone` runs `.next/standalone/server.js`.
- `HOSTNAME` and `PORT` are included in `.env.example`.
- Runtime env usage is ready for self-hosting flows.

## Coolify Template

### Option A: Dockerfile Deploy (recommended)

Use the repo `Dockerfile` directly.

- Build Pack: `Dockerfile`
- Dockerfile Location: `./Dockerfile`
- Exposed Port: `3000`

Environment variables:

- `DATABASE_URL=postgresql://...`
- `HOSTNAME=0.0.0.0`
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1`

### Option B: Build/Start Commands

If you are not using Dockerfile mode, use:

- Build Command: `pnpm install --frozen-lockfile && pnpm build`
- Start Command: `pnpm start:standalone`
- Port: `3000`

Environment variables:

- `DATABASE_URL=postgresql://...`
- `HOSTNAME=0.0.0.0`
- `PORT=3000`
- `NEXT_TELEMETRY_DISABLED=1`
