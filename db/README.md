# GiniVibe Infrastructure

## 1. Purpose
Stores the core deployment and infrastructure scaffolding for the GiniVibe platform, primarily focusing on local database instantiation.

## 2. Responsibility
**Owns:**
- Local Docker-compose configurations for stateful services (PostgreSQL, Redis).

**Does NOT Own:**
- Prisma schemas or database migrations (these live inside `backend/monolithic/prisma` and `backend/microservices/enterprise/prisma`).

## 3. Position in Architecture
Provides the underlying data persistence layer (`localhost:5432` for Postgres, `localhost:6379` for Redis) consumed by the Monolithic and Enterprise microservices.

## 4. How To Run
```bash
cd db
docker-compose up -d
```
