import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { JWT_SECRET } from './src/config/auth';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'http://localhost:3001';

// Run with: npx tsx test-groups.ts
// Requires: postgres running + monolith dev server on :3001 + 3 users in DB.
async function runTests() {
  console.log('🧪 Starting GiniVibe Message Groups Verification Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  const users = await prisma.user.findMany({ take: 3 });
  if (users.length < 3) {
    throw new Error('At least 3 users are required in database to run verification suite.');
  }
  const [userA, userB, userC] = users;
  const tokenFor = (u: (typeof users)[number]) =>
    jwt.sign({ id: u.id, username: u.username }, JWT_SECRET, { expiresIn: '1h' });
  const headersFor = (u: (typeof users)[number]) => ({
    Authorization: `Bearer ${tokenFor(u)}`,
    'Content-Type': 'application/json',
  });

  // --- Category 1: Create group ---
  console.log('👥 Test Category: Group Creation');
  const createRes = await fetch(`${BASE_URL}/api/chat/conversations/group`, {
    method: 'POST',
    headers: headersFor(userA),
    body: JSON.stringify({ title: 'Test Riders', memberIds: [userB.id] }),
  });
  assert(createRes.status === 201, 'Create group returns HTTP 201');
  const group = await createRes.json();
  assert(group.isGroup === true && group.title === 'Test Riders', 'Group has isGroup + title');
  const creatorMembership = group.members.find((m: any) => m.userId === userA.id);
  assert(creatorMembership?.role === 'admin', 'Creator is admin');

  const badCreate = await fetch(`${BASE_URL}/api/chat/conversations/group`, {
    method: 'POST',
    headers: headersFor(userA),
    body: JSON.stringify({ title: 'X', memberIds: [] }),
  });
  assert(badCreate.status === 400, 'Short title / empty members rejected with HTTP 400');

  // --- Category 2: Rename (admin vs member) ---
  console.log('✏️ Test Category: Group Rename Permissions');
  const memberRename = await fetch(`${BASE_URL}/api/chat/conversations/${group.id}`, {
    method: 'PATCH',
    headers: headersFor(userB),
    body: JSON.stringify({ title: 'Hijacked' }),
  });
  assert(memberRename.status === 403, 'Non-admin rename rejected with HTTP 403');

  const adminRename = await fetch(`${BASE_URL}/api/chat/conversations/${group.id}`, {
    method: 'PATCH',
    headers: headersFor(userA),
    body: JSON.stringify({ title: 'Test Riders United' }),
  });
  assert(adminRename.status === 200, 'Admin rename returns HTTP 200');
  assert((await adminRename.json()).title === 'Test Riders United', 'Title updated');

  // --- Category 3: Add members ---
  console.log('➕ Test Category: Add Members');
  const memberAdd = await fetch(`${BASE_URL}/api/chat/conversations/${group.id}/members`, {
    method: 'POST',
    headers: headersFor(userB),
    body: JSON.stringify({ userIds: [userC.id] }),
  });
  assert(memberAdd.status === 403, 'Non-admin add rejected with HTTP 403');

  const adminAdd = await fetch(`${BASE_URL}/api/chat/conversations/${group.id}/members`, {
    method: 'POST',
    headers: headersFor(userA),
    body: JSON.stringify({ userIds: [userC.id] }),
  });
  assert(adminAdd.status === 201, 'Admin add returns HTTP 201');
  assert((await adminAdd.json()).members.length === 3, 'Group now has 3 members');

  // --- Category 4: Group messaging reaches every member ---
  console.log('💬 Test Category: Group Messaging');
  const msgRes = await fetch(`${BASE_URL}/api/chat/messages`, {
    method: 'POST',
    headers: headersFor(userB),
    body: JSON.stringify({ conversationId: group.id, text: 'Hello riders!' }),
  });
  assert(msgRes.status === 201, 'Member can send group message (HTTP 201)');

  // --- Category 5: Remove + leave + admin promotion ---
  console.log('🚪 Test Category: Remove / Leave / Promotion');
  const removeRes = await fetch(`${BASE_URL}/api/chat/conversations/${group.id}/members/${userC.id}`, {
    method: 'DELETE',
    headers: headersFor(userA),
  });
  assert(removeRes.status === 200, 'Admin removes member with HTTP 200');

  const leaveRes = await fetch(`${BASE_URL}/api/chat/conversations/${group.id}/members/${userA.id}`, {
    method: 'DELETE',
    headers: headersFor(userA),
  });
  assert(leaveRes.status === 200, 'Admin can leave (HTTP 200)');
  const promoted = await prisma.conversationMember.findUnique({
    where: { userId_conversationId: { userId: userB.id, conversationId: group.id } },
  });
  assert(promoted?.role === 'admin', 'Longest-standing member promoted to admin');

  // --- Category 6: Delete permissions ---
  console.log('🗑️ Test Category: Group Delete Permissions');
  const group2Res = await fetch(`${BASE_URL}/api/chat/conversations/group`, {
    method: 'POST',
    headers: headersFor(userA),
    body: JSON.stringify({ title: 'Delete Me', memberIds: [userB.id] }),
  });
  const group2 = await group2Res.json();
  const memberDelete = await fetch(`${BASE_URL}/api/chat/conversations/${group2.id}`, {
    method: 'DELETE',
    headers: headersFor(userB),
  });
  assert(memberDelete.status === 403, 'Non-admin delete rejected with HTTP 403');
  const adminDelete = await fetch(`${BASE_URL}/api/chat/conversations/${group2.id}`, {
    method: 'DELETE',
    headers: headersFor(userA),
  });
  assert(adminDelete.status === 200, 'Admin delete returns HTTP 200');

  // Cleanup: B leaves the first group (last member → group deleted).
  await fetch(`${BASE_URL}/api/chat/conversations/${group.id}/members/${userB.id}`, {
    method: 'DELETE',
    headers: headersFor(userB),
  });

  console.log(`\n🎉 All ${passed}/${total} group verification tests passed successfully!\n`);
}

runTests()
  .catch((err) => {
    console.error('\n❌ Test suite failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
