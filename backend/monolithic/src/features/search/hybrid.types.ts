export type FusionMethod = 'rrf' | 'linear';

export interface HybridFusionOptions {
  method?: FusionMethod;
  /**
   * Smoothing constant for Reciprocal Rank Fusion (RRF). Standard default is 60.
   */
  k?: number;
  /**
   * Relative weight for the lexical retrieval channel. Default is 1.0.
   */
  lexicalWeight?: number;
  /**
   * Relative weight for the semantic retrieval channel. Default is 1.0.
   */
  semanticWeight?: number;
  /**
   * Balance parameter for linear fusion: [0.0, 1.0].
   * 1.0 = purely lexical, 0.0 = purely semantic, 0.5 = equal blend. Default is 0.5.
   */
  alpha?: number;
}

export interface HybridRankingConfig {
  /**
   * Score boost for exact username matches (case-insensitive). Default: 100.
   */
  exactUsernameBoost: number;
  /**
   * Score boost when username or display name starts with the search query. Default: 30.
   */
  prefixMatchBoost: number;
  /**
   * Bonus for profile completeness (avatar + bio + interests). Default: 10.
   */
  profileCompletenessBoost: number;
  /**
   * Small recency tie-breaker weight. Default: 1.0.
   */
  recencyWeight: number;
}

export const DEFAULT_HYBRID_RANKING_CONFIG: HybridRankingConfig = {
  exactUsernameBoost: 100,
  prefixMatchBoost: 30,
  profileCompletenessBoost: 10,
  recencyWeight: 1.0,
};

export interface ChannelRankItem {
  userId: string;
  score: number;
  rank: number;
}

export interface FusedCandidate {
  userId: string;
  fusedScore: number;
  lexicalScore?: number;
  lexicalRank?: number;
  semanticScore?: number;
  semanticRank?: number;
}
