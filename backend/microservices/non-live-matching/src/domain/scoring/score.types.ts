export interface CandidateScore {
  candidateId: string;
  totalScore: number;
  strategyScores: Record<string, number>;
}
