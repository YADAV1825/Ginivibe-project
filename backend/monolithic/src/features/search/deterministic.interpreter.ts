import type { SearchIntent, UserContext, InterpretationResult, SearchQueryInterpreter } from './intent.types';
import { FilterValidator } from './filter.validator';

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /system\s+prompt/gi,
  /reveal\s+(all\s+)?(passwords?|secrets?|tokens?|keys?)/gi,
  /drop\s+table/gi,
  /select\s+\*\s+from/gi,
  /union\s+select/gi,
];

const STOP_PHRASES = [
  /\bfind\s+(me\s+)?(people|users|friends|someone|profiles)?\b/gi,
  /\blooking\s+for\b/gi,
  /\bsearch\s+for\b/gi,
  /\bwho\s+(are|is|love|likes|enjoy)\b/gi,
  /\bpeople\s+(who|with)\b/gi,
  /\bpeople\b/gi,
  /\busers\b/gi,
  /\baround\b/gi,
];

const KNOWN_INTERESTS: Record<string, string> = {
  photography: 'photography',
  photographer: 'photography',
  photo: 'photography',
  photos: 'photography',
  travel: 'travel',
  traveling: 'travel',
  traveler: 'travel',
  hiking: 'hiking',
  hike: 'hiking',
  trekking: 'hiking',
  trek: 'hiking',
  mountains: 'hiking',
  code: 'software',
  coding: 'software',
  coder: 'software',
  developer: 'software',
  programming: 'software',
  typescript: 'software',
  music: 'music',
  musician: 'music',
  guitar: 'music',
  fitness: 'fitness',
  gym: 'fitness',
  workout: 'fitness',
  yoga: 'fitness',
  gaming: 'gaming',
  gamer: 'gaming',
  investing: 'finance',
  finance: 'finance',
};

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

export class DeterministicQueryInterpreter implements SearchQueryInterpreter {
  public async interpret(rawQuery: string, context?: UserContext): Promise<InterpretationResult> {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return {
        intent: {},
        source: 'deterministic',
      };
    }

    // 1. Sanitize input & neutralize prompt injection attempts
    let workingText = rawQuery.trim().slice(0, 200);
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      workingText = workingText.replace(pattern, ' ');
    }

    const intent: SearchIntent = {};
    let confidence = 0.5;

    // 2. Extract Age Patterns
    // 2a. "in their 20s" / "in 30s"
    const decadeMatch = workingText.match(/\bin\s+(their\s+)?(\d0)s\b/i);
    if (decadeMatch) {
      const decade = parseInt(decadeMatch[2], 10);
      if (decade >= 10 && decade <= 90) {
        intent.ageMin = Math.max(18, decade);
        intent.ageMax = decade + 9;
        workingText = workingText.replace(decadeMatch[0], ' ');
        confidence += 0.15;
      }
    }

    // 2b. "between X and Y" / "from X to Y"
    const rangeMatch = workingText.match(/\b(between|from)\s+(\d{2})\s+(and|to)\s+(\d{2})\b/i);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[2], 10);
      const max = parseInt(rangeMatch[4], 10);
      if (min <= max) {
        intent.ageMin = Math.max(18, Math.min(99, min));
        intent.ageMax = Math.max(18, Math.min(99, max));
        workingText = workingText.replace(rangeMatch[0], ' ');
        confidence += 0.2;
      }
    }

    // 2c. "around my age" (contextual)
    if (/\baround\s+my\s+age\b/i.test(workingText)) {
      if (context?.userAge && context.userAge >= 18) {
        intent.ageMin = Math.max(18, context.userAge - 3);
        intent.ageMax = Math.min(99, context.userAge + 3);
        workingText = workingText.replace(/\baround\s+my\s+age\b/i, ' ');
        confidence += 0.2;
      }
    }

    // 2d. "around age X" / "around X" (when followed by years/years old or standalone 2-digit)
    const aroundMatch = workingText.match(/\baround\s+(age\s+)?(\d{2})\b/i);
    if (aroundMatch && !intent.ageMin) {
      const centerAge = parseInt(aroundMatch[2], 10);
      if (centerAge >= 18 && centerAge <= 99) {
        intent.ageMin = Math.max(18, centerAge - 3);
        intent.ageMax = Math.min(99, centerAge + 3);
        workingText = workingText.replace(aroundMatch[0], ' ');
        confidence += 0.15;
      }
    }

    // 2e. "older than X" / "over X"
    const olderMatch = workingText.match(/\b(older\s+than|over|above)\s+(\d{2})\b/i);
    if (olderMatch && !intent.ageMin) {
      const age = parseInt(olderMatch[2], 10);
      intent.ageMin = Math.max(18, Math.min(99, age + 1));
      intent.ageMax = 99;
      workingText = workingText.replace(olderMatch[0], ' ');
      confidence += 0.15;
    }

    // 2f. "younger than X" / "under X"
    const youngerMatch = workingText.match(/\b(younger\s+than|under|below)\s+(\d{2})\b/i);
    if (youngerMatch && !intent.ageMax) {
      const age = parseInt(youngerMatch[2], 10);
      intent.ageMin = 18;
      intent.ageMax = Math.max(18, Math.min(99, age - 1));
      workingText = workingText.replace(youngerMatch[0], ' ');
      confidence += 0.15;
    }

    // 3. Extract Genders
    if (/\b(women|woman|female|females|girls?)\b/i.test(workingText)) {
      intent.gender = 'female';
      workingText = workingText.replace(/\b(women|woman|female|females|girls?)\b/gi, ' ');
      confidence += 0.15;
    } else if (/\b(men|man|male|males|guys?)\b/i.test(workingText)) {
      intent.gender = 'male';
      workingText = workingText.replace(/\b(men|man|male|males|guys?)\b/gi, ' ');
      confidence += 0.15;
    } else if (/\b(non-binary|nonbinary)\b/i.test(workingText)) {
      intent.gender = 'non-binary';
      workingText = workingText.replace(/\b(non-binary|nonbinary)\b/gi, ' ');
      confidence += 0.15;
    }

    // 4. Extract Zodiac Signs
    for (const sign of ZODIAC_SIGNS) {
      const regex = new RegExp(`\\b${sign}\\b`, 'i');
      if (regex.test(workingText)) {
        intent.zodiacSign = sign;
        workingText = workingText.replace(regex, ' ');
        confidence += 0.15;
        break;
      }
    }

    // 5. Extract Domain Interests
    const extractedInterests = new Set<string>();
    for (const [trigger, standard] of Object.entries(KNOWN_INTERESTS)) {
      const regex = new RegExp(`\\b${trigger}\\b`, 'i');
      if (regex.test(workingText)) {
        extractedInterests.add(standard);
        confidence += 0.1;
      }
    }
    if (extractedInterests.size > 0) {
      intent.interests = Array.from(extractedInterests);
    }

    // 6. Clean Residual Free Text
    for (const stop of STOP_PHRASES) {
      workingText = workingText.replace(stop, ' ');
    }

    const residual = workingText.replace(/\s+/g, ' ').trim();
    if (residual.length >= 2) {
      intent.text = residual;
    }

    intent.confidence = Math.min(1.0, Math.round(confidence * 100) / 100);

    return {
      intent,
      source: 'deterministic',
    };
  }
}

export const deterministicInterpreter = new DeterministicQueryInterpreter();
