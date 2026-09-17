import { PostgresCandidateRepository } from '../infrastructure/postgres/repositories/candidate.repository';
import { PostgresExclusionRepository } from '../infrastructure/postgres/repositories/exclusion.repository';
import { ExclusionService } from './exclusion.service';
import { RankingService } from './ranking.service';
import { CustomPreferenceStrategy } from '../strategies/custom/custom.strategy';
import { PersonalityStrategy } from '../strategies/personality/personality.strategy';
import { KundliStrategy } from '../strategies/kundli/kundli.strategy';
import { EventsStrategy } from '../strategies/events/events.strategy';
import { CandidateScore } from '../domain/scoring/score.types';

export class MatchingApplicationService {
  private candidateRepo = new PostgresCandidateRepository();
  private exclusionRepo = new PostgresExclusionRepository();
  private exclusionService = new ExclusionService();
  private rankingService = new RankingService([
    new CustomPreferenceStrategy(),
    new PersonalityStrategy(),
    new KundliStrategy(),
    new EventsStrategy()
  ]);

  async getNextMatch(userId: string, category?: string, intent?: string, isRetry = false): Promise<CandidateScore | null> {
    const [exclusionContext, matchingContext] = await Promise.all([
      this.exclusionRepo.getExclusionContext(userId),
      this.exclusionRepo.getMatchingContext(userId)
    ]);

    const rawCandidates = await this.candidateRepo.getEligibleCandidates(100);
    const validCandidates = this.exclusionService.applyHardFilters(exclusionContext, rawCandidates);

    if (validCandidates.length === 0) {
      if (!isRetry) {
        await (this.exclusionRepo as any).clearSeen(userId);
        return this.getNextMatch(userId, category, intent, true);
      }
      return null;
    }

    let topCandidate: CandidateScore | null = null;

    if (category === 'ai' && intent) {
      // AI Matching: Ask OpenRouter to pick the best match
      try {
        const candidateProfiles = validCandidates.map(c => {
          const interests = (c as any).interests;
          const tags = Array.isArray(interests)
            ? interests.map((i: any) => typeof i === 'string' ? i : i?.subInterest?.name).filter(Boolean).join(', ')
            : '';
          return `ID: ${c.id}\nGender: ${c.gender}\nBio: ${(c as any).bio || ''}\nTags: ${tags}`;
        }).join('\n---\n');

        const prompt = `You are an AI Matchmaker. 
User Intent: "${intent}"

Available Candidates:
${candidateProfiles}

Analyze the candidates and pick the ONE best ID that matches the user intent. If no one strictly matches, pick the closest one.
Output ONLY the ID string of the chosen candidate and nothing else.`;

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
          console.error('AI Matching skipped: OPENROUTER_API_KEY is not set');
        } else {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`
          },
          body: JSON.stringify({
            model: 'nex-agi/nex-n2.5-pro:free',
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (res.ok) {
          const aiData = await res.json();
          const chosenId = aiData.choices[0].message.content.trim();
          
          const matchedCandidate = validCandidates.find(c => chosenId.includes(c.id));
          if (matchedCandidate) {
            topCandidate = {
              candidateId: matchedCandidate.id,
              totalScore: 0.99,
              strategyScores: { ai: 0.99, custom: 0, personality: 0, kundli: 0, events: 0 }
            };
          }
        }
        }
      } catch (e) {
        console.error("AI Matching failed:", e);
      }
    }

    // Fallback to standard ranking if AI didn't pick or not AI category
    if (!topCandidate) {
      const ranked = this.rankingService.rankCandidates(matchingContext, validCandidates);
      if (ranked.length === 0) {
        if (!isRetry) {
          await (this.exclusionRepo as any).clearSeen(userId);
          return this.getNextMatch(userId, category, intent, true);
        }
        return null;
      }
      topCandidate = ranked[0];
    }

    await this.exclusionRepo.markAsSeen(userId, topCandidate.candidateId);
    return topCandidate;
  }
}
