import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import { searchService } from './search.service';
import { FilterValidator } from './filter.validator';

const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export class SearchController {
  public static async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    const requesterId = req.userId;
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    // 1. Validate Level 5 Structured Filters
    const filterValidation = FilterValidator.validateAndParse(req.query);
    if (filterValidation.error) {
      return res.status(400).json({ error: filterValidation.error });
    }
    const filters = filterValidation.filters;

    // 2. Validate free-text query or natural language query (optional if filters are supplied)
    const rawQuery = (req.query.q || req.query.query) as string | undefined;
    let trimmedQuery: string | undefined;

    if (rawQuery !== undefined) {
      if (typeof rawQuery !== 'string') {
        return res.status(400).json({ error: 'Search query parameter "q" must be a string.' });
      }
      trimmedQuery = rawQuery.trim();

      if (trimmedQuery.length > 0) {
        if (trimmedQuery.length < 2 || trimmedQuery.length > 50) {
          return res.status(400).json({
            error: 'Search query must be between 2 and 50 characters.',
          });
        }

        if (CONTROL_CHARS_REGEX.test(trimmedQuery)) {
          return res.status(400).json({
            error: 'Search query contains invalid characters.',
          });
        }
      } else {
        trimmedQuery = undefined;
      }
    }

    // 2b. Level 8 Natural Language Query (nlq)
    const rawNlq = req.query.nlq as string | undefined;
    let trimmedNlq: string | undefined;
    if (rawNlq !== undefined) {
      if (typeof rawNlq !== 'string') {
        return res.status(400).json({ error: 'Natural language query parameter "nlq" must be a string.' });
      }
      trimmedNlq = rawNlq.trim();
      if (trimmedNlq.length < 2 || trimmedNlq.length > 200) {
        return res.status(400).json({
          error: 'Natural language query must be between 2 and 200 characters.',
        });
      }
      if (CONTROL_CHARS_REGEX.test(trimmedNlq)) {
        return res.status(400).json({
          error: 'Natural language query contains invalid characters.',
        });
      }
    }

    const isUnderstand = req.query.understand === 'true' || req.query.understand === '1';

    // Require either a query string, nlq, or at least one structured filter
    if (!trimmedQuery && !trimmedNlq && Object.keys(filters).length === 0) {
      return res.status(400).json({
        error: 'At least one search query ("q" / "nlq") or structured filter parameter must be provided.',
      });
    }

    let limit: number | undefined;
    if (req.query.limit !== undefined) {
      const parsedLimit = parseInt(req.query.limit as string, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return res.status(400).json({
          error: 'Limit must be an integer between 1 and 50.',
        });
      }
      limit = parsedLimit;
    }

    const rawMode = req.query.mode || req.query.searchMode;
    let searchMode: 'lexical' | 'semantic' | 'hybrid' | undefined;
    if (rawMode !== undefined) {
      if (typeof rawMode !== 'string' || !['lexical', 'semantic', 'hybrid'].includes(rawMode.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid search mode. Allowed modes are: lexical, semantic, hybrid.',
        });
      }
      searchMode = rawMode.toLowerCase() as 'lexical' | 'semantic' | 'hybrid';
    }

    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

    try {
      const searchResponse = await searchService.searchUsers(requesterId, {
        q: trimmedQuery,
        nlq: trimmedNlq,
        understand: isUnderstand,
        filters,
        limit,
        cursor,
        searchMode,
      });

      return res.json(searchResponse);
    } catch (err: any) {
      if (err.message === 'INVALID_CURSOR') {
        return res.status(400).json({ error: 'Invalid or malformed pagination cursor.' });
      }

      console.error('[SearchController] Search error:', err);
      return res.status(500).json({ error: 'Failed to execute search.' });
    }
  }

  private static parseEntityQuery(req: AuthRequest): { query?: string; limit?: number; cursor?: string; error?: string } {
    const rawQuery = (req.query.q || req.query.query) as string | undefined;
    if (rawQuery === undefined || typeof rawQuery !== 'string') {
      return { error: 'Search query parameter "q" is required.' };
    }
    const query = rawQuery.trim();
    if (query.length < 2 || query.length > 50) {
      return { error: 'Search query must be between 2 and 50 characters.' };
    }
    if (CONTROL_CHARS_REGEX.test(query)) {
      return { error: 'Search query contains invalid characters.' };
    }
    let limit = 20;
    if (req.query.limit !== undefined) {
      const parsed = parseInt(req.query.limit as string, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 50) {
        return { error: 'Limit must be an integer between 1 and 50.' };
      }
      limit = parsed;
    }
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    return { query, limit, cursor };
  }

  public static async searchPosts(req: AuthRequest, res: Response): Promise<Response> {
    const requesterId = req.userId;
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const parsed = SearchController.parseEntityQuery(req);
    if (parsed.error || !parsed.query) {
      return res.status(400).json({ error: parsed.error || 'Invalid query.' });
    }
    try {
      const response = await searchService.searchPosts(requesterId, parsed.query, parsed.limit ?? 20, parsed.cursor);
      return res.json(response);
    } catch (err: any) {
      if (err.message === 'INVALID_CURSOR') {
        return res.status(400).json({ error: 'Invalid or malformed pagination cursor.' });
      }
      console.error('[SearchController] Post search error:', err);
      return res.status(500).json({ error: 'Failed to execute search.' });
    }
  }

  public static async searchCommunities(req: AuthRequest, res: Response): Promise<Response> {
    const requesterId = req.userId;
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }
    const parsed = SearchController.parseEntityQuery(req);
    if (parsed.error || !parsed.query) {
      return res.status(400).json({ error: parsed.error || 'Invalid query.' });
    }
    try {
      const response = await searchService.searchCommunities(requesterId, parsed.query, parsed.limit ?? 20);
      return res.json(response);
    } catch (err: any) {
      console.error('[SearchController] Community search error:', err);
      return res.status(500).json({ error: 'Failed to execute search.' });
    }
  }

  public static async autocompleteUsers(req: AuthRequest, res: Response): Promise<Response> {
    const requesterId = req.userId;
    if (!requesterId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    const rawQuery = (req.query.q || req.query.query) as string | undefined;
    if (!rawQuery || typeof rawQuery !== 'string') {
      return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }

    const trimmedQuery = rawQuery.trim();
    if (trimmedQuery.length < 2 || trimmedQuery.length > 50) {
      return res.json([]);
    }

    if (CONTROL_CHARS_REGEX.test(trimmedQuery)) {
      return res.status(400).json({ error: 'Search query contains invalid characters.' });
    }

    let limit = 10;
    if (req.query.limit !== undefined) {
      const parsed = parseInt(req.query.limit as string, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
        limit = parsed;
      }
    }

    try {
      const suggestions = await searchService.autocompleteUsers(requesterId, trimmedQuery, limit);
      return res.json(suggestions);
    } catch (err: any) {
      console.error('[SearchController] Autocomplete error:', err);
      return res.status(500).json({ error: 'Failed to fetch suggestions.' });
    }
  }
}
