import { syncQueue } from './sync.queue';
import type { SyncEventType, QueueStats, DeadLetterItem } from './sync.types';

export class SearchSyncService {
  /**
   * Enqueues an asynchronous user index synchronization.
   * Safe to call from HTTP request handlers without awaiting completion or blocking the API response.
   */
  public queueUserSync(userId: string, type: SyncEventType = 'UPSERT_USER'): string {
    const job = syncQueue.enqueue(userId, type);
    return job.id;
  }

  /**
   * Enqueues an asynchronous user deletion from the search index.
   */
  public queueUserDelete(userId: string): string {
    const job = syncQueue.enqueue(userId, 'DELETE_USER');
    return job.id;
  }

  /**
   * Retrieves operational synchronization queue metrics.
   */
  public getStats(): QueueStats {
    return syncQueue.getStats();
  }

  /**
   * Returns dead-letter queue items.
   */
  public getDeadLetterQueue(): DeadLetterItem[] {
    return syncQueue.getDeadLetterQueue();
  }

  /**
   * Retries an item from the dead-letter queue.
   */
  public retryDeadLetter(jobId: string): boolean {
    return syncQueue.retryDeadLetter(jobId);
  }

  /**
   * Clears dead-letter queue.
   */
  public clearDeadLetterQueue(): void {
    syncQueue.clearDeadLetterQueue();
  }
}

export const searchSyncService = new SearchSyncService();
