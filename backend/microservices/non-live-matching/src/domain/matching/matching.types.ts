import { Candidate } from '../candidate/candidate.types';

export interface MatchingContext {
  userId: string;
  preferences: {
    preferredGender?: string | null;
    minAge: number;
    maxAge: number;
  };
  userInterests: string[];
  zodiacSign?: string;
  events: string[];
}

export interface MatchingStrategy {
  name: string;
  weight: number;
  score(context: MatchingContext, candidate: Candidate): number;
}
