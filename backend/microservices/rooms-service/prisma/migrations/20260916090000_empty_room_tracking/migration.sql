-- Empty-room tracking for the 10-minute auto-delete sweeper.
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "emptiedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Room_emptiedAt_idx" ON "Room"("emptiedAt");
