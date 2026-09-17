import { createHash } from 'crypto';
import type { ProjectionBuildInput, SearchProjectionDocument } from './projection.types';

export const PROJECTION_VERSION = 1;

export class CanonicalTextBuilder {
  /**
   * Deterministically builds canonical profile text following Section 41.
   */
  public static build(fields: {
    displayName: string;
    username: string;
    bio?: string | null;
    interests?: string[];
    zodiacSign?: string | null;
    gender?: string | null;
  }): string {
    const lines: string[] = [];

    lines.push(`Name: ${fields.displayName.trim()}`);
    lines.push(`Username: ${fields.username.trim()}`);

    if (fields.bio && fields.bio.trim()) {
      // Normalize internal whitespace
      const normalizedBio = fields.bio.replace(/\s+/g, ' ').trim();
      lines.push(`Bio: ${normalizedBio}`);
    }

    if (fields.interests && fields.interests.length > 0) {
      const normalizedInterests = Array.from(new Set(fields.interests.map((i) => i.trim())))
        .filter(Boolean)
        .sort();
      lines.push(`Interests: ${normalizedInterests.join(', ')}`);
    }

    if (fields.zodiacSign && fields.zodiacSign.trim()) {
      lines.push(`Zodiac: ${fields.zodiacSign.trim()}`);
    }

    if (fields.gender && fields.gender.trim()) {
      lines.push(`Gender: ${fields.gender.trim()}`);
    }

    return lines.join('\n');
  }
}

export class SearchProjectionBuilder {
  /**
   * Computes a SHA-256 content hash for change detection and cost control (Section 50).
   */
  public static computeContentHash(canonicalText: string): string {
    return createHash('sha256').update(canonicalText, 'utf8').digest('hex');
  }

  /**
   * Transforms raw PostgreSQL User record into an approved, sanitized SearchProjectionDocument.
   * Enforces strict allowlist projection (Section 5).
   */
  public static build(raw: any): SearchProjectionDocument {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid user object provided to SearchProjectionBuilder');
    }

    if (!raw.id || !raw.username) {
      throw new Error('User id and username are required for SearchProjectionDocument');
    }

    // Strict Security Invariant: Detect and reject secrets
    if ('password' in raw && raw.password) {
      throw new Error('SECURITY VIOLATION: Password hash detected in projection builder input!');
    }

    // Format display name
    const firstName = raw.firstName ? String(raw.firstName).trim() : null;
    const lastName = raw.lastName ? String(raw.lastName).trim() : null;
    const displayName = [firstName, lastName].filter(Boolean).join(' ') || raw.username.trim();

    // Normalize interests array
    let interests: string[] = [];
    if (Array.isArray(raw.interests)) {
      interests = raw.interests
        .map((item: any) => {
          if (typeof item === 'string') return item.trim();
          if (item && item.subInterest && typeof item.subInterest.name === 'string') {
            return item.subInterest.name.trim();
          }
          return '';
        })
        .filter(Boolean);
    }
    // Deduplicate and sort
    interests = Array.from(new Set(interests)).sort();

    const bio = raw.bio ? String(raw.bio).trim() : null;
    const profilePic = raw.profilePic ? String(raw.profilePic).trim() : null;
    const gender = raw.gender ? String(raw.gender).trim() : null;
    const zodiacSign = raw.zodiacSign ? String(raw.zodiacSign).trim() : null;
    const dob = raw.dob ? String(raw.dob).trim() : null;

    // Generate canonical text
    const canonicalText = CanonicalTextBuilder.build({
      displayName,
      username: raw.username,
      bio,
      interests,
      zodiacSign,
      gender,
    });

    // Generate content hash
    const contentHash = this.computeContentHash(canonicalText);

    return {
      userId: raw.id,
      username: raw.username.trim(),
      displayName,
      firstName,
      lastName,
      bio,
      profilePic,
      gender,
      zodiacSign,
      dob,
      interests,
      canonicalText,
      contentHash,
      projectionVersion: PROJECTION_VERSION,
      indexedAt: new Date().toISOString(),
    };
  }
}
