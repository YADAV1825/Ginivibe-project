# GiniVibe Enterprise Platform - Architecture & Onboarding Guide

## 1. System Overview

Welcome to the **GiniVibe Enterprise Platform**. 

While the core GiniVibe monolithic backend handles consumer-to-consumer interactions (Live Video Matching, Chat, Profiles), this **Enterprise Microservice** is responsible for all **Business-to-Platform (B2B)** operations. 

It is designed to allow external organizations (Brands, Astrologers, Advertisers) to create, fund, and run targeted advertising campaigns within the GiniVibe consumer ecosystem.

### 1.1 The "Modular Monolith" Approach
This service avoids the trap of "microservice sprawl" (e.g., separating Billing, Identity, and Ads into 10 different repositories). Instead, it runs as a **single, highly-cohesive Express deployment** (a Modular Monolith), where domains are strictly isolated by folder structure (`src/modules/*`) rather than by network boundaries.

### 1.2 Tech Stack
*   **Runtime:** Node.js (v20+)
*   **Language:** TypeScript (Strict Mode)
*   **Framework:** Express.js (v5)
*   **Database ORM:** Prisma Client
*   **Validation:** Zod
*   **Authentication:** JWT & Bcrypt

---

## 2. Directory Structure

```text
enterprise/
├── prisma/                  # Holds a synchronized copy of the monolithic schema.prisma
├── src/
│   ├── app.ts               # Express configuration, global middleware, route registry
│   ├── server.ts            # Entrypoint, graceful shutdown, bootloader
│   ├── infrastructure/
│   │   └── postgres/        # Prisma client instantiation and connection pooling
│   ├── middleware/
│   │   ├── auth.ts          # Validates Enterprise JWTs
│   │   └── tenant.ts        # Enforces Organization-level RBAC (x-organization-id)
│   └── modules/             # The 7 Isolated Business Domains
│       ├── ads/             # Ad Serving Engine & Management
│       ├── analytics/       # Impression & Click Tracking
│       ├── billing/         # Financial ledgers and balances
│       ├── campaigns/       # Advertising objectives and budgets
│       ├── creatives/       # Ad Media (Images, Videos, S3 keys)
│       ├── identity/        # Enterprise Registration & Login
│       ├── organizations/   # Multi-tenancy boundaries
│       └── targeting/       # Demographic and geographic rules
```

---

## 3. Database & Shared State

**CRITICAL NOTE FOR ENGINEERS:** This microservice does **not** have its own separate Postgres instance. It connects to the exact same Postgres database as the Consumer Monolith. 

However, it interacts with a completely separate set of tables.
*   **Consumer Tables:** `User`, `CallSession`, etc. (Untouched by this service).
*   **Enterprise Tables:** `EnterpriseUser`, `Organization`, `Campaign`, `Advertisement`, etc.

