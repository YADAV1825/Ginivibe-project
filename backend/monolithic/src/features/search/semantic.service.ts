import type { EmbeddingProvider, SemanticSearchOptions, SemanticSearchResult } from './embedding.types';
import { EmbeddingProviderFactory } from './embedding.provider';
import { EmbeddingCache, defaultEmbeddingCache } from './embedding.cache';
import { VectorMath } from './vector.math';
import type { SearchProjectionDocument } from './projection.types';
import { SearchProjectionBuilder } from './projection.builder';

export interface SemanticCandidate {
  userId: string;
  vector: number[];
  contentHash: string;
}

export class SemanticSearchService {
  private provider: EmbeddingProvider;
  private cache: EmbeddingCache;
  private consecutiveFailures = 0;
  private readonly maxFailuresBeforeCircuitOpen = 5;
  private circuitOpenedAt = 0;
  private readonly circuitCooldownMs = 30000; // 30s cooldown

  constructor(provider?: EmbeddingProvider, cache?: EmbeddingCache) {
    this.provider = provider ?? EmbeddingProviderFactory.getProvider();
    this.cache = cache ?? defaultEmbeddingCache;
  }

  public setProvider(provider: EmbeddingProvider): void {
    this.provider = provider;
  }

  public isCircuitOpen(): boolean {
    if (this.consecutiveFailures >= this.maxFailuresBeforeCircuitOpen) {
      if (Date.now() - this.circuitOpenedAt < this.circuitCooldownMs) {
        return true;
      }
      // Half-open attempt after cooldown
      this.consecutiveFailures = 0;
    }
    return false;
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  private recordFailure(err: any): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.maxFailuresBeforeCircuitOpen) {
      this.circuitOpenedAt = Date.now();
      console.warn(`[SemanticSearchService] Circuit breaker OPENED due to ${this.consecutiveFailures} consecutive failures: ${err?.message || err}`);
    }
  }

  /**
   * Generates or retrieves cached embedding for arbitrary text (such as a search query).
   */
  public async getQueryEmbedding(query: string): Promise<number[] | null> {
    if (this.isCircuitOpen()) {
      return null;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return null;
    }

    const cacheKey = `query:${trimmed.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const vector = await this.provider.embed(trimmed);
      this.cache.set(cacheKey, vector, 600000); // 10 min TTL for queries
      this.recordSuccess();
      return vector;
    } catch (err: any) {
      this.recordFailure(err);
      console.warn(`[SemanticSearchService] Failed to embed query "${trimmed}":`, err?.message || err);
      return null;
    }
  }

  /**
   * Generates or retrieves cached embedding for a user projection document.
   * Leverages doc.contentHash for cost control (Section 50).
   */
  public async getUserDocumentEmbedding(doc: SearchProjectionDocument): Promise<number[]> {
    const cached = this.cache.get(doc.contentHash);
    if (cached) {
      return cached;
    }

    try {
      const vector = await this.provider.embed(doc.canonicalText);
      this.cache.set(doc.contentHash, vector); // Long TTL for content hashes
      this.recordSuccess();
      return vector;
    } catch (err: any) {
      this.recordFailure(err);
      throw err;
    }
  }

  /**
   * Scores and ranks a list of candidate documents against a semantic search query.
   * Gracefully returns null if embedding provider is unavailable or circuit is open.
   */
  public async rankCandidatesBySimilarity(
    query: string,
    candidates: Array<{ userId: string; canonicalText: string; contentHash: string }>,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[] | null> {
    const queryVector = await this.getQueryEmbedding(query);
    if (!queryVector) {
      // Graceful degradation: return null so caller falls back to lexical search
      return null;
    }

    const minScore = options.minScore ?? -1.0;
    const limit = options.limit ?? 50;

    const scored: SemanticSearchResult[] = [];

    for (const candidate of candidates) {
      let candidateVector = this.cache.get(candidate.contentHash);
      if (!candidateVector) {
        try {
          candidateVector = await this.provider.embed(candidate.canonicalText);
          this.cache.set(candidate.contentHash, candidateVector);
        } catch {
          // If a single candidate fails embedding, skip or assign 0
          continue;
        }
      }

      const similarity = VectorMath.cosineSimilarity(queryVector, candidateVector, true);
      if (similarity >= minScore) {
        scored.push({
          userId: candidate.userId,
          similarity,
        });
      }
    }

    // Sort descending by semantic similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, limit);
  }
}

export const semanticSearchService = new SemanticSearchService();
