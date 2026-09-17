import { CandidateProvider } from '../../../domain/candidate/candidate.provider';
import { Candidate } from '../../../domain/candidate/candidate.types';
import { prisma } from '../client';

export class PostgresCandidateRepository implements CandidateProvider {
  async getEligibleCandidates(limit: number): Promise<Candidate[]> {
    // For V1, we fetch a simple slice of active users.
    // In a mature system, this would be heavily optimized (e.g., geospatial bounds)
    const users = await prisma.user.findMany({
      take: limit,
      include: {
        interests: {
          include: { subInterest: true }
        }
      }
    });

    return users.map(user => ({
      id: user.id,
      gender: user.gender,
      dob: user.dob ? new Date(user.dob) : null,
      interests: user.interests.map(i => i.subInterest.name),
      kundliScore: undefined, // Evaluated post-fetch or passed via context
      zodiacSign: user.zodiacSign || undefined,
      events: [] // Placeholders for later integration
    }));
  }
}
