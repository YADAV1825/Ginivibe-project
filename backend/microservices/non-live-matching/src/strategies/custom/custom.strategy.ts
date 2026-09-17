import { MatchingStrategy, MatchingContext } from '../../domain/matching/matching.types';
import { Candidate } from '../../domain/candidate/candidate.types';

export class CustomPreferenceStrategy implements MatchingStrategy {
  name = 'CUSTOM_PREFERENCE';
  weight = 0.4; // 40% of total score

  score(context: MatchingContext, candidate: Candidate): number {
    let score = 1.0;
    
    // Gender soft scoring
    if (context.preferences.preferredGender && candidate.gender) {
      if (context.preferences.preferredGender !== candidate.gender) {
        score -= 0.5; // Reduce score instead of 0
      }
    }

    // Age scoring
    if (candidate.dob) {
      const age = this.calculateAge(candidate.dob);
      if (age < context.preferences.minAge || age > context.preferences.maxAge) {
        score -= 0.5; // Reduce score instead of 0
      }
    }

    return Math.max(0.1, score);
  }

  private calculateAge(dob: Date): number {
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  }
}
