-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('TEXT', 'VOICE', 'VIDEO');

-- CreateEnum
CREATE TYPE "RoomVisibility" AS ENUM ('OPEN', 'PRIVATE');

-- CreateEnum
CREATE TYPE "RoomParticipantRole" AS ENUM ('CREATOR', 'MEMBER');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "type" "RoomType" NOT NULL,
    "visibility" "RoomVisibility" NOT NULL DEFAULT 'OPEN',
    "accessCodeHash" TEXT,
    "maxCapacity" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoomParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_isActive_idx" ON "Room"("isActive");

-- CreateIndex
CREATE INDEX "Room_isActive_type_idx" ON "Room"("isActive", "type");

-- CreateIndex
CREATE INDEX "RoomParticipant_roomId_leftAt_idx" ON "RoomParticipant"("roomId", "leftAt");

-- CreateIndex
CREATE INDEX "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- Hand-added below: constraints Prisma's schema DSL cannot express.
-- (Standard workflow: `prisma migrate dev --create-only`, then edit
-- the generated file before applying — see prisma/schema.prisma for
-- why each of these can't just live in the .prisma file.)
-- ─────────────────────────────────────────────────────────────────

-- A PRIVATE room must carry an access-code hash; an OPEN room must not.
ALTER TABLE "Room" ADD CONSTRAINT "chk_private_room_has_code" CHECK (
    ("visibility" = 'PRIVATE' AND "accessCodeHash" IS NOT NULL) OR
    ("visibility" = 'OPEN' AND "accessCodeHash" IS NULL)
);

-- Hard cap: never allow a room to be configured above 30 seats.
ALTER TABLE "Room" ADD CONSTRAINT "chk_max_capacity" CHECK (
    "maxCapacity" > 0 AND "maxCapacity" <= 30
);

-- "Unique while active": at most one active (leftAt IS NULL) participation
-- row per (roomId, userId), while still allowing a user to rejoin after
-- leaving. A plain UNIQUE constraint can't express this because Postgres
-- treats every NULL as distinct — a partial index is the correct tool.
CREATE UNIQUE INDEX "uq_room_participants_active"
    ON "RoomParticipant" ("roomId", "userId")
    WHERE "leftAt" IS NULL;