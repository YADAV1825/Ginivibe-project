# GiniVibe Platform Architecture

## 1. Executive Overview
GiniVibe is a next-generation social discovery, live-matching, and premium astrology platform. The system is designed to handle consumer-facing peer-to-peer video interactions, real-time presence, and an entirely separate, robust B2B Enterprise Ad Delivery network. 

The platform's architecture is a **Service-Oriented Modular Monolith**, composed of highly specialized backend services running alongside two distinct frontend applications (Web and Native Mobile). The system avoids unnecessary microservice complexity for core data, opting for strict route-based multi-tenancy and decoupled real-time WebSocket servers.

---

## 2. System At A Glance
- **Consumer App (Web/Mobile):** Next.js / Expo (React Native). Includes live video matchmaking, non-live profile swiping, and premium astrological insights.
- **Enterprise Portal:** Next.js. B2B advertiser dashboard for creating and funding campaigns.
- **Admin Control Plane:** Super-admin portal for platform governance, suspension, and campaign approval.
- **Backend:** Node.js / Express APIs heavily utilizing Prisma ORM on PostgreSQL.
- **Real-time:** `socket.io` for global presence tracking. Pure `WebRTC / ws` for ultra-low latency peer-to-peer video signaling.

---

## 3. Repository Structure
```text
GiniVibe/
├── ARCHITECTURE.md             ← 🚨 Start here (You are here)
│
├── backend/
│   ├── monolithic/             ← Core Identity & Presence (Port 3001)
│   │
│   └── microservices/
│       ├── enterprise/         ← B2B Ads, Billing & Admin Control Plane (Port 3005)
│       ├── live-matching/      ← WebRTC Video Signaling (Port 8080)
│       ├── non-live-matching/  ← Offline matching algorithms
│       └── astrology/          ← Premium horoscope integrations
│
├── frontend-web/               ← Next.js Consumer Web & Enterprise Portal (Port 3000)
│
├── frontend-app/               ← React Native / Expo Mobile App
│
└── db/                         ← Infrastructure / Docker configurations
```
*Note: For granular technical details, refer to the `README.md` file located inside each respective directory.*

---

## 4. Technology Stack
- **Frontend:** React 19, Next.js (App Router), React Native (Expo Router), Zustand (State), Lucide (Icons)
- **Backend:** Node.js (v20+), Express.js, Socket.io, ws
- **Database:** PostgreSQL (via Prisma ORM)
- **Real-Time:** WebRTC (Peer-to-Peer Video), WebSocket (Signaling)
- **Infrastructure:** Docker (for local databases)

---

## 5. High-Level Architecture
```mermaid
graph TD
    subgraph Clients
        Web[Web Browser (Next.js)]
        Mobile[Mobile App (Expo)]
    end

    subgraph API Gateways
        Mono[Monolithic API:3001]
        Enterprise[Enterprise API:3005]
        Signaling[Live-Matching:8080]
    end

    subgraph Data Layer
        PG[(PostgreSQL)]
    end

    Web --> Mono
    Web --> Enterprise
    Web --> Signaling

    Mobile --> Mono
    Mobile --> Signaling

    Mono --> PG
    Enterprise --> PG
```

---

## 6. Application Architecture

### frontend-web
- **Technology:** Next.js (App Router)
- **Development Command:** `npm run dev` (Port 3000)
- **Major Features:** Consumer UI, Enterprise B2B Dashboard, Admin Control Plane.
- **State:** Zustand handles global WebSocket presence (`usePresenceStore.ts`).

### frontend-app
- **Technology:** React Native (Expo)
- **Development Command:** `npm run start`
- **Major Features:** iOS/Android consumer experience. Uses a WebView bridge for WebRTC.

### backend/monolithic
- **Technology:** Express / Socket.io
- **Development Command:** `npm run dev` (Port 3001)
- **Major Features:** Core User Authentication (`/api/auth/*`), Global Presence (`src/sockets/presence.ts`).

### backend/microservices/enterprise
- **Technology:** Express / Prisma
- **Development Command:** `npm run dev` (Port 3005)
- **Major Features:** B2B Ad Campaigns, Billing, Admin Logging, and strict Tenant Isolation.

### backend/microservices/live-matching
- **Technology:** Pure Node `ws`
- **Development Command:** `npm run dev` (Port 8080)
- **Major Features:** SDP offer/answer and ICE candidate routing for P2P video. Zero database dependency.

---

## 7. Backend Architecture (Enterprise Example)
The backend heavily utilizes a layered architectural pattern for scalability.

