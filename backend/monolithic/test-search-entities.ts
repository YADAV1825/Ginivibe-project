import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { JWT_SECRET } from './src/config/auth';
import { TextAnalyzer } from './src/features/search/text.analyzer';
import { EmbeddingProviderFactory } from './src/features/search/embedding.provider';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'http://localhost:3001';

// Run with: npx tsx test-search-entities.ts
// Requires: postgres running + monolith dev server on :3001.
async function runTests() {
  console.log('🧪 Starting GiniVibe Entity Search (posts/communities) Verification Suite...\n');

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

  // --- Category 1: Synonym expansion incl. pet cluster (pure, offline) ---
  console.log('🔤 Test Category: Synonym Expansion');
  const expanded = TextAnalyzer.expandSynonyms(['cat']);
  assert(expanded.includes('kitty') && expanded.includes('kitten'), 'cat expands to kitty/kitten', JSON.stringify(expanded));
  const dogExpanded = TextAnalyzer.expandSynonyms(['puppy']);
  assert(dogExpanded.includes('dog'), 'puppy expands to dog', JSON.stringify(dogExpanded));

  // --- Category 2: Local embedding clusters share dimensions ---
  console.log('🧮 Test Category: Local Embedding Pet Cluster');
  const provider = EmbeddingProviderFactory.getProvider();
  const catVec = await provider.embed('cat');
  const kittyVec = await provider.embed('kitty');
  const overlap = catVec.filter((v: number, i: number) => Math.abs(v) > 0.01 && Math.abs(kittyVec[i]) > 0.01).length;
  assert(overlap >= 3, `cat/kitty share cluster dimensions (overlap=${overlap})`);

  // --- Category 3: HTTP — posts search ---
  console.log('📝 Test Category: POST /api/search/posts');
  const users = await prisma.user.findMany({ take: 2 });
  if (users.length < 1) {
    throw new Error('At least 1 user is required in database to run verification suite.');
  }
  const token = jwt.sign({ id: users[0].id, username: users[0].username }, JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };

  const shortRes = await fetch(`${BASE_URL}/api/search/posts?q=a`, { headers });
  assert(shortRes.status === 400, 'Single-char query rejected with HTTP 400');

  const postsRes = await fetch(`${BASE_URL}/api/search/posts?q=test&limit=5`, { headers });
  assert(postsRes.status === 200, 'Posts search returns HTTP 200');
  const postsJson = await postsRes.json();
  assert(Array.isArray(postsJson.results), 'Posts search returns { results[] }');
  assert(postsJson.searchMode === 'lexical', 'Posts search reports lexical mode');

  // --- Category 4: HTTP — communities search ---
  console.log('🏘️ Test Category: GET /api/search/communities');
  const commRes = await fetch(`${BASE_URL}/api/search/communities?q=test&limit=5`, { headers });
  assert(commRes.status === 200, 'Communities search returns HTTP 200');
  const commJson = await commRes.json();
  assert(Array.isArray(commJson.results), 'Communities search returns { results[] }');
  assert(commJson.searchMode === 'lexical', 'Communities search reports lexical mode');

  // --- Category 5: auth required ---
  console.log('🔒 Test Category: Auth Enforcement');
  const anonRes = await fetch(`${BASE_URL}/api/search/posts?q=test`);
  assert(anonRes.status === 401, 'Anonymous posts search rejected with HTTP 401');

  console.log(`\n🎉 All ${passed}/${total} entity search verification tests passed successfully!\n`);
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
