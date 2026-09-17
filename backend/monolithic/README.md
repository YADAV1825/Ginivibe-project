# GiniVibe Core Monolith

## 1. Purpose
The core monolithic backend for the GiniVibe platform. It handles all primary consumer-facing features including user authentication, profile management, global presence (online/offline tracking), and cross-feature orchestration (like non-live video call requests).

## 2. Responsibility
**Owns:**
- Core User Identity (Registration, Login, JWT generation)
- Consumer Profiles
- Global Socket.io Presence (tracking who is online across the app)
- Video Call Request Signaling (handshake for video calls outside of live-matching)

**Does NOT Own:**
- B2B Enterprise logic (Campaigns, Ads, Billing) -> See `backend/microservices/enterprise`
- Dedicated Live Matching video streams -> See `backend/microservices/live-matching`

## 3. Position in Architecture
```text
Frontend Web / Mobile App
           ↓
    Monolithic API (Port 3001)
           ↓
      PostgreSQL
```

## 4. Folder Structure
```text
src/
├── config/           # Environment & Database config
├── controllers/      # Express route controllers
├── middleware/       # Auth and validation guards
├── routes/           # API route definitions
├── services/         # Core business logic
├── sockets/          # Global presence & signaling Socket.io handlers
└── index.ts          # Application entry point
```

## 5. Important Files
| File | Responsibility | Used By | Important Notes |
|------|----------------|---------|-----------------|
| `src/index.ts` | Server initialization & Socket.io mount | Node runtime | Bootstraps Express and Socket server on Port 3001 |
| `src/middleware/auth.ts` | JWT verification | All protected routes | Enforces `requireAuth` for consumer endpoints |
| `src/sockets/presence.ts`| Tracks online users | Frontend Socket Clients | Maps Socket IDs to User IDs for real-time features |
| `src/controllers/auth.ts`| Handles Registration & Login | `/api/auth/*` routes | Issues the core Consumer JWT |

## 6. How It Works
1. **HTTP Requests**: Express handles standard REST API calls (e.g., `POST /api/auth/login`).
2. **WebSockets**: A persistent `Socket.io` connection is established on login to track presence. When User A wants to call User B, they emit a socket event to this server, which routes the request to User B's active socket connection.

## 7. Configuration
| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing/verifying consumer auth tokens |
| `PORT` | No | Defaults to 3001 |

## 8. How To Run
```bash
cd backend/monolithic
npm install
npm run dev
```

## 9. Current Limitations
- **Scaling:** Presence tracking is currently in-memory on a single Node instance. If scaled horizontally, a Redis adapter for Socket.io is required.
- **Database:** Shares the same PostgreSQL database as the enterprise microservices.

## 10. Future Scope
- **Medium Term:** Extract Socket.io presence into a dedicated highly-available Presence Service backed by Redis.
- **Long Term:** Break out Identity (Auth) into a global IAM service as the microservice ecosystem grows.