### 3.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    EnterpriseUser ||--o{ OrganizationMember : "belongs to"
    Organization ||--o{ OrganizationMember : "has"
    Organization ||--o| BillingProfile : "owns"
    Organization ||--o{ Campaign : "runs"
    Organization ||--o{ Creative : "uploads"
    
    Campaign ||--o| TargetingRule : "filtered by"
    Campaign ||--o{ Advertisement : "contains"
    
    Creative ||--o{ Advertisement : "displayed in"
    
    Advertisement ||--o{ AdImpression : "generates"
    Advertisement ||--o{ AdClick : "generates"
    Advertisement ||--o{ AdPlacement : "served on"
```

---

## 4. Multi-Tenancy & Security (RBAC)

Tenant isolation is the highest security priority. **Organization A must never access Organization B's data.**

### 4.1 The Request Pipeline
Every request to a management endpoint (e.g., `/api/v1/campaigns`) must pass two checks:
1.  **Identity (`requireAuth`)**: Verifies the `Authorization: Bearer <JWT>` header. Extracts the `EnterpriseUser.id`.
2.  **Tenant (`requireTenantRole`)**: Expects an `x-organization-id` header. It queries the `OrganizationMember` table to prove the user actually belongs to this specific organization.

### 4.2 Roles
The `requireTenantRole(['OWNER', 'ADMIN'])` middleware enforces strict permissions:
*   `OWNER`: Can do anything, including deleting the organization or adding funds.
*   `ADMIN`: Can manage campaigns, ads, users, and funds.
*   `CAMPAIGN_MANAGER`: Can create/edit ads and targeting, but cannot touch billing.
*   `VIEWER` / `ANALYST`: Read-only access to analytics and campaign data.

---

## 5. Module Deep-Dive

### 5.1 Identity (`/identity`)
*   **Purpose:** Handles B2B registration and login.
*   **Key Detail:** Passwords are hashed via `bcrypt` (Salt Rounds: 10). Emits JWTs valid for 24 hours.

### 5.2 Organizations (`/organizations`)
*   **Purpose:** The root node of all enterprise data.
*   **Key Detail:** When a user creates an Organization, the service wraps the creation in a Prisma `$transaction` to guarantee the creator is simultaneously mapped as the `OWNER` in the `OrganizationMember` table.

### 5.3 Billing (`/billing`)
*   **Purpose:** Tracks prepaid funds for ad campaigns.
*   **Key Detail:** Currently operates on a simple ledger system (`balance`). Designed to act as the webhook receiver for Stripe/Razorpay in the future.

### 5.4 Campaigns & Targeting (`/campaigns`, `/targeting`)
*   **Purpose:** Defines *what* the advertiser wants to achieve, and *who* they want to reach.
*   **Key Detail:** Targeting rules (`minAge`, `locations`, `interests`) are evaluated dynamically at runtime by the Ad Engine.

### 5.5 Creatives (`/creatives`)
*   **Purpose:** Represents the physical media.
*   **Key Detail:** Stores `storageKey` (for AWS S3 or CDN). Supports `IMAGE` and `VIDEO` media types.

---

## 6. The Ad Engine (Core Runtime)

The `/ads` and `/analytics` modules differ from the rest of the system. While other modules are called by the Enterprise Portal, these are hit by the **GiniVibe Consumer Apps (Web/Mobile)** at extremely high velocity.

### 6.1 Ad Serving Flow (`POST /api/v1/ads/serve`)

```mermaid
sequenceDiagram
    participant ConsumerApp as GiniVibe App
    participant AdEngine as EligibilityEngine
    participant DB as PostgreSQL
    
    ConsumerApp->>AdEngine: Request Ad (placement: FEED, age: 25, loc: NY)
    AdEngine->>DB: Fetch all ACTIVE Ads where placement = FEED
    DB-->>AdEngine: Return Candidate Ads
    
    Note over AdEngine: Filter candidates against TargetingRules
    Note over AdEngine: Rank eligible ads (Random/Uniform for V1)
    
    AdEngine-->>ConsumerApp: Return winning Ad JSON (Media, CTA, Headline)
```

### 6.2 Telemetry & Billing (`POST /api/v1/analytics/...`)
When an ad is rendered, the Consumer App fires an asynchronous tracking event.
*   `POST /impression`: Creates an `AdImpression` record. Costs the enterprise ₹0.01.
*   `POST /click`: Creates an `AdClick` record. Costs the enterprise ₹2.00.
*   *Note: In future iterations, these high-throughput routes should offload data to Redis or Kafka before writing to PostgreSQL.*

---

## 7. Developer Onboarding & Runbook

### 7.1 Environment Variables
The application will **crash on boot** if `DATABASE_URL` is missing.
Ensure your `.env` contains:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ginivibe?schema=public"
PORT=3005
JWT_SECRET=super_secret_key
JWT_EXPIRATION=24h
```

### 7.2 Boot Sequence Important Note
Look at `src/infrastructure/postgres/client.ts`. You will notice `dotenv.config()` is executed *before* `new PrismaClient()`. This is mandatory. If `PrismaClient` initializes before the env variables are loaded into Node's process, it will throw a `PrismaClientInitializationError`.

### 7.3 Schema Synchronization
Because this microservice shares the Monolithic database, the source of truth for the schema lives at `../../monolithic/prisma/schema.prisma`. 
If you modify the database structure:
1. Update the monolithic schema.
2. Run `cp ../../monolithic/prisma/schema.prisma prisma/` in this directory.
3. Run `npx prisma generate` to rebuild the local types.

### 7.4 Ecosystem Boot Sequence (Local Development)

To test the Enterprise platform end-to-end, you must run three interconnected services in separate terminal windows:

**Terminal 1: The Enterprise Backend (Ad Engine & Billing)**
This runs the high-speed Ad Serving engine and handles all telemetry, analytics, and billing logic on port `3005`.
```bash
cd backend/microservices/enterprise
npm run dev
```

**Terminal 2: The Consumer Frontend Web App**
This starts the Next.js frontend web app on port `3000`. Navigate to `http://localhost:3000/feed` to see the ads injected directly into the user feed.
```bash
cd frontend-web
npm run dev
```

**Terminal 3: Prisma Studio (Database Inspection)**
This launches a visual database explorer on port `5555`. You can use this to instantly watch the `BillingProfile` balance decrease, and view the `AdImpression` and `AdClick` telemetry rows appear in real-time as users interact with ads on the frontend.
```bash
cd backend/microservices/enterprise
npx prisma studio
```

*(Note: The core monolithic backend on port `3001` can optionally be started in a 4th terminal via `cd backend/monolithic && npm run dev` if you need consumer features like live-matching).*

---

## 8. Future Scaling & Infrastructure Placeholders

If you explore `src/infrastructure/`, you will notice empty placeholder directories such as `redis/`, `logging/`, and `storage/`. These are intentionally scaffolded for **Phase 2 Enterprise Scaling**.

While the V1 system runs perfectly without them, as traffic increases to millions of users, these folders establish a clear architectural boundary for future engineering:

1. **`redis/` (Caching Engine)**: Currently, the `EligibilityEngine` queries PostgreSQL directly to filter active ad campaigns on every feed scroll. To achieve sub-millisecond latency at high QPS, this folder will house the logic to cache `ACTIVE` campaigns and budget paces in a Redis cluster.
2. **`logging/` (Telemetry & Observability)**: Currently, errors are output via `console.error()`. For enterprise observability, this folder will configure structured, centralized loggers (e.g., Winston, Pino) to push distributed traces and error metrics to monitoring services like Datadog or ELK.
3. **`storage/` (Media Management)**: Advertisers currently provide static URL strings for media. When building the advertiser-facing dashboard, this folder will house AWS S3 (or Cloudinary) integration code to securely handle multipart file uploads, video transcoding, and CDN cache invalidation.
