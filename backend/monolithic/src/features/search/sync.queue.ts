import { randomUUID } from 'crypto';
import type { IndexSyncJob, DeadLetterItem, QueueStats, SyncEventType } from './sync.types';
import { indexSyncWorker, IndexSyncWorker } from './sync.worker';

export interface QueueConfig {
  concurrency?: number;
  baseBackoffMs?: number;
  maxAttempts?: number;
  pollIntervalMs?: number;
}

export class IndexSyncQueue {
  private queue: IndexSyncJob[] = [];
  private pendingJobsByUser: Map<string, IndexSyncJob> = new Map();
  private deadLetterQueue: DeadLetterItem[] = [];

  private activeWorkers = 0;
  private concurrency: number;
  private baseBackoffMs: number;
  private maxAttempts: number;

  private stats = {
    completed: 0,
    failed: 0,
  };

  private pollTimer?: NodeJS.Timeout;
  private worker: IndexSyncWorker;

  constructor(config: QueueConfig = {}, workerInstance = indexSyncWorker) {
    this.concurrency = config.concurrency || 2;
    this.baseBackoffMs = config.baseBackoffMs || 500;
    this.maxAttempts = config.maxAttempts || 3;
    this.worker = workerInstance;

    // Background poll for delayed retry jobs
    this.pollTimer = setInterval(() => {
      this.tick();
    }, config.pollIntervalMs || 250);

    if (this.pollTimer.unref) {
      this.pollTimer.unref();
    }
  }

  public setWorker(customWorker: IndexSyncWorker): void {
    this.worker = customWorker;
  }

  /**
   * Enqueues a sync job with per-user event deduplication and coalescing.
   */
  public enqueue(userId: string, type: SyncEventType = 'UPSERT_USER'): IndexSyncJob {
    const existing = this.pendingJobsByUser.get(userId);

    // Coalesce duplicate rapid events for the same user
    if (existing && existing.status === 'PENDING') {
      if (type === 'DELETE_USER') {
        existing.type = 'DELETE_USER'; // Upgrades to delete if user was removed
      }
      return existing;
    }

    const job: IndexSyncJob = {
      id: randomUUID(),
      userId,
      type,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: this.maxAttempts,
      nextRunAt: Date.now(),
      errorHistory: [],
      createdAt: Date.now(),
    };

    this.pendingJobsByUser.set(userId, job);
    this.queue.push(job);

    setImmediate(() => this.tick());
    return job;
  }

  /**
   * Main scheduling loop processing pending jobs within concurrency limits.
   */
  public async tick(): Promise<void> {
    if (this.activeWorkers >= this.concurrency) return;

    const now = Date.now();
    const candidate = this.queue.find(
      (job) => job.status === 'PENDING' && job.nextRunAt <= now
    );

    if (!candidate) return;

    this.activeWorkers++;
    candidate.status = 'PROCESSING';
    candidate.attempts++;
    candidate.lastAttemptAt = now;

    try {
      await this.worker.processJob(candidate);

      // Success
      candidate.status = 'COMPLETED';
      this.stats.completed++;
      this.pendingJobsByUser.delete(candidate.userId);
      this.queue = this.queue.filter((j) => j.id !== candidate.id);
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown worker failure';
      candidate.errorHistory.push(errorMsg);

      if (candidate.attempts < candidate.maxAttempts) {
        // Schedule exponential backoff retry: base * 2^(attempt - 1)
        const backoffDelay = this.baseBackoffMs * Math.pow(2, candidate.attempts - 1);
        candidate.status = 'PENDING';
        candidate.nextRunAt = Date.now() + backoffDelay;
        this.stats.failed++;
      } else {
        // Exhausted retries -> route to Dead-Letter Queue
        candidate.status = 'DEAD_LETTER';
        this.deadLetterQueue.push({
          job: candidate,
          failedAt: Date.now(),
          finalError: errorMsg,
        });
        this.pendingJobsByUser.delete(candidate.userId);
        this.queue = this.queue.filter((j) => j.id !== candidate.id);
        this.stats.failed++;
      }
    } finally {
      this.activeWorkers--;
      // Trigger subsequent tick for next item
      setImmediate(() => this.tick());
    }
  }

  /**
   * Returns operational queue metrics.
   */
  public getStats(): QueueStats {
    const pending = this.queue.filter((j) => j.status === 'PENDING').length;
    const processing = this.queue.filter((j) => j.status === 'PROCESSING').length;

    return {
      pending,
      processing,
      completed: this.stats.completed,
      failed: this.stats.failed,
      deadLetterCount: this.deadLetterQueue.length,
    };
  }

  /**
   * Returns current items in the Dead-Letter Queue.
   */
  public getDeadLetterQueue(): DeadLetterItem[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retries an item from the Dead-Letter Queue by re-enqueueing it.
   */
  public retryDeadLetter(jobId: string): boolean {
    const idx = this.deadLetterQueue.findIndex((item) => item.job.id === jobId);
    if (idx === -1) return false;

    const [item] = this.deadLetterQueue.splice(idx, 1);
    this.enqueue(item.job.userId, item.job.type);
    return true;
  }

  /**
   * Clears the Dead-Letter Queue.
   */
  public clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Graceful shutdown stopping polling timer.
   */
  public destroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}

export const syncQueue = new IndexSyncQueue();
