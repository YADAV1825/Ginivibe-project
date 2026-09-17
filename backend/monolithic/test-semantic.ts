import 'dotenv/config';
import { VectorMath } from './src/features/search/vector.math';
import {
  LocalDeterministicEmbeddingProvider,
  EmbeddingProviderFactory,
} from './src/features/search/embedding.provider';
import { EmbeddingCache } from './src/features/search/embedding.cache';
import { SemanticSearchService } from './src/features/search/semantic.service';
import { SearchService } from './src/features/search/search.service';
import { SearchProjectionBuilder } from './src/features/search/projection.builder';
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

async function runSemanticTests() {
  console.log('=== LEVEL 6 SEMANTIC SEARCH SUITE ===\n');

  // Test 1: Vector Math - Magnitude and Normalization
  console.log('--- 1. Vector Math Operations ---');
  const v1 = [3, 4];
  assert(Math.abs(VectorMath.magnitude(v1) - 5) < 1e-6, 'VectorMath.magnitude([3,4]) equals 5');

  const unitV1 = VectorMath.normalize(v1);
  assert(Math.abs(VectorMath.magnitude(unitV1) - 1.0) < 1e-6, 'VectorMath.normalize produces unit vector (|v| == 1.0)');
  assert(Math.abs(unitV1[0] - 0.6) < 1e-6 && Math.abs(unitV1[1] - 0.8) < 1e-6, 'VectorMath.normalize computes correct components [0.6, 0.8]');

  const zeroNorm = VectorMath.normalize([0, 0, 0]);
  assert(zeroNorm.every((x) => x === 0), 'VectorMath.normalize([0,0,0]) safely returns zero vector without NaN');

  // Test 2: Cosine Similarity
  console.log('\n--- 2. Cosine Similarity & Dot Product ---');
  const a = [1, 0];
  const b = [0, 1];
  const c = [1, 0];
  const d = [-1, 0];
  assert(Math.abs(VectorMath.cosineSimilarity(a, c)) === 1.0, 'Identical vectors have cosine similarity = 1.0');
  assert(Math.abs(VectorMath.cosineSimilarity(a, b)) === 0.0, 'Orthogonal vectors have cosine similarity = 0.0');
  assert(Math.abs(VectorMath.cosineSimilarity(a, d) - (-1.0)) < 1e-6, 'Opposite vectors have cosine similarity = -1.0');

  let thrownMismatch = false;
  try {
    VectorMath.cosineSimilarity([1, 2], [1, 2, 3]);
  } catch {
    thrownMismatch = true;
  }
  assert(thrownMismatch, 'VectorMath.cosineSimilarity throws on dimension mismatch');

  // Test 3: Local Deterministic Embedding Provider
  console.log('\n--- 3. Local Deterministic Embedding Provider ---');
  const provider = new LocalDeterministicEmbeddingProvider(64);
  assert(provider.metadata.dimensions === 64, 'Provider dimensions match configuration');
  assert(provider.metadata.providerName === 'local-deterministic', 'Provider name is local-deterministic');

  const emb1 = await provider.embed('Professional portrait photographer in Chandigarh');
  const emb2 = await provider.embed('Professional portrait photographer in Chandigarh');
  assert(emb1.length === 64, 'Embedding length is 64 dimensions');
  assert(
    emb1.every((val, idx) => Math.abs(val - emb2[idx]) < 1e-9),
    'Deterministic: identical text yields byte-identical vector'
  );
  assert(Math.abs(VectorMath.magnitude(emb1) - 1.0) < 1e-6, 'Embedding output is unit-normalized');

  // Semantic relatedness test
  const embCamera = await provider.embed('Camera lenses, photography and visual portrait art');
  const embHiker = await provider.embed('Mountain trekking, outdoor adventure and backpacking');
  const simPhotoCamera = VectorMath.cosineSimilarity(emb1, embCamera, true);
  const simPhotoHiker = VectorMath.cosineSimilarity(emb1, embHiker, true);
  assert(
    simPhotoCamera > simPhotoHiker,
    `Semantic alignment: "photographer" closer to "camera" (${simPhotoCamera.toFixed(3)}) than "hiker" (${simPhotoHiker.toFixed(3)})`
  );

  // Test 4: Embedding Cache & Cost Control (Section 50)
  console.log('\n--- 4. Embedding Cache & Cost Control (Section 50) ---');
  const testCache = new EmbeddingCache({ maxEntries: 2, defaultTtlMs: 5000 });
  const hashA = SearchProjectionBuilder.computeContentHash('Canonical Profile Text Aman');
  const hashB = SearchProjectionBuilder.computeContentHash('Canonical Profile Text Jane');
  const hashC = SearchProjectionBuilder.computeContentHash('Canonical Profile Text Charlie');

  testCache.set(hashA, [0.1, 0.2]);
  testCache.set(hashB, [0.3, 0.4]);
  assert(testCache.has(hashA), 'Cache contains hashA');
  assert(testCache.has(hashB), 'Cache contains hashB');
  assert(testCache.size() === 2, 'Cache size is 2');

  // Insert 3rd item to test LRU eviction of oldest
  testCache.set(hashC, [0.5, 0.6]);
  assert(testCache.has(hashC), 'Cache contains newly added hashC');
  assert(testCache.size() === 2, 'Cache size remains capped at maxEntries (2)');
  assert(!testCache.has(hashA), 'LRU policy evicted oldest entry hashA');

  // Test 5: Semantic Search Service Candidate Ranking
  console.log('\n--- 5. Semantic Search Service Candidate Ranking ---');
  const semanticService = new SemanticSearchService(provider, new EmbeddingCache());
  const candidates = [
    {
      userId: 'user-photo',
      canonicalText: 'Name: Priya\nBio: Passionate photographer and portrait artist\nInterests: camera, photo, portrait',
      contentHash: SearchProjectionBuilder.computeContentHash('Priya Photographer'),
    },
    {
      userId: 'user-coder',
      canonicalText: 'Name: Rahul\nBio: Fullstack TypeScript developer building distributed systems\nInterests: coding, software, typescript',
      contentHash: SearchProjectionBuilder.computeContentHash('Rahul Dev'),
    },
    {
      userId: 'user-hiker',
      canonicalText: 'Name: Arjun\nBio: Hiking trails in the Himalayas and rock climbing\nInterests: adventure, hiking, mountains',
      contentHash: SearchProjectionBuilder.computeContentHash('Arjun Hiker'),
    },
  ];

  const rankedPhoto = await semanticService.rankCandidatesBySimilarity(
    'photographer camera portraits',
    candidates
  );
  assert(rankedPhoto !== null, 'Candidate ranking returned successfully');
  assert(rankedPhoto![0].userId === 'user-photo', 'Top candidate for "photographer" is user-photo');
  assert(rankedPhoto![0].similarity > rankedPhoto![1].similarity, 'Top candidate has strictly higher similarity score');

  const rankedDev = await semanticService.rankCandidatesBySimilarity(
    'software engineering developer',
    candidates
  );
  assert(rankedDev !== null && rankedDev[0].userId === 'user-coder', 'Top candidate for "developer" is user-coder');

  // Test 6: Circuit Breaker & Graceful Degradation (Section 27 & 28)
  console.log('\n--- 6. Circuit Breaker & Graceful Degradation ---');
  const failingProvider = {
    metadata: { providerName: 'mock-failing', model: 'fail', version: 1, dimensions: 64 },
    embed: async () => {
      throw new Error('Remote Provider 503 Service Unavailable');
    },
  };
  const resilientService = new SemanticSearchService(failingProvider, new EmbeddingCache());
  // Query multiple times to trigger circuit breaker
  for (let i = 0; i < 6; i++) {
    await resilientService.getQueryEmbedding('test query');
  }
  assert(resilientService.isCircuitOpen(), 'Circuit breaker OPENED after consecutive failures');
  const nullVector = await resilientService.getQueryEmbedding('new query');
  assert(nullVector === null, 'Failing provider gracefully returns null vector instead of unhandled rejection');

  // Test 7: Full End-to-End Search Service Integration (Semantic + Privacy + Fallback)
  console.log('\n--- 7. End-to-End Search Service Integration ---');
  const searchService = new SearchService();
  const seededUsers = await prisma.user.findMany({ take: 3 });
  assert(seededUsers.length >= 2, 'Database contains at least 2 seeded users for integration tests');

  const requester = seededUsers[0];
  const target = seededUsers[1];

  // 7a. Normal semantic search query
  const semanticResp = await searchService.searchUsers(requester.id, {
    q: 'photography',
    searchMode: 'semantic',
    limit: 10,
  });
  assert(semanticResp.searchMode === 'semantic', 'Search response mode is "semantic"');
  assert(Array.isArray(semanticResp.results), 'Semantic search returns valid results array');
  assert(
    !semanticResp.results.some((u) => u.id === requester.id),
    'Bilateral Privacy: Requester self-excluded in semantic mode'
  );
  if (semanticResp.results.length > 0) {
    const first = semanticResp.results[0];
    assert(first.score !== undefined && typeof first.score === 'number', 'Semantic result has valid similarity score');
    assert(!('password' in first) && !('email' in first), 'Allowlist: Zero secrets exposed in semantic DTO');
  }

  // 7b. Bilateral block privacy in semantic search
  const existingBlock = await prisma.block.findFirst({
    where: { blockerId: requester.id, blockedId: target.id },
  });
  if (!existingBlock) {
    await prisma.block.create({
      data: {
        id: `test-block-semantic-${Date.now()}`,
        blockerId: requester.id,
        blockedId: target.id,
      },
    });
  }

  const blockedResp = await searchService.searchUsers(requester.id, {
    q: target.username,
    searchMode: 'semantic',
  });
  assert(
    !blockedResp.results.some((u) => u.id === target.id),
    'Bilateral Privacy: Blocked user strictly excluded from semantic search results'
  );

  // Clean up test block
  await prisma.block.deleteMany({
    where: { blockerId: requester.id, blockedId: target.id },
  });

  // 7c. Graceful degradation when provider is down
  // Temporarily substitute failing provider in semanticSearchService
  const { semanticSearchService } = await import('./src/features/search/semantic.service');
  semanticSearchService.setProvider(failingProvider);
  for (let i = 0; i < 6; i++) {
    await semanticSearchService.getQueryEmbedding('fail-test');
  }

  const degradedResp = await searchService.searchUsers(requester.id, {
    q: 'photography',
    searchMode: 'semantic',
  });
  assert(degradedResp.searchMode === 'lexical', 'Graceful Degradation: searchMode seamlessly degraded to "lexical"');
  assert(degradedResp.degraded === true, 'Graceful Degradation: response flagged with degraded: true');
  assert(Array.isArray(degradedResp.results), 'Degraded search successfully returned lexical fallback results');

  // Restore healthy local provider
  semanticSearchService.setProvider(provider);

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

runSemanticTests()
  .catch((err) => {
    console.error('Fatal error in semantic test runner:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
