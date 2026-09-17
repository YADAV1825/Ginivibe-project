import type { FusedCandidate, HybridRankingConfig } from './hybrid.types';
import { DEFAULT_HYBRID_RANKING_CONFIG } from './hybrid.types';

export interface RankableProfile {
  userId: string;
  username: string;
  displayName: string;
  bio?: string | null;
  profilePic?: string | null;
  interests?: string[];
  createdAt?: Date | string;
  lastSeenAt?: Date | string | null;
}

export interface RankedHybridResult {
  userId: string;
  finalScore: number;
  fusedScore: number;
  signals: {
    exactUsernameMatch: boolean;
    prefixMatch: boolean;
    profileCompletenessScore: number;
    recencyBoost: number;
  };
  breakdown: {
    lexicalScore?: number;
    lexicalRank?: number;
    semanticScore?: number;
    semanticRank?: number;
  };
}

export class HybridRanker {
  private readonly config: HybridRankingConfig;

  constructor(config: Partial<HybridRankingConfig> = {}) {
    this.config = { ...DEFAULT_HYBRID_RANKING_CONFIG, ...config };
  }

  /**
   * Re-ranks fused candidates using business relevance signals:
   * exact username match, prefix match, profile completeness, and recency tie-breaking.
   */
  public rerank(
    query: string,
    fusedCandidates: FusedCandidate[],
    profiles: Map<string, RankableProfile>
  ): RankedHybridResult[] {
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    const ranked: RankedHybridResult[] = [];

    for (const fused of fusedCandidates) {
      const profile = profiles.get(fused.userId);
      if (!profile) continue;

      const normUsername = profile.username.toLowerCase();
      const normDisplayName = profile.displayName.toLowerCase();

      // 1. Exact username match signal
      const exactUsernameMatch = normUsername === normalizedQuery;

      // 2. Prefix match signal
      const prefixMatch =
        !exactUsernameMatch &&
        (normUsername.startsWith(normalizedQuery) || normDisplayName.startsWith(normalizedQuery));

      // 3. Profile completeness score (avatar + bio + interests)
      let completenessPoints = 0;
      if (profile.profilePic) completenessPoints += 0.4;
      if (profile.bio && profile.bio.trim().length >= 10) completenessPoints += 0.3;
      if (profile.interests && profile.interests.length > 0) completenessPoints += 0.3;
      const profileCompletenessScore = completenessPoints * this.config.profileCompletenessBoost;

      // 4. Recency / activity tie-breaker
      let recencyBoost = 0;
      if (profile.lastSeenAt) {
        const lastSeenMs = new Date(profile.lastSeenAt).getTime();
        const daysSinceSeen = (now - lastSeenMs) / (1000 * 60 * 60 * 24);
        if (daysSinceSeen < 7) {
          recencyBoost = this.config.recencyWeight * Math.max(0, 1 - daysSinceSeen / 7);
        }
      }

      // Compute total calibrated score
      // Scale fused score to 100-base
      let finalScore = fused.fusedScore * 100;

      if (exactUsernameMatch) {
        finalScore += this.config.exactUsernameBoost;
      } else if (prefixMatch) {
        finalScore += this.config.prefixMatchBoost;
      }

      finalScore += profileCompletenessScore;
      finalScore += recencyBoost;

      ranked.push({
        userId: fused.userId,
        finalScore: Math.round(finalScore * 100) / 100,
        fusedScore: Math.round(fused.fusedScore * 1000) / 1000,
        signals: {
          exactUsernameMatch,
          prefixMatch,
          profileCompletenessScore: Math.round(profileCompletenessScore * 10) / 10,
          recencyBoost: Math.round(recencyBoost * 100) / 100,
        },
        breakdown: {
          lexicalScore: fused.lexicalScore,
          lexicalRank: fused.lexicalRank,
          semanticScore: fused.semanticScore,
          semanticRank: fused.semanticRank,
        },
      });
    }

    // Sort descending by finalScore
    ranked.sort((a, b) => b.finalScore - a.finalScore);

    return ranked;
  }
}

export const defaultHybridRanker = new HybridRanker();
