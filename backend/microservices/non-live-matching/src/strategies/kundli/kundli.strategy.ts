import { MatchingStrategy, MatchingContext } from '../../domain/matching/matching.types';
import { Candidate } from '../../domain/candidate/candidate.types';

export class KundliStrategy implements MatchingStrategy {
  name = 'KUNDLI_COMPATIBILITY';
  weight = 0.2; // 20% of total score

  // Basic zodiac compatibility map
  private compatibilityMap: Record<string, string[]> = {
    'Aries': ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
    'Taurus': ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
    'Gemini': ['Libra', 'Aquarius', 'Aries', 'Leo'],
    'Cancer': ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
    'Leo': ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
    'Virgo': ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
    'Libra': ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
    'Scorpio': ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
    'Sagittarius': ['Aries', 'Leo', 'Libra', 'Aquarius'],
    'Capricorn': ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
    'Aquarius': ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
    'Pisces': ['Cancer', 'Scorpio', 'Taurus', 'Capricorn']
  };

  score(context: MatchingContext, candidate: Candidate): number {
    // If exact kundli points are provided (e.g., Ashtakoot Milan out of 36)
    if (candidate.kundliScore !== undefined) {
      return Math.min(Math.max(candidate.kundliScore / 36.0, 0), 1);
    }

    // Fallback to basic Zodiac matching
    if (!context.zodiacSign || !candidate.zodiacSign) {
      return 0.5; // Neutral
    }

    const highlyCompatible = this.compatibilityMap[context.zodiacSign] || [];
    if (highlyCompatible.includes(candidate.zodiacSign)) {
      return 1.0;
    }
    
    if (context.zodiacSign === candidate.zodiacSign) {
      return 0.8;
    }

    return 0.3; // Low compatibility
  }
}
