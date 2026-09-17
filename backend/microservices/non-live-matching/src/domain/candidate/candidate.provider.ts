import { Candidate } from './candidate.types';

export interface CandidateProvider {
  /**
   * Retrieves a pool of active, potentially eligible candidates.
   */
  getEligibleCandidates(limit: number): Promise<Candidate[]>;
}
