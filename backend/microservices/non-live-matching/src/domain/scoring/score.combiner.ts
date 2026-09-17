export class ScoreCombiner {
  static combine(strategyScores: Record<string, number>, weights: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [strategyName, score] of Object.entries(strategyScores)) {
      const weight = weights[strategyName] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return totalScore / totalWeight; // Normalized to 0-1
  }
}
