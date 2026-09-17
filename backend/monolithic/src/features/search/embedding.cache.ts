/**
 * LRU Embedding Cache for cost control (Section 50).
 * Caches vector embeddings keyed by SHA-256 contentHash (for profile text)
 * or normalized query strings.
 */
interface CacheEntry {
  vector: number[];
  expiresAt: number;
}

export class EmbeddingCache {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(options: { maxEntries?: number; defaultTtlMs?: number } = {}) {
    this.maxEntries = options.maxEntries ?? 10000;
    this.defaultTtlMs = options.defaultTtlMs ?? 3600 * 1000; // 1 hour default
  }

  public get(key: string): number[] | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order (delete and re-insert)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.vector;
  }

  public set(key: string, vector: number[], ttlMs?: number): void {
    if (!key || !vector || vector.length === 0) return;

    // Evict oldest if capacity exceeded
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, { vector, expiresAt });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public size(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const defaultEmbeddingCache = new EmbeddingCache();
