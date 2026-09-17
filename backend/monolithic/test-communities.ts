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

// Run with: npx tsx test-communities.ts
// Requires: postgres running + monolith dev server on :3001 + 2 users in DB.
async function runTests() {
  console.log('🧪 Starting GiniVibe Communities Verification Suite...\n');

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

  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 2) {
    throw new Error('At least 2 users are required in database to run verification suite.');
  }
  const [userA, userB] = users;
  const headersFor = (u: (typeof users)[number]) => ({
    Authorization: `Bearer ${jwt.sign({ id: u.id, username: u.username }, JWT_SECRET, { expiresIn: '1h' })}`,
    'Content-Type': 'application/json',
  });

  const uniqueName = `Test Club ${Date.now()}`;

  // --- Category 1: Create ---
  console.log('🏘️ Test Category: Community Creation');
  const createRes = await fetch(`${BASE_URL}/api/feed/communities`, {
    method: 'POST',
    headers: headersFor(userA),
    body: JSON.stringify({ name: uniqueName, description: 'A test club', category: 'Testing' }),
  });
  assert(createRes.status === 201, 'Create community returns HTTP 201');
  const community = await createRes.json();
  assert(community.isOwner === true && community.isMember === true, 'Creator is owner + member');

  const dupRes = await fetch(`${BASE_URL}/api/feed/communities`, {
    method: 'POST',
    headers: headersFor(userB),
    body: JSON.stringify({ name: uniqueName, category: 'Testing' }),
  });
  assert(dupRes.status === 409, 'Duplicate name rejected with HTTP 409');

  // --- Category 2: Posting requires membership ---
  console.log('🔒 Test Category: Membership-Gated Posting');
  const strangerPost = await fetch(`${BASE_URL}/api/feed/posts`, {
    method: 'POST',
    headers: headersFor(userB),
    body: JSON.stringify({ body: 'I should not be able to post', contentType: 'text', communityId: community.id }),
  });
  assert(strangerPost.status === 403, 'Non-member post rejected with HTTP 403');

  // --- Category 3: Join + post + list ---
  console.log('➕ Test Category: Join / Post / List');
  const joinRes = await fetch(`${BASE_URL}/api/feed/communities/${community.id}/join`, {
    method: 'POST',
    headers: headersFor(userB),
  });
  assert(joinRes.status === 200, 'Join returns HTTP 200');

  const rejoinRes = await fetch(`${BASE_URL}/api/feed/communities/${community.id}/join`, {
    method: 'POST',
    headers: headersFor(userB),
  });
  assert(rejoinRes.status === 200 && (await rejoinRes.json()).alreadyMember === true, 'Re-join is idempotent');

  const memberPost = await fetch(`${BASE_URL}/api/feed/posts`, {
    method: 'POST',
    headers: headersFor(userB),
    body: JSON.stringify({ body: 'Hello test club!', contentType: 'text', communityId: community.id }),
  });
  assert(memberPost.status === 201, 'Member post returns HTTP 201');
  const post = await memberPost.json();

  const postsRes = await fetch(`${BASE_URL}/api/feed/communities/${community.id}/posts`, {
    headers: headersFor(userA),
  });
  assert(postsRes.status === 200, 'Community posts list returns HTTP 200');
  const postsJson = await postsRes.json();
  assert(postsJson.data.some((p: any) => p.id === post.id), 'New post appears in community feed');

  // --- Category 4: Owner-only edit ---
  console.log('✏️ Test Category: Owner-Only Edit');
  const strangerEdit = await fetch(`${BASE_URL}/api/feed/communities/${community.id}`, {
    method: 'PATCH',
    headers: headersFor(userB),
    body: JSON.stringify({ description: 'Hijacked' }),
  });
  assert(strangerEdit.status === 403, 'Non-owner edit rejected with HTTP 403');

  const ownerEdit = await fetch(`${BASE_URL}/api/feed/communities/${community.id}`, {
    method: 'PATCH',
    headers: headersFor(userA),
    body: JSON.stringify({ description: 'Updated description' }),
  });
  assert(ownerEdit.status === 200, 'Owner edit returns HTTP 200');

  // --- Category 5: Leave rules ---
  console.log('🚪 Test Category: Leave Rules');
  const ownerLeave = await fetch(`${BASE_URL}/api/feed/communities/${community.id}/leave`, {
    method: 'DELETE',
    headers: headersFor(userA),
  });
  assert(ownerLeave.status === 403, 'Owner cannot leave (HTTP 403)');

  const memberLeave = await fetch(`${BASE_URL}/api/feed/communities/${community.id}/leave`, {
    method: 'DELETE',
    headers: headersFor(userB),
  });
  assert(memberLeave.status === 200, 'Member leave returns HTTP 200');

  // --- Category 6: Delete returns posts to public feed ---
  console.log('🗑️ Test Category: Delete Semantics');
  const strangerDelete = await fetch(`${BASE_URL}/api/feed/communities/${community.id}`, {
    method: 'DELETE',
    headers: headersFor(userB),
  });
  assert(strangerDelete.status === 403, 'Non-owner delete rejected with HTTP 403');

  const ownerDelete = await fetch(`${BASE_URL}/api/feed/communities/${community.id}`, {
    method: 'DELETE',
    headers: headersFor(userA),
  });
  assert(ownerDelete.status === 200, 'Owner delete returns HTTP 200');

  const orphanedPost = await prisma.post.findUnique({ where: { id: post.id } });
  assert(orphanedPost?.communityId === null, 'Community posts return to the public feed (communityId nulled)');

  // Cleanup the test post.
  await prisma.post.delete({ where: { id: post.id } });

  console.log(`\n🎉 All ${passed}/${total} community verification tests passed successfully!\n`);
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
