# @ginivibe/rooms-service

TEXT / VOICE / VIDEO room microservice, built to match the conventions
already used in `backend/microservices/` (Prisma 7 + `@prisma/adapter-pg`,
Express 5, shared JWT auth) — modeled most closely on `events-service`.

## How this fits what's already in the repo

- **Not a replacement for anything.** `backend/monolithic/src/features/calls`
  already handles 1:1 call requests (accept/reject → generates a bare
  `roomCode` string with no real media backend wired to it yet), and
  `live-matching` does raw WebRTC signaling for 1:1 video matching. Neither
  supports a persistent, many-person room. This service is additive: group
  TEXT/VOICE/VIDEO rooms up to 30 participants.
- **Auth**: reuses the exact `JWT_SECRET` / `HS256` / `requireAuth` →
  `req.userId` pattern from `events-service` and `monolithic`'s
  `src/middleware/auth.ts`, so it accepts the same tokens your existing
  services already issue and verify.
- **TEXT-room tokens**: minted with `{ id, username, roomId }`, the exact
  shape `backend/monolithic/src/socket/socket-auth.ts` already decodes —
  so the existing Socket.IO gateway can verify them with zero changes if
  you want to route TEXT-room chat through it.
- **Database**: same shared Postgres (`DATABASE_URL` from the root
  `.env`), same Prisma-with-`adapter-pg` setup as `events-service` and
  `non-live-matching`. `creatorId` / `userId` are plain strings (no
  relation) for the same reason `Event.organizerId` is — users live in the
  monolithic database, not here.
- **Port**: 3007 — the next free one after monolithic (3001),
  events-service (3002), non-live-matching (3003), Gini_AI (3004), enterprise (3005), astrology (3006).

## New dependency: LiveKit

Nothing in this repo talks to LiveKit yet. It's added here specifically
because a 30-person audio/video room needs an SFU — the mesh-style raw
WebRTC signaling `live-matching` uses only works for 1:1 calls. Add
`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `LIVEKIT_URL` to the shared
root `.env` (see `.env.example` here).

## Setup

```bash
cd backend/microservices/rooms-service
npm install
npm run prisma:generate
npm run prisma:migrate    # applies prisma migrations
npm run dev                # tsx watch, http://localhost:3007
```

## Endpoints

| Method | Path                      | Auth              | Description                        |
|--------|---------------------------|-------------------|-------------------------------------|
| POST   | /api/rooms                | Bearer JWT        | Create a TEXT/VOICE/VIDEO room      |
| GET    | /api/rooms?type=VOICE     | Bearer JWT        | List active OPEN rooms + live counts|
| POST   | /api/rooms/:id/join       | Bearer JWT        | Capacity + access-code enforced join|
| POST   | /api/rooms/:id/leave      | Bearer JWT        | Leave a room                        |
| POST   | /api/rooms/webhook/livekit| LiveKit signature | Participant/room lifecycle events   |
| GET    | /health                   | none              | Liveness check                      |

## Business rules & where they're enforced

- **Room type isolation** (`src/services/livekit.service.ts`): VOICE
  tokens are granted `canPublishSources: [MICROPHONE]` only — camera and
  screen-share are simply absent from the grant, so LiveKit's SFU has
  nothing to permit even if a client tries. VIDEO gets all four sources.
  TEXT rooms never touch LiveKit.
- **30-participant cap, race-safe** (`src/services/room.service.ts::joinRoom`):
  runs inside `prisma.$transaction`, locks the `Room` row with a raw
  `SELECT ... FOR UPDATE`, then counts active participants — so two
  simultaneous joins for the last seat can't both succeed.
- **Private rooms**: `accessCode` is bcrypt-hashed at creation
  (`bcryptjs`, matching the version already used in `enterprise`) and
  verified inside the same locked transaction before a token is minted.
  A DB `CHECK` constraint (added by hand in the migration — see the
  comment in `prisma/schema.prisma`) keeps `OPEN`/`PRIVATE` rooms from
  having a hash in the wrong state.
- **"Unique while active" participation**: a user can rejoin a room after
  leaving, but can't hold two simultaneous active rows. Expressed as a
  hand-added partial unique index in the migration (Prisma's schema DSL
  can't express partial indexes — see the comment in `schema.prisma`).
- **Webhook trust**: `/webhook/livekit` gets raw-body parsing (not
  `express.json()`) in `app.ts` so `WebhookReceiver` can verify LiveKit's
  signature over the exact request bytes before anything is trusted.

## Known gap worth flagging

`requireAuth` (copied as-is from `events-service`/`monolithic`) only
decodes `id` from the JWT, not `username` — so `routes/rooms.ts` falls
back to using the user id as the display name for LiveKit/socket tokens.
If your auth tokens carry a `username` claim, it's a one-line change to
also read `decoded.username` in `middleware/auth.ts` and pass it through.