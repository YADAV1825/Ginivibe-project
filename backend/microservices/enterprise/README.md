# GiniVibe Enterprise Microservice

## 1. Purpose
The Enterprise Microservice is an isolated B2B module that powers the Advertiser Platform and the global Super-Admin Control Plane. It manages organizational billing, campaign workflows, programmatic ad targeting, and platform-wide administrative governance.

## 2. Responsibility
**Owns:**
- B2B Enterprise Tenants (Organizations & Members)
- Ad Campaigns & Creatives Lifecycle (Draft -> Pending -> Active)
- Ad Analytics (Impressions & Clicks)
- Billing Profiles & Transactions
- Global Admin Control Plane (Approvals, Suspensions, Audits)

**Does NOT Own:**
- End-consumer profiles or authentication
- Video calling streams

## 3. Position in Architecture
```text
Enterprise Dashboard / Admin Portal
                ↓
    Enterprise API (Port 3005)
                ↓
           PostgreSQL
```

## 4. Folder Structure
```text
src/
├── infrastructure/   # Database drivers and base config
├── middleware/       # Enterprise Auth (TenantGuard, AdminGuard)
├── modules/          # Domain-Driven Design (DDD) Modules
│   ├── admin/        # Super-Admin operations & audit logging
│   ├── analytics/    # Impression & Click aggregation
│   ├── billing/      # Wallet & balance tracking
│   ├── campaigns/    # Core ad workflow state machine
│   └── identity/     # B2B Tenant Auth & Registration
├── index.ts          # Main Express router
└── app.ts            # Application bootstrapper
```

## 5. Important Files
| File | Responsibility | Used By | Important Notes |
|------|----------------|---------|-----------------|
| `app.ts` | Express Initialization | Runtime | Mounts `/api/v1/*` routes |
| `modules/admin/services/admin.service.ts` | High-privilege logic | Admin Controllers | Manages global suspensions and campaign approvals |
| `modules/campaigns/services/campaign.service.ts`| Campaign State Machine | Campaign Controllers | Enforces strict `DRAFT` transitions for tenants |
| `middleware/tenant.ts` | Multi-tenant isolation | All B2B Routes | Secures endpoints to specific `organizationId` |
| `middleware/admin.guard.ts` | Platform RBAC | `/admin/*` Routes | Ensures only `SUPER_ADMIN` tokens can access the control plane |

## 6. How It Works
- **B2B Tenants:** Advertisers authenticate via `/identity` and receive an Enterprise JWT containing their `organizationId`. Every API request must pass `TenantGuard` which automatically isolates data queries to that specific organization.
- **Admin Control Plane:** Super-Admins log in via `/admin/auth` and receive an Admin JWT. They bypass tenant boundaries to review campaigns, toggle organization statuses, and their actions are permanently recorded in the `AdminAuditLog`.

## 7. Configuration
| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | Verifies both Enterprise and Admin JWTs |
| `PORT` | No | Defaults to 3005 |

## 8. How To Run
```bash
cd backend/microservices/enterprise
npm install
npm run dev
```

## 9. Security & Tenant Isolation
- **Tenant Isolation:** Enforced dynamically via the `TenantRequest` interface which injects the authorized `organization` into every request object. Queries must explicitly include `where: { organizationId: req.organization.id }`.
- **State Machine Integrity:** Enterprise clients cannot transition their own campaigns to `ACTIVE`. They can only move them to `PENDING_REVIEW`. Only the `AdminService` can transition to `ACTIVE`.

## 10. Future Scope
- **Short Term:** Implement Stripe/Razorpay webhooks into the `BillingService` for real-world automated funding.
- **Medium Term:** Move Analytics (`adImpression`/`adClick`) writes to a Redis-backed queue or Kafka topic to prevent write-locking the main PostgreSQL instance under heavy ad delivery load.
