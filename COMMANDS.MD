# GiniVibe Run Guide

Everything below runs on `localhost` with defaults — no extra config needed
except the API keys noted in step 1. Use one terminal tab per service.

## 0. Service map (ports)

| Service | Folder | Port |
|---|---|---|
| PostgreSQL | `db/` (docker) | 5432 |
| Monolith (auth, feed, search, matching data) | `backend/monolithic` | 3001 |
| Events microservice | `backend/microservices/events-service` | 3002 |
| Non-live matching | `backend/microservices/non-live-matching` | 3003 |
| Gini AI (characters + chat) | `backend/microservices/Gini_AI` | 3004 |
| Rooms (needs LiveKit, step 1) | `backend/microservices/rooms-service` | 3007 |
| Astrology | `backend/microservices/astrology` | 3006 |
| Live matching (WebSocket signaling) | `backend/microservices/live-matching` | 8080 |
| Web app (Next.js) | `frontend-web` | 3000 |
| Mobile app (Expo) | `frontend-app` | 8081 |

## 1. API keys (one-time setup)

**OpenRouter — Gini AI + Astrology.** Both services talk to an
OpenAI-compatible endpoint via three variables that already live in
`backend/microservices/Gini_AI/.env` and
`backend/microservices/astrology/.env`:

```bash
LIGHTNING_API_KEY=sk-or-v1-...      # your OpenRouter key (already filled in)
LIGHTNING_API_URL=https://openrouter.ai/api/v1/chat/completions
LIGHTNING_MODEL=openai/gpt-4o-mini   # swap for any OpenRouter model id
```

> These `.env` files are git-ignored. The key is a live secret — if it ever
> leaks (chat logs, screenshots, shared terminals), rotate it at
> openrouter.ai/keys and update the two files above.

**What does NOT use this key:** user search (monolith) posts to a custom
`LLM_INTERPRETER_ENDPOINT` with its own `{system, query}` contract, and
non-live matching is rules-based (`DATABASE_URL` + `JWT_SECRET` only).
Rooms needs its own provider — copy the template and fill it in:

```bash
cp backend/microservices/rooms-service/.env.example backend/microservices/rooms-service/.env
# then set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
```

The rooms service refuses to boot without LiveKit credentials.

## 2. Database

```bash
sudo systemctl start docker        # only if the Docker daemon is down
cd db
docker compose up -d
```

This starts `ginivibe-postgres` (`root` / `password`, db `ginivibe`).

## 3. Migrate + seed (one-time, then re-runnable)

The monolith ships a backfill migration
(`prisma/migrations/20260915030000_backfill_missing_tables/`) that creates
tables the first two migrations never did. Without it, seeding fails with
`P2022: column does not exist`. All seeds are idempotent upserts.

```bash
# Monolith: interests + feed demo data (users, posts, comments, likes)
cd backend/monolithic
npm install
npx prisma generate
npx prisma migrate deploy
node src/seed.ts          # interests + sub-interests
node src/seed_feed.ts     # 4 demo users, communities, posts, comments, likes

# Events service: 6 demo events (1 live, 4 upcoming, 1 past) + attendees
cd ../microservices/events-service
npm install
npx prisma generate --config prisma.config.ts
npx prisma migrate deploy --config prisma.config.ts
npm run seed

# Matching samples: preferences for the 3 main demo users
cd ../../monolithic
node --input-type=module -e "
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
for (const p of [
  { u: 'ariacosmic', g: 'male', min: 24, max: 34, d: 25 },
  { u: 'marcus_deepsky', g: 'female', min: 22, max: 32, d: 50 },
  { u: 'elena_vibe', g: 'male', min: 25, max: 35, d: 30 },
]) {
  const user = await prisma.user.findUnique({ where: { username: p.u } });
  if (!user) continue;
  await prisma.matchPreference.upsert({
    where: { userId: user.id },
    update: { preferredGender: p.g, minAge: p.min, maxAge: p.max, maxDistance: p.d },
    create: { id: crypto.randomUUID(), userId: user.id, preferredGender: p.g, minAge: p.min, maxAge: p.max, maxDistance: p.d, updatedAt: new Date() },
  });
}
await prisma.\$disconnect(); await pool.end();
"
```

Gini AI characters live in SQLite (`backend/microservices/Gini_AI/prisma/dev.db`,
already seeded with 6 public characters) — no postgres step needed there.

## 4. Start the backends (one tab each)

```bash
cd backend/monolithic && npm run dev                        # :3001
cd backend/microservices/events-service && npm run dev       # :3002
cd backend/microservices/non-live-matching && npm run dev    # :3003
cd backend/microservices/Gini_AI && npm install && npm run dev   # :3004
cd backend/microservices/rooms-service && npm install && npm run dev  # :3007
cd backend/microservices/astrology && npm install && npm run dev # :3006
cd backend/microservices/live-matching && npm install && npm run dev  # :8080
```

(`npm install` is only needed once per service.)

## 5. Start the frontends

```bash
cd frontend-web && npm install && npm run dev    # :3000
cd frontend-app && npm start                      # :8081 (press `w` for web)
```

The web app talks to the backends on `localhost` out of the box
(`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_EVENTS_API_URL`,
`NEXT_PUBLIC_ROOMS_API_URL` / `NEXT_PUBLIC_ROOMS_SOCKET_URL` all default to
the ports above). Set them explicitly only for non-local deployments.

## 6. Troubleshooting

- **`P2022: column ... does not exist`** — run the step-3 monolith
  `migrate deploy` (the backfill migration). Never `db push` on postgres.
- **`DATABASE_URL is required`** (rooms/events) — that service's `.env`
  is missing; copy its `.env.example` (rooms) or check
  `backend/microservices/.env`.
- **Rooms exits on boot** — LiveKit vars are mandatory (see step 1).
- **Empty feed/events but seeds ran** — confirm the right backend answers:
  `curl localhost:3001/api/feed | head -c 200` and
  `curl localhost:3002/api/events | head -c 200`.
- **Gini AI / astrology return LLM errors** — check the key, URL, and model
  in the two `LIGHTNING_*` env files (step 1), then restart that service.
