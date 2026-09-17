import type { FusedCandidate, HybridFusionOptions } from './hybrid.types';

export class HybridFusion {
  /**
   * Fuses lexical and semantic retrieval candidate sets into a unified, ranked candidate list.
   */
  public static fuseCandidates(
    lexicalItems: Array<{ userId: string; score: number }>,
    semanticItems: Array<{ userId: string; score: number }>,
    options: HybridFusionOptions = {}
  ): FusedCandidate[] {
    const method = options.method || 'rrf';

    if (method === 'linear') {
      return this.fuseLinear(lexicalItems, semanticItems, options);
    }

    return this.fuseRRF(lexicalItems, semanticItems, options);
  }

  /**
   * Reciprocal Rank Fusion (RRF).
   * RRF(d) = sum_{m in {lexical, semantic}} (w_m / (k + rank_m(d)))
   */
  public static fuseRRF(
    lexicalItems: Array<{ userId: string; score: number }>,
    semanticItems: Array<{ userId: string; score: number }>,
    options: HybridFusionOptions = {}
  ): FusedCandidate[] {
    const k = options.k ?? 60;
    const lexicalWeight = options.lexicalWeight ?? 1.0;
    const semanticWeight = options.semanticWeight ?? 1.0;

    const candidateMap = new Map<string, FusedCandidate>();

    // Sort items by score descending to assign ranks (1-indexed)
    const sortedLexical = [...lexicalItems].sort((a, b) => b.score - a.score);
    const sortedSemantic = [...semanticItems].sort((a, b) => b.score - a.score);

    // Process lexical channel
    sortedLexical.forEach((item, index) => {
      const rank = index + 1;
      const rrfContribution = lexicalWeight / (k + rank);

      candidateMap.set(item.userId, {
        userId: item.userId,
        fusedScore: rrfContribution,
        lexicalScore: item.score,
        lexicalRank: rank,
      });
    });

    // Process semantic channel
    sortedSemantic.forEach((item, index) => {
      const rank = index + 1;
      const rrfContribution = semanticWeight / (k + rank);

      const existing = candidateMap.get(item.userId);
      if (existing) {
        existing.fusedScore += rrfContribution;
        existing.semanticScore = item.score;
        existing.semanticRank = rank;
      } else {
        candidateMap.set(item.userId, {
          userId: item.userId,
          fusedScore: rrfContribution,
          semanticScore: item.score,
          semanticRank: rank,
        });
      }
    });

    const fused = Array.from(candidateMap.values());
    fused.sort((a, b) => b.fusedScore - a.fusedScore);

    return fused;
  }

  /**
   * Normalized Linear Score Combination.
   * Score(d) = alpha * normLexical(d) + (1 - alpha) * normSemantic(d)
   */
  public static fuseLinear(
    lexicalItems: Array<{ userId: string; score: number }>,
    semanticItems: Array<{ userId: string; score: number }>,
    options: HybridFusionOptions = {}
  ): FusedCandidate[] {
    const alpha = Math.max(0.0, Math.min(1.0, options.alpha ?? 0.5));

    // Normalize lexical scores to [0, 1]
    const maxLexical = lexicalItems.reduce((max, i) => Math.max(max, i.score), 0);
    const normLexicalMap = new Map<string, { normScore: number; rawScore: number; rank: number }>();
    const sortedLexical = [...lexicalItems].sort((a, b) => b.score - a.score);

    sortedLexical.forEach((item, index) => {
      const normScore = maxLexical > 0 ? item.score / maxLexical : 0;
      normLexicalMap.set(item.userId, { normScore, rawScore: item.score, rank: index + 1 });
    });

    // Normalize semantic scores to [0, 1] (cosine similarity typically in [-1, 1], normalized to [0, 1])
    const normSemanticMap = new Map<string, { normScore: number; rawScore: number; rank: number }>();
    const sortedSemantic = [...semanticItems].sort((a, b) => b.score - a.score);

    sortedSemantic.forEach((item, index) => {
      // Map cosine similarity [-1, 1] to [0, 1]
      const clamped = Math.max(-1.0, Math.min(1.0, item.score));
      const normScore = (clamped + 1.0) / 2.0;
      normSemanticMap.set(item.userId, { normScore, rawScore: item.score, rank: index + 1 });
    });

    // Collect all candidate IDs
    const allUserIds = new Set<string>([...normLexicalMap.keys(), ...normSemanticMap.keys()]);
    const fused: FusedCandidate[] = [];

    for (const userId of allUserIds) {
      const lex = normLexicalMap.get(userId);
      const sem = normSemanticMap.get(userId);

      const lexNorm = lex ? lex.normScore : 0;
      const semNorm = sem ? sem.normScore : 0;

      const combinedScore = alpha * lexNorm + (1.0 - alpha) * semNorm;

      fused.push({
        userId,
        fusedScore: combinedScore,
        lexicalScore: lex?.rawScore,
        lexicalRank: lex?.rank,
        semanticScore: sem?.rawScore,
        semanticRank: sem?.rank,
      });
    }

    fused.sort((a, b) => b.fusedScore - a.fusedScore);
    return fused;
  }
}
