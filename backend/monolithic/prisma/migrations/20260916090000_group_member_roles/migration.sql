-- Group member roles for message groups.
-- Existing rows (all 1:1 today) keep the harmless 'member' default; new group
-- creators are inserted as 'admin' by POST /api/chat/conversations/group.
ALTER TABLE "ConversationMember" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'member';
