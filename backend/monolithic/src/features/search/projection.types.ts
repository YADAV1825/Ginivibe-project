export interface SearchProjectionDocument {
  userId: string;
  username: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePic: string | null;
  gender: string | null;
  zodiacSign: string | null;
  dob: string | null;
  interests: string[];
  canonicalText: string;
  contentHash: string;
  projectionVersion: number;
  indexedAt: string;
}

export interface ProjectionBuildInput {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePic: string | null;
  gender: string | null;
  zodiacSign: string | null;
  dob: string | null;
  interests?: Array<{
    subInterest?: {
      name: string;
    };
  }> | string[];
  // Safety check: ensure forbidden fields can be flagged if passed
  password?: never;
  email?: never;
}

export interface ReindexOptions {
  batchSize?: number;
  limit?: number;
  writeToOpenSearch?: boolean;
}

export interface ReindexResult {
  totalProcessed: number;
  batchCount: number;
  errors: Array<{ userId: string; error: string }>;
  durationMs: number;
  projectionVersion: number;
}
