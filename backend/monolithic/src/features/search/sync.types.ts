export type SyncEventType =
  | 'UPSERT_USER'
  | 'DELETE_USER'
  | 'PROFILE_UPDATED'
  | 'INTERESTS_UPDATED';

export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD_LETTER';

export interface IndexSyncJob {
  id: string;
  userId: string;
  type: SyncEventType;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: number;
  nextRunAt: number;
  errorHistory: string[];
  createdAt: number;
}

export interface DeadLetterItem {
  job: IndexSyncJob;
  failedAt: number;
  finalError: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  deadLetterCount: number;
}
