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
pnpm db:up        # start local postgres (docker)
pnpm db:down      # stop local postgres
pnpm db:logs      # tail postgres logs
```

## Database (Drizzle + Postgres)

Files:

- `db/schema.ts`: Drizzle schema
- `db/client.ts`: Postgres client + Drizzle instance
- `drizzle.config.ts`: Drizzle CLI config (loads `.env*` using `@next/env`)
- `docker-compose.yml`: local Postgres service (`postgres:17-alpine`) on `127.0.0.1:6543`

Local setup:

```bash
cp .env.example .env
pnpm db:up
pnpm db:migrate
```

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

## Quest Visualizer (ARDB)

Visit:

- `/quests`

What it does:

- Fetches ARDB quest summaries (`/quests`) and attempts detail enrichment (`/quests/{id}`).
- Resolves item/enemy references via `/items` and `/arc-enemies` when IDs match.
- Supports grouped browsing, search, filtering, local pinning, local completion state, and hide-completed mode.

ARDB fields currently used:

- Quest: `id`, `title`, `description`, `trader`, `maps`, `steps`, `requiredItems`, `rewardItems`, `grantedItems`, `oneRound`, `xpReward`, `updatedAt`, `image`, `sources`
- Step: `title`, `amount`, `markers`, `relatedLocationTypes`, `relatedLocationIds`
- Item refs: `item.id`, `item.name`, `item.type`, `item.rarity`, `item.icon` (+ fallback from `/items`)
- ARC refs: `id`, `name`, `icon` from `/arc-enemies`

Assumptions and schema resilience:

- ARDB does not currently expose an explicit quest-chain/prerequisite field, so no dependency graph is fabricated.
- Relative image/icon paths are prefixed with `https://ardb.app/static`.
- Normalization is defensive and tolerant of missing fields; fallback lookup-by-id is used where possible.

If ARDB response shapes change, update:

- `lib/ardb/quest-visualizer.ts` (normalization + enrichment logic)
- `lib/ardb/client.ts` (endpoint and fetch behavior)

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
