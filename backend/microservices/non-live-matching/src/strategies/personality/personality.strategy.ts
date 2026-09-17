import { MatchingStrategy, MatchingContext } from '../../domain/matching/matching.types';
import { Candidate } from '../../domain/candidate/candidate.types';

export class PersonalityStrategy implements MatchingStrategy {
  name = 'PERSONALITY_INTERESTS';
  weight = 0.3; // 30% of total score

  score(context: MatchingContext, candidate: Candidate): number {
    if (!context.userInterests.length || !candidate.interests.length) {
      return 0.5; // Neutral score if no interests data is available
    }

    const intersection = context.userInterests.filter(interest => 
      candidate.interests.includes(interest)
    );

    // Simple Jaccard similarity
    const union = new Set([...context.userInterests, ...candidate.interests]).size;
    
    if (union === 0) return 0.5;

    return intersection.length / union; // Normalizes between 0.0 and 1.0
  }
}
