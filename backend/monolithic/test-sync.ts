import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { IndexSyncQueue } from './src/features/search/sync.queue';
import { searchSyncService } from './src/features/search/sync.service';
import type { IndexSyncJob } from './src/features/search/sync.types';
import type { IndexSyncWorker } from './src/features/search/sync.worker';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('🧪 Starting GiniVibe Level 3 Reliable Index Synchronization Verification Suite...\n');

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

  // --- Category 1: Asynchronous Enqueueing & Processing ---
  console.log('📦 Test Category: Asynchronous Queueing & Processing');

  const existingUser = await prisma.user.findFirst();
  if (!existingUser) {
    throw new Error('Database must contain at least 1 user for sync verification.');
  }

  const jobId = searchSyncService.queueUserSync(existingUser.id, 'PROFILE_UPDATED');
  assert(typeof jobId === 'string' && jobId.length > 0, 'queueUserSync returns non-empty jobId');

  // Allow async worker tick to process
  await sleep(400);

  const statsAfterSync = searchSyncService.getStats();
  assert(
    statsAfterSync.completed >= 1,
    `Async job was processed and completed (completed count: ${statsAfterSync.completed})`
  );

  // --- Category 2: Event Coalescing & Deduplication ---
  console.log('\n⚡ Test Category: Rapid Event Coalescing & Deduplication');

  const testUserId = `dedup-user-${Date.now()}`;
  const customQueue = new IndexSyncQueue({ concurrency: 1, baseBackoffMs: 100, pollIntervalMs: 50 });

  // Enqueue 5 rapid updates for the same user
  const job1 = customQueue.enqueue(testUserId, 'PROFILE_UPDATED');
  const job2 = customQueue.enqueue(testUserId, 'INTERESTS_UPDATED');
  const job3 = customQueue.enqueue(testUserId, 'PROFILE_UPDATED');

  assert(
    job1.id === job2.id && job2.id === job3.id,
    'Rapid events for the same userId coalesce into a single job instance'
  );

  // Upgrading pending job to DELETE_USER
  const jobDelete = customQueue.enqueue(testUserId, 'DELETE_USER');
  assert(
    jobDelete.id === job1.id && jobDelete.type === 'DELETE_USER',
    'Subsequent delete event upgrades coalesced pending job type to DELETE_USER'
  );

  customQueue.destroy();

  // --- Category 3: Exponential Backoff & Transient Retries ---
  console.log('\n🔄 Test Category: Exponential Backoff & Retry Logic');

  let failureCount = 0;
  const mockFlakyWorker: IndexSyncWorker = {
    processJob: async (job: IndexSyncJob) => {
      failureCount++;
      if (failureCount <= 2) {
        throw new Error(`Simulated transient network failure attempt ${failureCount}`);
      }
      // Succeeds on 3rd attempt
    },
  } as any;

  const retryQueue = new IndexSyncQueue(
    { concurrency: 1, baseBackoffMs: 100, maxAttempts: 3, pollIntervalMs: 50 },
    mockFlakyWorker
  );

  retryQueue.enqueue('flaky-user-123', 'UPSERT_USER');

  // Wait for 1st attempt (fail) -> wait 100ms -> 2nd attempt (fail) -> wait 200ms -> 3rd attempt (succeed)
  await sleep(750);

  const retryStats = retryQueue.getStats();
  assert(failureCount === 3, 'Worker retried transient failures up to success on 3rd attempt');
  assert(retryStats.completed === 1, 'Job successfully marked COMPLETED after retries');
  assert(retryStats.deadLetterCount === 0, 'Job was not placed in Dead Letter Queue because it recovered');

  retryQueue.destroy();

  // --- Category 4: Dead-Letter Queue (DLQ) on Exhausted Retries ---
  console.log('\n💀 Test Category: Dead-Letter Queue (DLQ) Routing & Recovery');

  const mockFailingWorker: IndexSyncWorker = {
    processJob: async () => {
      throw new Error('Permanent downstream failure');
    },
  } as any;

  const dlqQueue = new IndexSyncQueue(
    { concurrency: 1, baseBackoffMs: 50, maxAttempts: 2, pollIntervalMs: 50 },
    mockFailingWorker
  );

  dlqQueue.enqueue('permanently-failing-user', 'UPSERT_USER');

  // Wait for 2 attempts to fail: attempt 1 -> wait 50ms -> attempt 2 -> DLQ
  await sleep(450);

  const dlqStats = dlqQueue.getStats();
  assert(dlqStats.deadLetterCount === 1, 'Job routed to Dead Letter Queue after exhausting maxAttempts');

  const dlqItems = dlqQueue.getDeadLetterQueue();
  assert(dlqItems.length === 1, 'Dead Letter Queue contains exactly 1 item');
  assert(
    dlqItems[0].finalError === 'Permanent downstream failure',
    'Dead Letter Queue preserves final error message'
  );
  assert(
    dlqItems[0].job.attempts === 2,
    'Dead Letter Queue records full failure history and attempt count'
  );

  // Recovery test: Fix worker and retry dead-letter item
  let recovered = false;
  dlqQueue.setWorker({
    processJob: async () => {
      recovered = true;
    },
  } as any);

  const retryDlqSuccess = dlqQueue.retryDeadLetter(dlqItems[0].job.id);
  assert(retryDlqSuccess, 'retryDeadLetter successfully re-enqueues item from DLQ');

  await sleep(200);

  assert(recovered, 'Re-enqueued DLQ item was successfully reprocessed by recovered worker');
  assert(dlqQueue.getDeadLetterQueue().length === 0, 'Item cleanly removed from DLQ after retry');

  dlqQueue.destroy();

  // --- Category 5: Deletion Convergence on Non-Existent Users ---
  console.log('\n🗑️ Test Category: Deletion Convergence for Absent Database Records');

  const nonExistentUserId = '00000000-0000-0000-0000-000000000000';
  const deleteSyncJobId = searchSyncService.queueUserSync(nonExistentUserId, 'UPSERT_USER');

  await sleep(350);

  const statsAfterDelete = searchSyncService.getStats();
  assert(
    statsAfterDelete.completed >= 2,
    'Absence of user in PostgreSQL cleanly converges without uncaught exceptions'
  );

  console.log(`\n🎉 All ${passed}/${total} Level 3 verification tests passed successfully!\n`);
}

runTests()
  .catch((err) => {
    console.error('\n❌ Level 3 test suite failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
