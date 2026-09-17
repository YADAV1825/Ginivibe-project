import { TextAnalyzer } from './text.analyzer';

export class LexicalScorer {
  /**
   * Computes the Levenshtein edit distance between two strings.
   */
  public static levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    if (m === 0) return n;
    if (n === 0) return m;

    const matrix: number[][] = [];

    for (let i = 0; i <= m; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[m][n];
  }

  /**
   * Evaluates if target word is a fuzzy match for query token within bounded edit distance.
   */
  public static isFuzzyMatch(query: string, target: string): boolean {
    const qLen = query.length;
    const tLen = target.length;
    const maxLen = Math.max(qLen, tLen);

    if (Math.abs(qLen - tLen) > 2) return false;
    if (maxLen < 4) return query === target;

    // Standard Lucene fuzziness: length > 5 allows distance 2, length 4..5 allows distance 1
    const maxAllowedDist = maxLen > 5 ? 2 : 1;
    const dist = this.levenshteinDistance(query, target);
    return dist <= maxAllowedDist;
  }

  /**
   * Calculates multi-field lexical relevance score for a candidate profile.
   */
  public static scoreCandidate(
    normalizedQuery: string,
    tokens: string[],
    candidate: {
      username: string;
      displayName: string;
      bio?: string | null;
      interests?: string[];
    }
  ): number {
    let score = 0;
    const normUsername = TextAnalyzer.normalizeText(candidate.username);
    const normDisplayName = TextAnalyzer.normalizeText(candidate.displayName);
    const normBio = candidate.bio ? TextAnalyzer.normalizeText(candidate.bio) : '';
    const normInterests = (candidate.interests || []).map((i) => TextAnalyzer.normalizeText(i));

    // 1. Exact Identifier Match (Highest priority - Section 4)
    if (normUsername === normalizedQuery) {
      score += 100;
    } else if (normUsername.startsWith(normalizedQuery)) {
      score += 50;
    } else if (normUsername.includes(normalizedQuery)) {
      score += 30;
    }

    // 2. Display Name Match
    if (normDisplayName === normalizedQuery) {
      score += 40;
    } else if (normDisplayName.startsWith(normalizedQuery)) {
      score += 30;
    } else if (normDisplayName.includes(normalizedQuery)) {
      score += 20;
    }

    // 3. Typo-tolerant / Fuzzy matching on username or displayName words
    const nameWords = normDisplayName.split(' ');
    for (const token of tokens) {
      if (this.isFuzzyMatch(token, normUsername)) {
        score += 20;
      }
      for (const w of nameWords) {
        if (this.isFuzzyMatch(token, w)) {
          score += 15;
          break;
        }
      }
    }

    // 4. Interest Matches
    for (const token of tokens) {
      for (const interest of normInterests) {
        if (interest.includes(token)) {
          score += 25;
          break;
        }
      }
    }

    // 5. Bio Analyzed Text Matches
    if (normBio) {
      for (const token of tokens) {
        if (normBio.includes(token)) {
          score += 10;
        }
      }
    }

    return score;
  }
}
