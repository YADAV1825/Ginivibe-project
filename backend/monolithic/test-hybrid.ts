import 'dotenv/config';
import { HybridFusion } from './src/features/search/hybrid.fusion';
import { HybridRanker } from './src/features/search/hybrid.ranker';
import { SearchService } from './src/features/search/search.service';
import { semanticSearchService } from './src/features/search/semantic.service';
import { LocalDeterministicEmbeddingProvider } from './src/features/search/embedding.provider';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runHybridTests() {
  console.log('=== LEVEL 7 HYBRID SEARCH & RANKING SUITE ===\n');

  // Test 1: Reciprocal Rank Fusion (RRF) Formula & Stability
  console.log('--- 1. Reciprocal Rank Fusion (RRF) ---');
  const lexicalItems = [
    { userId: 'user-A', score: 100 }, // Rank 1 in lexical
    { userId: 'user-B', score: 80 },  // Rank 2 in lexical
    { userId: 'user-C', score: 40 },  // Rank 3 in lexical
  ];
  const semanticItems = [
    { userId: 'user-B', score: 0.95 }, // Rank 1 in semantic
    { userId: 'user-A', score: 0.85 }, // Rank 2 in semantic
    { userId: 'user-D', score: 0.70 }, // Rank 3 in semantic
  ];

  const rrfResult = HybridFusion.fuseRRF(lexicalItems, semanticItems, { k: 60 });
  assert(rrfResult.length === 4, 'RRF cleanly fuses candidates across both channels (4 unique users)');

  // user-A: 1/(60+1) + 1/(60+2) = 1/61 + 1/62 = 0.01639 + 0.01613 = 0.03252
  // user-B: 1/(60+2) + 1/(60+1) = 0.03252 (equal contribution)
  const scoreA = rrfResult.find((u) => u.userId === 'user-A')!.fusedScore;
  const scoreB = rrfResult.find((u) => u.userId === 'user-B')!.fusedScore;
  const scoreC = rrfResult.find((u) => u.userId === 'user-C')!.fusedScore;
  const scoreD = rrfResult.find((u) => u.userId === 'user-D')!.fusedScore;

  assert(Math.abs(scoreA - scoreB) < 1e-6, 'Symmetric ranks produce equal RRF fused scores');
  assert(scoreA > scoreC, 'Candidates appearing in both channels score higher than single-channel candidates (scoreA > scoreC)');
  assert(scoreB > scoreD, 'Candidates appearing in both channels score higher than single-channel candidates (scoreB > scoreD)');
  assert(rrfResult[0].lexicalRank !== undefined && rrfResult[0].semanticRank !== undefined, 'RRF candidate retains channel rank metadata');

  // Test 2: Normalized Linear Fusion
  console.log('\n--- 2. Normalized Linear Fusion ---');
  const linearBalanced = HybridFusion.fuseLinear(lexicalItems, semanticItems, { alpha: 0.5 });
  assert(linearBalanced.length === 4, 'Linear fusion produces 4 combined candidates');
  assert(
    linearBalanced.every((c) => c.fusedScore >= 0.0 && c.fusedScore <= 1.0),
    'Normalized linear scores stay strictly within [0.0, 1.0]'
  );

  const linearPureLexical = HybridFusion.fuseLinear(lexicalItems, semanticItems, { alpha: 1.0 });
  const topLex = linearPureLexical[0];
  assert(topLex.userId === 'user-A', 'alpha = 1.0 prioritizes top lexical candidate user-A');

  const linearPureSemantic = HybridFusion.fuseLinear(lexicalItems, semanticItems, { alpha: 0.0 });
  const topSem = linearPureSemantic[0];
  assert(topSem.userId === 'user-B', 'alpha = 0.0 prioritizes top semantic candidate user-B');

  // Test 3: Multi-Signal Hybrid Re-Ranker
  console.log('\n--- 3. Multi-Signal Hybrid Re-Ranker ---');
  const ranker = new HybridRanker({
    exactUsernameBoost: 100,
    prefixMatchBoost: 30,
    profileCompletenessBoost: 10,
    recencyWeight: 1.0,
  });

  const profilesMap = new Map<string, any>([
    [
      'user-A',
      {
        userId: 'user-A',
        username: 'traveler_aman',
        displayName: 'Aman Deep',
        bio: 'Explorer and travel photographer who loves mountain treks',
        profilePic: 'https://cdn.ginivibe.com/aman.jpg',
        interests: ['travel', 'photography'],
        createdAt: new Date(),
        lastSeenAt: new Date(),
      },
    ],
    [
      'user-B',
      {
        userId: 'user-B',
        username: 'aman', // Exact match for query 'aman'
        displayName: 'Aman Kumar',
        bio: null, // Incomplete profile
        profilePic: null,
        interests: [],
        createdAt: new Date(),
        lastSeenAt: null,
      },
    ],
    [
      'user-C',
      {
        userId: 'user-C',
        username: 'someone_else',
        displayName: 'Rohan Sharma',
        bio: 'Just another profile with bio',
        profilePic: null,
        interests: [],
        createdAt: new Date(),
        lastSeenAt: null,
      },
    ],
  ]);

  // Query: "aman"
  const fusedForReranking = [
    { userId: 'user-A', fusedScore: 0.035 }, // Higher initial retrieval score
    { userId: 'user-B', fusedScore: 0.015 }, // Lower initial retrieval score, but exact handle!
    { userId: 'user-C', fusedScore: 0.010 },
  ];

  const reranked = ranker.rerank('aman', fusedForReranking, profilesMap);
  assert(reranked[0].userId === 'user-B', 'Exact username match boost elevates user-B to Rank 1');
  assert(reranked[0].signals.exactUsernameMatch === true, 'Exact username signal is flagged true for user-B');
  assert(reranked[1].signals.prefixMatch === true, 'Prefix match signal flagged true for traveler_aman / Aman Deep');
  assert(
    reranked.find((r) => r.userId === 'user-A')!.signals.profileCompletenessScore > 0,
    'Profile completeness boost awarded for complete profile (photo + bio + interests)'
  );

  // Test 4: End-to-End Hybrid Search Integration
  console.log('\n--- 4. End-to-End Hybrid Search Integration ---');
  const searchService = new SearchService();
  const seededUsers = await prisma.user.findMany({ take: 3 });
  assert(seededUsers.length >= 2, 'Database has seeded users for integration tests');

  const requester = seededUsers[0];
  const target = seededUsers[1];

  const hybridResponse = await searchService.searchUsers(requester.id, {
    q: 'photography',
    searchMode: 'hybrid',
    limit: 10,
  });

  assert(hybridResponse.searchMode === 'hybrid', 'Response mode is "hybrid"');
  assert(Array.isArray(hybridResponse.results), 'Hybrid search returns results array');
  assert(
    !hybridResponse.results.some((u) => u.id === requester.id),
    'Bilateral Privacy: Requester self-excluded in hybrid search'
  );
  if (hybridResponse.results.length > 0) {
    const first = hybridResponse.results[0];
    assert(first.score !== undefined && typeof first.score === 'number', 'Hybrid result has valid calibrated score');
    assert(!('password' in first) && !('email' in first), 'Allowlist: Zero secrets exposed in hybrid DTO');
  }

  // Test 5: Bilateral Block Privacy under Hybrid Retrieval
  console.log('\n--- 5. Bilateral Block Privacy in Hybrid Search ---');
  const testBlockId = `test-block-hybrid-${Date.now()}`;
  await prisma.block.create({
    data: {
      id: testBlockId,
      blockerId: requester.id,
      blockedId: target.id,
    },
  });

  const blockedHybridResp = await searchService.searchUsers(requester.id, {
    q: target.username,
    searchMode: 'hybrid',
  });
  assert(
    !blockedHybridResp.results.some((u) => u.id === target.id),
    'Bilateral Privacy: Blocked candidate strictly excluded from hybrid retrieval'
  );

  // Clean up test block
  await prisma.block.delete({
    where: { id: testBlockId },
  });

  // Test 6: Graceful Degradation on Semantic Failure
  console.log('\n--- 6. Graceful Degradation on Semantic Failure ---');
  const failingProvider = {
    metadata: { providerName: 'mock-fail-hybrid', model: 'fail', version: 1, dimensions: 64 },
    embed: async () => {
      throw new Error('503 Service Unavailable');
    },
  };
  semanticSearchService.setProvider(failingProvider);
  // Trip circuit breaker
  for (let i = 0; i < 6; i++) {
    await semanticSearchService.getQueryEmbedding('fail-test-hybrid');
  }

  const degradedHybridResp = await searchService.searchUsers(requester.id, {
    q: 'photography',
    searchMode: 'hybrid',
  });

  assert(degradedHybridResp.searchMode === 'hybrid', 'Degraded search preserves searchMode: "hybrid"');
  assert(degradedHybridResp.degraded === true, 'Response is cleanly flagged with degraded: true');
  assert(Array.isArray(degradedHybridResp.results), 'Degraded hybrid search returned lexical fusion results without crashing');

  // Restore healthy local provider
  semanticSearchService.setProvider(new LocalDeterministicEmbeddingProvider(64));

  // Summary
  console.log('\n========================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runHybridTests()
  .catch((err) => {
    console.error('Fatal error in hybrid test runner:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
