import { TextAnalyzer } from './text.analyzer';

export class OpenSearchQueryBuilder {
  /**
   * Constructs production OpenSearch multi-field lexical search DSL.
   * Enforces Section 46: Backend constructs OpenSearch queries from typed internal objects.
   */
  public static buildLexicalQuery(rawQuery: string): object {
    const normalized = TextAnalyzer.normalizeText(rawQuery);
    const tokens = TextAnalyzer.tokenize(rawQuery);
    const expandedTokens = TextAnalyzer.expandSynonyms(tokens);

    return {
      query: {
        bool: {
          should: [
            // 1. Exact username match (Top priority)
            {
              term: {
                'username.keyword': {
                  value: normalized,
                  boost: 10.0,
                },
              },
            },
            // 2. Prefix username match (Autocomplete typeahead)
            {
              prefix: {
                'username.keyword': {
                  value: normalized,
                  boost: 5.0,
                },
              },
            },
            // 3. Multi-field match with typo-tolerance across analyzed fields
            {
              multi_match: {
                query: normalized,
                fields: [
                  'username^4',
                  'displayName^3',
                  'interests^2.5',
                  'bio^1.0',
                  'canonicalText^1.0',
                ],
                fuzziness: normalized.length >= 4 ? 'AUTO' : 0,
                operator: 'or',
              },
            },
            // 4. Synonym expansion clauses
            ...expandedTokens
              .filter((token) => token !== normalized)
              .map((synonym) => ({
                multi_match: {
                  query: synonym,
                  fields: ['interests^2.0', 'bio^1.0', 'canonicalText^1.0'],
                  boost: 1.5,
                },
              })),
          ],
          minimum_should_match: 1,
        },
      },
    };
  }
}