**Request Lifecycle:**
```text
Client Request
  ↓
Router (src/modules/campaigns/index.ts)
  ↓
Middleware (TenantGuard - Validates JWT & injects Organization)
  ↓
Controller (campaign.controller.ts - Zod Validation)
  ↓
Service (campaign.service.ts - Business Logic & Rules)
  ↓
Prisma (schema.prisma - Database I/O)
  ↓
Response
```

---

## 8. Frontend Architecture
The `frontend-web` utilizes Next.js App Router route groups to enforce strict boundaries.
- `app/(consumer)/`: End-user platform.
- `app/enterprise-dashboard/`: B2B tenant interface.
- `app/(admin-portal)/`: Highly secure Super-Admin view.

**User Interaction Flow:**
```text
User clicks "Approve Campaign"
        ↓
React Component (AdminDashboardScreen.tsx)
        ↓
Confirm Modal (UI State)
        ↓
API Client (AdminAuth.ts)
        ↓
Enterprise Backend (Port 3005)
        ↓
Service logic & Audit Log (admin.service.ts)
        ↓
Database Update
        ↓
State update (Queue clears)
        ↓
UI re-render
```

---

## 9. Database Architecture
The platform primarily uses a unified PostgreSQL database managed by Prisma.
There are two primary Prisma schemas:
1. `backend/monolithic/prisma/schema.prisma` (Consumer Identities, Profiles)
2. `backend/microservices/enterprise/prisma/schema.prisma` (B2B Tenants, Ads, Audits)

**Key Enterprise Models:**
- `Organization`: The core tenant wrapper.
- `Campaign`: Houses ad creatives. Enforces strict `DRAFT` -> `PENDING_REVIEW` -> `ACTIVE` state.
- `AdminAuditLog`: Immutably tracks high-privilege actions (e.g. Org suspensions).

---

## 10. Authentication & Authorization
Auth is heavily segmented based on user types.

- **Consumers:** Authenticate against `backend/monolithic`. Receive standard JWTs used for presence and basic API access.
- **Enterprise Tenants:** Authenticate against `backend/microservices/enterprise`. Receive a JWT injected with an `organizationId`.
- **Platform Admins:** Authenticate via `/admin/auth/login`. Receive an `ADMIN` scoped JWT.

---

## 11. Multi-Tenant Architecture (Enterprise)
The Enterprise backend implements rigorous multi-tenancy at the middleware level.

1. `TenantGuard` middleware parses the JWT.
2. It fetches the `Organization` from PostgreSQL and attaches it to `req.organization`.
3. **CRITICAL:** All Service functions (e.g., `CampaignService.updateCampaignStatus`) explicitly require an `organizationId` parameter. 
4. The Prisma query enforces `where: { id: campaignId, organizationId }`, making it mathematically impossible for Tenant A to modify Tenant B's data, even via API enumeration.

---

## 12. Real-Time Architecture

There are TWO distinct real-time pipelines:

### A. Global Presence (Socket.io)
- **Location:** `backend/monolithic`
- **Purpose:** Tracks who is online platform-wide. Handles incoming non-live video call requests (ringing a user).

### B. Live-Matching WebRTC Signaling (ws)
- **Location:** `backend/microservices/live-matching`
- **Purpose:** High-throughput, ultra-low latency signaling for active video calls.
- **Flow:**
```mermaid
sequenceDiagram
    participant UserA
    participant Signaling
    participant UserB
    UserA->>Signaling: create-room
    Signaling-->>UserA: room-created (Code: XYZ)
    UserB->>Signaling: join-room (Code: XYZ)
    Signaling-->>UserA: room-joined
    UserA->>Signaling: offer (SDP)
    Signaling->>UserB: offer (SDP)
    UserB->>Signaling: answer (SDP)
    Signaling->>UserA: answer (SDP)
    UserA<-->>UserB: P2P Video Active
```

---

## 13. Security Architecture
- **State Machine Protection:** Enterprise clients CANNOT set a campaign to `ACTIVE`. The API strictly blocks unauthorized state transitions (`campaign.service.ts`). Only `SUPER_ADMIN` endpoints can authorize active ads.
- **Popup Blocking Circumvention:** The Super-Admin web UI utilizes custom React Modals instead of `window.confirm` to ensure destructive actions (suspensions) are protected by a confirmation layer, even if Chrome Incognito aggressively blocks native browser popups.
- **Immutable Auditing:** The `AuditService` logs every high-privilege admin action (suspensions, approvals, rejections) to an immutable `AdminAuditLog` table.

---

## 14. Environment Configuration
*NEVER commit secrets. Copy `.env.sample` files locally.*

