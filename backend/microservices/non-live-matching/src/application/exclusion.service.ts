import { ExclusionContext } from '../domain/exclusion/exclusion.types';
import { Candidate } from '../domain/candidate/candidate.types';

export class ExclusionService {
  /**
   * Filters out candidates that mathematically/socially cannot be matched.
   */
  public applyHardFilters(context: ExclusionContext, candidates: Candidate[]): Candidate[] {
    return candidates.filter(candidate => {
      // 1. Cannot match with self
      if (candidate.id === context.userId) return false;

      // 2. Block rules (Bidirectional)
      if (context.blockedUserIds.has(candidate.id)) return false;
      if (context.blockedByUserIds.has(candidate.id)) return false;

      // 3. Seen rules
      if (context.seenCandidateIds.has(candidate.id)) return false;

      // 4. Social rules (Do not show someone already followed)
      if (context.followingIds.has(candidate.id)) return false;

      return true;
    });
  }
}
