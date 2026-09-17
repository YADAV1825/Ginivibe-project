import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { JWT_SECRET } from './src/config/auth';
import { searchService } from './src/features/search/search.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 Starting GiniVibe Level 1 User Search Engine Verification Suite...\n');

  // 0. Ensure we have test users in the database
  const users = await prisma.user.findMany({ take: 5 });
  if (users.length < 2) {
    throw new Error('At least 2 users are required in database to run verification suite.');
  }

  const userA = users[0];
  const userB = users[1];

  const tokenA = jwt.sign({ id: userA.id, username: userA.username }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userB.id, username: userB.username }, JWT_SECRET, { expiresIn: '1h' });

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

  // --- Direct Service Tests ---
  console.log('📦 Test Category: SearchService Unit Logic');

  // Test 1: Self-Exclusion
  const directResults = await searchService.searchUsers(userA.id, { q: userA.username });
  assert(
    !directResults.results.some((u) => u.id === userA.id),
    'SearchService strictly excludes self from search results'
  );

  // Test 2: Bilateral Block Exclusion
  // Create a block where userA blocks userB
  await prisma.block.deleteMany({
    where: {
      OR: [
        { blockerId: userA.id, blockedId: userB.id },
        { blockerId: userB.id, blockedId: userA.id },
      ],
    },
  });

  await prisma.block.create({
    data: {
      id: `test-block-${Date.now()}`,
      blockerId: userA.id,
      blockedId: userB.id,
    },
  });

  const resultsWhenBlockedByMe = await searchService.searchUsers(userA.id, { q: userB.username });
  assert(
    !resultsWhenBlockedByMe.results.some((u) => u.id === userB.id),
    'Requester cannot see users they have blocked'
  );

  const resultsWhenBlockedMe = await searchService.searchUsers(userB.id, { q: userA.username });
  assert(
    !resultsWhenBlockedMe.results.some((u) => u.id === userA.id),
    'Requester cannot see users who have blocked them (Bilateral invariant)'
  );

  // Clean up block
  await prisma.block.deleteMany({
    where: {
      OR: [
        { blockerId: userA.id, blockedId: userB.id },
        { blockerId: userB.id, blockedId: userA.id },
      ],
    },
  });

  // Test 3: Cursor encode / decode roundtrip
  const sampleItem = { id: 'user-uuid-123', createdAt: new Date() };
  const encodedCursor = searchService.encodeCursor(sampleItem);
  const decodedCursor = searchService.decodeCursor(encodedCursor);
  assert(
    decodedCursor !== null &&
      decodedCursor.id === sampleItem.id &&
      decodedCursor.createdAt === sampleItem.createdAt.toISOString(),
    'Cursor encoding and decoding maintains cryptographic roundtrip integrity'
  );

  const corruptCursor = searchService.decodeCursor('invalid-base64-payload!!!');
  assert(corruptCursor === null, 'Corrupted cursor safely returns null');

  // --- HTTP API Tests ---
  console.log('\n🌐 Test Category: HTTP Search Endpoints & Security Controls');

  // Test 4: Unauthenticated request rejection
  const unauthRes = await fetch(`${BASE_URL}/api/search/users?q=test`);
  assert(unauthRes.status === 401, 'Unauthenticated search request rejected with HTTP 401');

  // Test 5: Input validation - query too short
  const shortQueryRes = await fetch(`${BASE_URL}/api/search/users?q=a`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(shortQueryRes.status === 400, 'Query shorter than 2 chars rejected with HTTP 400');
  const shortQueryJson = await shortQueryRes.json();
  assert(
    shortQueryJson.error === 'Search query must be between 2 and 50 characters.',
    'Returns accurate validation error message for short queries'
  );

  // Test 6: Input validation - query too long
  const longQuery = 'a'.repeat(51);
  const longQueryRes = await fetch(`${BASE_URL}/api/search/users?q=${longQuery}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(longQueryRes.status === 400, 'Query longer than 50 chars rejected with HTTP 400');

  // Test 7: Valid search query & Response DTO Safety
  const validSearchRes = await fetch(`${BASE_URL}/api/search/users?q=an&limit=5`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(validSearchRes.status === 200, 'Valid search query returns HTTP 200');
  const searchJson = await validSearchRes.json();
  assert(Array.isArray(searchJson.results), 'Response contains results array');

  if (searchJson.results.length > 0) {
    const firstResult = searchJson.results[0];
    assert(
      firstResult.id && firstResult.username && firstResult.displayName,
      'Search result DTO contains required public fields'
    );
    assert(
      firstResult.password === undefined,
      'CRITICAL: Password hash is NOT exposed in result DTO'
    );
    assert(
      firstResult.email === undefined,
      'CRITICAL: Email address is NOT exposed in result DTO'
    );
    assert(
      Array.isArray(firstResult.interests),
      'User interests are mapped to clean string array'
    );
  }

  // Test 8: Cursor Pagination
  const page1Res = await fetch(`${BASE_URL}/api/search/users?q=an&limit=2`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const page1Json = await page1Res.json();

  if (page1Json.nextCursor) {
    const page2Res = await fetch(
      `${BASE_URL}/api/search/users?q=an&limit=2&cursor=${encodeURIComponent(page1Json.nextCursor)}`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(page2Res.status === 200, 'Page 2 with cursor returns HTTP 200');
    const page2Json = await page2Res.json();
    assert(Array.isArray(page2Json.results), 'Page 2 contains results array');

    const page1Ids = new Set(page1Json.results.map((r: any) => r.id));
    const overlaps = page2Json.results.filter((r: any) => page1Ids.has(r.id));
    assert(overlaps.length === 0, 'Cursor pagination guarantees no duplicate results between pages');
  }

  // Test 9: Malformed cursor returns 400
  const badCursorRes = await fetch(`${BASE_URL}/api/search/users?q=test&cursor=gibberish_cursor_string`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert(badCursorRes.status === 400, 'Malformed cursor rejected with HTTP 400');

  // Test 10: Backward-compatible Chat Search (/api/chat/users/search?query=...)
  const chatSearchRes = await fetch(
    `${BASE_URL}/api/chat/users/search?query=${encodeURIComponent(userB.username.slice(0, 4))}`,
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  assert(chatSearchRes.status === 200, 'Legacy /api/chat/users/search returns HTTP 200');
  const chatSearchJson = await chatSearchRes.json();
  assert(Array.isArray(chatSearchJson), 'Chat search returns ChatUser[] array directly');

  console.log(`\n🎉 All ${passed}/${total} Level 1 verification tests passed successfully!\n`);
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
