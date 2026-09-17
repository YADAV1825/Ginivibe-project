export interface VectorMetadata {
  providerName: string;
  model: string;
  version: number;
  dimensions: number;
}

export interface EmbeddingProvider {
  readonly metadata: VectorMetadata;
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
}

export interface VectorCandidate {
  userId: string;
  vector: number[];
  contentHash: string;
}

export interface SemanticSearchResult {
  userId: string;
  similarity: number;
}

export interface SemanticSearchOptions {
  minScore?: number;
  limit?: number;
  timeoutMs?: number;
}
