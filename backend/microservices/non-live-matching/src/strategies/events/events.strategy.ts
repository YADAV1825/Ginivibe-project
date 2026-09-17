import { MatchingStrategy, MatchingContext } from '../../domain/matching/matching.types';
import { Candidate } from '../../domain/candidate/candidate.types';

export class EventsStrategy implements MatchingStrategy {
  name = 'EVENT_OVERLAP';
  weight = 0.1; // 10% of total score

  score(context: MatchingContext, candidate: Candidate): number {
    if (!context.events.length || !candidate.events.length) {
      return 0.0; // No score boost if neither attends events
    }

    const intersection = context.events.filter(eventId => 
      candidate.events.includes(eventId)
    );

    if (intersection.length > 0) {
      // Base boost of 0.5 for having at least 1 overlapping event, plus more for multiple
      return Math.min(0.5 + (intersection.length * 0.1), 1.0);
    }

    return 0.0;
  }
}