| Variable | Required | Used By | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | All Backends | PostgreSQL connection string |
| `JWT_SECRET` | Yes | All Backends | Cryptographic signing for auth tokens |
| `NEXT_PUBLIC_API_URL` | No | Frontend | Points to monolithic API |
| `EXPO_PUBLIC_API_URL` | No | Mobile | Points to monolithic API (Must use LAN IP, not localhost) |

---

## 15. Developer Commands

| Action | Command | Directory |
|--------|---------|-----------|
| Start Local Database | `docker-compose up -d` | `/db` |
| Start Frontend Web | `npm run dev` | `/frontend-web` |
| Start Mobile App | `npm run start` | `/frontend-app` |
| Start Core API | `npm run dev` | `/backend/monolithic` |
| Start Enterprise API | `npm run dev` | `/backend/microservices/enterprise` |
| Start Video Signaling | `npm run dev` | `/backend/microservices/live-matching` |

---

## 16. Current Limitations
- **Analytics Queue:** The Enterprise Ad system currently writes `adImpression` and `adClick` events directly to PostgreSQL. This is fine for V1, but will cause database locks under extreme global scale.
- **Presence Scaling:** The `monolithic` socket server stores online presence in RAM. Horizontal scaling requires moving to a Redis-backed Socket.io adapter.
- **Mobile WebRTC:** The React Native mobile app currently utilizes a `WebView` bridge for WebRTC rendering to accelerate V1 time-to-market. 

---

## 17. Future Architecture
**Medium Term (When Analytics exceed 500 QPS):**
- Introduce Kafka or Redis Streams to queue Ad Impressions.
- Extract an `analytics-worker` node to batch-insert impressions into PostgreSQL.

**Long Term (When Concurrent Users exceed 50,000):**
- Extract Identity/Auth into a globally distributed IAM service.
- Migrate Mobile WebView WebRTC to fully native `react-native-webrtc` bindings for hardware acceleration.

---

## 18. Where Do I Make This Change?
*A quick reference map for common development tasks.*

| I want to... | Where should I look? |
|--------------|----------------------|
| **Approve/Reject Campaigns** | `backend/microservices/enterprise/src/modules/admin/services/admin.service.ts` |
| **Add a new Ad format (e.g. Banners)** | `backend/microservices/enterprise/prisma/schema.prisma` -> `Creative` model |
| **Change the B2B Dashboard UI** | `frontend-web/app/enterprise-dashboard/screens/EnterpriseDashboardScreen.tsx` |
| **Fix a Video WebRTC Bug** | `backend/microservices/live-matching/server.js` |
| **Add a Mobile App Screen** | `frontend-app/src/app/` |
| **Change User Login logic** | `backend/monolithic/src/controllers/auth.ts` |
| **Track who is Online** | `backend/monolithic/src/sockets/presence.ts` |

---

## 19. New Engineer Onboarding: Start Here
Welcome to the team! To get productive quickly, follow this day-1 path:

**Day 1: Get the platform running**
1. Read this entire document.
2. `cd db && docker-compose up -d` to get Postgres running.
3. Start the three backend services in separate terminals (Monolith, Enterprise, Live-Matching).
4. Start `frontend-web`.
5. Visit `http://localhost:3000/enterprise` to see the B2B side, and `http://localhost:3000/admin-login` to see the control plane.
6. Create an account, build an organization, and submit a draft campaign to see how the Database Multi-Tenancy works.

**Day 2: Understand the Codebase**
- Review `backend/microservices/enterprise/src/middleware/tenant.ts` to see how we secure tenant data.
- Review `frontend-web/app/core/stores/usePresenceStore.ts` to see how global WebSockets keep the app alive.
- Trace the `createCampaign()` call from the frontend down to the database schema.

---

## 20. Documentation Index
| Area | Documentation |
|------|---------------|
| **Core API & Presence** | [`backend/monolithic/README.md`](backend/monolithic/README.md) |
| **Enterprise Ads & Admin** | [`backend/microservices/enterprise/README.md`](backend/microservices/enterprise/README.md) |
| **WebRTC Video Signaling** | [`backend/microservices/live-matching/README.md`](backend/microservices/live-matching/README.md) |
| **Offline Algorithmic Matching** | [`backend/microservices/non-live-matching/README.md`](backend/microservices/non-live-matching/README.md) |
| **Premium Astrology Insights** | [`backend/microservices/astrology/README.md`](backend/microservices/astrology/README.md) |
| **Web Frontend & Dashboards** | [`frontend-web/README.md`](frontend-web/README.md) |
| **Mobile Application (Expo)** | [`frontend-app/README.md`](frontend-app/README.md) |
| **Local Infrastructure** | [`db/README.md`](db/README.md) |
