import type { SearchFilters } from './search.types';

export const ALLOWED_GENDERS = new Set(['male', 'female', 'non-binary', 'other']);

export const ALLOWED_ZODIAC_SIGNS = new Set([
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
]);

const FORBIDDEN_KEYS = new Set([
  'field',
  'value',
  'sql',
  'select',
  'password',
  'passwordhash',
  'email',
  'token',
  'where',
]);

export interface FilterValidationResult {
  filters: SearchFilters;
  error?: string;
}

export class FilterValidator {
  /**
   * Calculates ISO date boundaries for age range filtering against DOB.
   */
  public static calculateDobBounds(
    ageMin?: number,
    ageMax?: number
  ): { earliestDob?: string; latestDob?: string } {
    const now = new Date();
    let earliestDob: string | undefined;
    let latestDob: string | undefined;

    if (ageMax !== undefined) {
      // Earliest birth date for someone of ageMax: (now - ageMax - 1 year)
      const earliest = new Date(
        Date.UTC(now.getUTCFullYear() - ageMax - 1, now.getUTCMonth(), now.getUTCDate())
      );
      earliestDob = earliest.toISOString();
    }

    if (ageMin !== undefined) {
      // Latest birth date for someone of ageMin: (now - ageMin years)
      const latest = new Date(
        Date.UTC(
          now.getUTCFullYear() - ageMin,
          now.getUTCMonth(),
          now.getUTCDate(),
          23,
          59,
          59,
          999
        )
      );
      latestDob = latest.toISOString();
    }

    return { earliestDob, latestDob };
  }

  /**
   * Validates and parses query parameters into a strongly-typed SearchFilters object.
   * Enforces Section 5 (Explicit allowlists) and Section 32 (Input validation).
   */
  public static validateAndParse(queryParams: Record<string, any>): FilterValidationResult {
    const filters: SearchFilters = {};

    // 1. Security Invariant: Detect and reject arbitrary field injection attempts
    for (const key of Object.keys(queryParams)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
        return {
          filters: {},
          error: `Forbidden parameter "${key}". Arbitrary field filters are strictly prohibited.`,
        };
      }
    }

    // 2. Validate Gender
    if (queryParams.gender !== undefined) {
      if (typeof queryParams.gender !== 'string') {
        return { filters: {}, error: 'Gender filter must be a string.' };
      }
      const normGender = queryParams.gender.trim().toLowerCase();
      if (!ALLOWED_GENDERS.has(normGender)) {
        return {
          filters: {},
          error: `Invalid gender "${queryParams.gender}". Allowed values: ${Array.from(ALLOWED_GENDERS).join(', ')}.`,
        };
      }
      filters.gender = normGender;
    }

    // 3. Validate Zodiac Sign
    if (queryParams.zodiacSign !== undefined) {
      if (typeof queryParams.zodiacSign !== 'string') {
        return { filters: {}, error: 'Zodiac sign filter must be a string.' };
      }
      const normZodiac = queryParams.zodiacSign.trim().toLowerCase();
      if (!ALLOWED_ZODIAC_SIGNS.has(normZodiac)) {
        return {
          filters: {},
          error: `Invalid zodiac sign "${queryParams.zodiacSign}". Allowed values: ${Array.from(ALLOWED_ZODIAC_SIGNS).join(', ')}.`,
        };
      }
      filters.zodiacSign = normZodiac;
    }

    // 4. Validate Age Range
    let ageMin: number | undefined;
    let ageMax: number | undefined;

    if (queryParams.ageMin !== undefined) {
      const parsed = parseInt(String(queryParams.ageMin), 10);
      if (isNaN(parsed) || parsed < 18 || parsed > 99) {
        return { filters: {}, error: 'ageMin must be an integer between 18 and 99.' };
      }
      ageMin = parsed;
    }

    if (queryParams.ageMax !== undefined) {
      const parsed = parseInt(String(queryParams.ageMax), 10);
      if (isNaN(parsed) || parsed < 18 || parsed > 99) {
        return { filters: {}, error: 'ageMax must be an integer between 18 and 99.' };
      }
      ageMax = parsed;
    }

    if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
      return {
        filters: {},
        error: `Invalid age range: ageMin (${ageMin}) cannot be greater than ageMax (${ageMax}).`,
      };
    }

    if (ageMin !== undefined) filters.ageMin = ageMin;
    if (ageMax !== undefined) filters.ageMax = ageMax;

    // 5. Validate Interests
    if (queryParams.interests !== undefined) {
      let rawInterests: string[] = [];
      if (typeof queryParams.interests === 'string') {
        rawInterests = queryParams.interests.split(',');
      } else if (Array.isArray(queryParams.interests)) {
        rawInterests = queryParams.interests.map(String);
      } else {
        return { filters: {}, error: 'Interests filter must be a string or array.' };
      }

      const sanitizedInterests = rawInterests
        .map((i) => i.replace(/[\x00-\x1F\x7F]/g, '').trim())
        .filter((i) => i.length >= 2 && i.length <= 50);

      if (sanitizedInterests.length > 10) {
        return { filters: {}, error: 'Maximum of 10 interest filters allowed.' };
      }

      if (sanitizedInterests.length > 0) {
        filters.interests = sanitizedInterests;
      }
    }

    return { filters };
  }
}
