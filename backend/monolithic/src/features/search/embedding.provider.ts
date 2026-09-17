import { createHash } from 'crypto';
import type { EmbeddingProvider, VectorMetadata } from './embedding.types';
import { VectorMath } from './vector.math';
import { TextAnalyzer } from './text.analyzer';

/**
 * Local Deterministic Embedding Provider.
 * Produces unit-normalized dense vectors using term hashing, n-grams, and semantic sub-dimension clustering.
 * Completely offline, zero network latency, zero external API costs, 100% reproducible for unit tests and CI.
 */
export class LocalDeterministicEmbeddingProvider implements EmbeddingProvider {
  public readonly metadata: VectorMetadata;

  // Semantic clusters map related concepts to targeted vector sub-dimensions
  private static readonly SEMANTIC_CLUSTERS: Record<string, number[]> = {
    // Photography / visual art cluster
    photograph: [0, 1, 2],
    photographer: [0, 1, 2],
    photography: [0, 1, 2],
    photo: [0, 1, 2],
    camera: [0, 1, 2],
    portrait: [0, 1, 2],
    lens: [0, 1, 2],

    // Tech / coding / engineering cluster
    code: [3, 4, 5],
    coding: [3, 4, 5],
    developer: [3, 4, 5],
    software: [3, 4, 5],
    engineer: [3, 4, 5],
    programming: [3, 4, 5],
    typescript: [3, 4, 5],
    javascript: [3, 4, 5],

    // Outdoors / hiking cluster
    travel: [6, 7, 8],
    hiking: [6, 7, 8],
    hike: [6, 7, 8],
    trekking: [6, 7, 8],
    adventure: [6, 7, 8],
    nature: [6, 7, 8],
    mountains: [6, 7, 8],

    // Music / performance cluster
    music: [9, 10, 11],
    musician: [9, 10, 11],
    guitar: [9, 10, 11],
    singer: [9, 10, 11],
    band: [9, 10, 11],
    audio: [9, 10, 11],

    // Fitness / sports cluster
    fitness: [12, 13, 14],
    gym: [12, 13, 14],
    workout: [12, 13, 14],
    yoga: [12, 13, 14],
    athlete: [12, 13, 14],
    running: [12, 13, 14],

    // Pets / animals cluster
    cat: [15, 16, 17],
    kitty: [15, 16, 17],
    kitten: [15, 16, 17],
    feline: [15, 16, 17],
    dog: [15, 16, 17],
    puppy: [15, 16, 17],
    pup: [15, 16, 17],
    canine: [15, 16, 17],
    pet: [15, 16, 17],
    pets: [15, 16, 17],
  };

  constructor(dimensions = 64) {
    this.metadata = {
      providerName: 'local-deterministic',
      model: 'ginivibe-local-v1',
      version: 1,
      dimensions,
    };
  }

  public async embed(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string') {
      return new Array(this.metadata.dimensions).fill(0);
    }

    const rawVector = new Array(this.metadata.dimensions).fill(0);
    const normalized = TextAnalyzer.normalizeText(text);
    const tokens = TextAnalyzer.tokenize(normalized);

    if (tokens.length === 0) {
      return rawVector;
    }

    // 1. Semantic cluster activation
    for (const token of tokens) {
      const clusterIndices = LocalDeterministicEmbeddingProvider.SEMANTIC_CLUSTERS[token];
      if (clusterIndices) {
        for (const idx of clusterIndices) {
          if (idx < this.metadata.dimensions) {
            rawVector[idx] += 3.0;
          }
        }
      }
    }

    // 2. Term & Substring Hashing across all dimensions
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Hash whole token
      const hashVal = this.hashString(token);
      const targetDim = Math.abs(hashVal) % this.metadata.dimensions;
      const sign = (hashVal & 1) === 0 ? 1.0 : -1.0;
      rawVector[targetDim] += sign * (2.0 / (1 + i * 0.1));

      // Hash 3-grams for subword morphological matching (e.g. "photog", "hike", "travel")
      if (token.length >= 3) {
        for (let j = 0; j <= token.length - 3; j++) {
          const gram = token.substring(j, j + 3);
          const gramHash = this.hashString(gram);
          const gramDim = Math.abs(gramHash) % this.metadata.dimensions;
          rawVector[gramDim] += 0.5;
        }
      }
    }

    // Return unit-normalized vector
    return VectorMath.normalize(rawVector);
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash;
  }
}

/**
 * Remote Embedding Provider adapter for production cloud APIs (OpenAI, Gemini, Ollama, TEI).
 */
export class RemoteEmbeddingProvider implements EmbeddingProvider {
  public readonly metadata: VectorMetadata;
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: {
    endpoint: string;
    apiKey?: string;
    model?: string;
    dimensions?: number;
    timeoutMs?: number;
  }) {
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.metadata = {
      providerName: 'remote-http',
      model: options.model ?? 'text-embedding-3-small',
      version: 1,
      dimensions: options.dimensions ?? 1536,
    };
  }

  public async embed(text: string): Promise<number[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.metadata.model,
          input: text,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Embedding API returned status ${response.status}`);
      }

      const data = await response.json();
      const rawVector = data?.data?.[0]?.embedding;
      if (!Array.isArray(rawVector)) {
        throw new Error('Malformed embedding response from remote provider');
      }

      return VectorMath.normalize(rawVector);
    } finally {
      clearTimeout(timer);
    }
  }

  public async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

/**
 * Factory for creating the active EmbeddingProvider based on environment configuration.
 */
export class EmbeddingProviderFactory {
  private static instance: EmbeddingProvider | null = null;

  public static getProvider(): EmbeddingProvider {
    if (!this.instance) {
      const providerType = (process.env.EMBEDDING_PROVIDER || 'local').toLowerCase();
      if (providerType === 'remote' && process.env.EMBEDDING_ENDPOINT) {
        this.instance = new RemoteEmbeddingProvider({
          endpoint: process.env.EMBEDDING_ENDPOINT,
          apiKey: process.env.EMBEDDING_API_KEY,
          model: process.env.EMBEDDING_MODEL,
          dimensions: process.env.EMBEDDING_DIMENSIONS ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10) : undefined,
        });
      } else {
        this.instance = new LocalDeterministicEmbeddingProvider();
      }
    }
    return this.instance;
  }

  public static setProvider(provider: EmbeddingProvider): void {
    this.instance = provider;
  }

  public static reset(): void {
    this.instance = null;
  }
}
