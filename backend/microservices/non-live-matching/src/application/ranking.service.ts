import { MatchingContext, MatchingStrategy } from '../domain/matching/matching.types';
import { Candidate } from '../domain/candidate/candidate.types';
import { CandidateScore } from '../domain/scoring/score.types';
import { ScoreCombiner } from '../domain/scoring/score.combiner';

export class RankingService {
  constructor(private strategies: MatchingStrategy[]) {}

  public rankCandidates(context: MatchingContext, candidates: Candidate[]): CandidateScore[] {
    const weights: Record<string, number> = {};
    this.strategies.forEach(s => weights[s.name] = s.weight);

    const scored = candidates.map(candidate => {
      const strategyScores: Record<string, number> = {};
      let isHardRejected = false;
      
      for (const strategy of this.strategies) {
        const score = strategy.score(context, candidate);
        strategyScores[strategy.name] = score;
        
        // Example: If a strategy returns strictly 0 (like custom preference mismatch),
        // we heavily penalize the total score, or consider it a soft-rejection.
        if (score === 0 && strategy.name === 'CUSTOM_PREFERENCE') {
          isHardRejected = true;
        }
      }

      const totalScore = isHardRejected ? 0 : ScoreCombiner.combine(strategyScores, weights);

      return {
        candidateId: candidate.id,
        totalScore,
        strategyScores
      };
    });

    // Filter out absolutely rejected candidates (score === 0) and sort descending
    return scored
      .filter(s => s.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }
}
