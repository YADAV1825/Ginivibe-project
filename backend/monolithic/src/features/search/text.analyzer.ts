const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// Section 42: Controlled, versioned domain synonyms
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  photo: ['photography', 'photographer'],
  photography: ['photographer', 'photo'],
  photographer: ['photography'],
  hiking: ['trekking', 'hiker'],
  trekking: ['hiking'],
  coder: ['developer', 'software engineering'],
  dev: ['software engineering', 'developer', 'software'],
  developer: ['software engineering', 'software'],
  tech: ['technology'],
  technology: ['tech'],
  invest: ['investing', 'finance', 'stock market'],
  investing: ['finance', 'investment'],
  gaming: ['gamer', 'games'],
  gamer: ['gaming'],
  fitness: ['wellness', 'yoga', 'meditation'],
  wellness: ['fitness', 'mental health'],
  cat: ['kitty', 'kitten', 'feline'],
  kitty: ['cat', 'kitten'],
  kitten: ['cat', 'kitty'],
  feline: ['cat'],
  dog: ['puppy', 'pup', 'canine'],
  puppy: ['dog', 'pup'],
  pup: ['puppy', 'dog'],
  canine: ['dog'],
  pet: ['pets', 'animal'],
  pets: ['pet', 'animals'],
};

export class TextAnalyzer {
  /**
   * Normalizes raw query text:
   * 1. Strips control characters
   * 2. Applies Unicode NFKD decomposition and removes diacritics (e.g. Café -> Cafe)
   * 3. Lowercases and normalizes whitespace
   */
  public static normalizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    return text
      .replace(CONTROL_CHARS_REGEX, '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenizes text into search tokens, filtering out short or empty tokens.
   */
  public static tokenize(text: string, maxTokens = 5): string[] {
    const normalized = this.normalizeText(text);
    if (!normalized) return [];

    const rawTokens = normalized
      .split(/[^a-z0-9_-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    return Array.from(new Set(rawTokens)).slice(0, maxTokens);
  }

  /**
   * Expands query tokens with controlled domain synonyms (Section 42).
   */
  public static expandSynonyms(tokens: string[]): string[] {
    const expanded = new Set<string>();

    for (const token of tokens) {
      expanded.add(token);
      const synonyms = SYNONYM_DICTIONARY[token];
      if (synonyms) {
        for (const syn of synonyms) {
          expanded.add(this.normalizeText(syn));
        }
      }
    }

    return Array.from(expanded);
  }
}
