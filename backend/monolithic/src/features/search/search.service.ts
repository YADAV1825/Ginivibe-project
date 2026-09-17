import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { TextAnalyzer } from './text.analyzer';
import { LexicalScorer } from './lexical.scorer';
import { FilterValidator } from './filter.validator';
import { CanonicalTextBuilder, SearchProjectionBuilder } from './projection.builder';
import { semanticSearchService } from './semantic.service';
import { HybridFusion } from './hybrid.fusion';
import { defaultHybridRanker, type RankableProfile } from './hybrid.ranker';
import { intentService } from './intent.service';
import type { SearchIntent, UserContext } from './intent.types';
import type {
  SearchQueryOptions,
  UserSearchResponse,
  UserSearchResultDto,
  AutocompleteResultDto,
  DecodedCursor,
  PostSearchResponse,
  PostSearchResultDto,
  CommunitySearchResponse,
  CommunitySearchResultDto,
} from './search.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class SearchService {
  /**
   * Encodes pagination cursor into an opaque base64url string.
   */
  public encodeCursor(item: { id: string; createdAt: Date }): string {
    const payload: DecodedCursor = {
      id: item.id,
      createdAt: item.createdAt.toISOString(),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  /**
   * Decodes an opaque base64url cursor.
   */
  public decodeCursor(cursorStr: string): DecodedCursor | null {
    try {
      const decoded = Buffer.from(cursorStr, 'base64url').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (!parsed || typeof parsed.id !== 'string' || typeof parsed.createdAt !== 'string') {
        return null;
      }
      const date = new Date(parsed.createdAt);
      if (isNaN(date.getTime())) {
        return null;
      }
      return { id: parsed.id, createdAt: date.toISOString() };
    } catch {
      return null;
    }
  }

  /**
   * Retrieves bilateral block user IDs for a given user.
   */
  public async getBilateralBlockedUserIds(requesterId: string): Promise<string[]> {
    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.block.findMany({
        where: { blockerId: requesterId },
        select: { blockedId: true },
      }),
      prisma.block.findMany({
        where: { blockedId: requesterId },
        select: { blockerId: true },
      }),
    ]);

    const excluded = new Set<string>();
    for (const b of blockedByMe) excluded.add(b.blockedId);
    for (const b of blockedMe) excluded.add(b.blockerId);

    return Array.from(excluded);
  }

  /**
   * Executes a multi-field lexical search combined with business-approved structured filters.
   */
  public async searchUsers(
    requesterId: string,
    options: SearchQueryOptions
  ): Promise<UserSearchResponse> {
    let activeFilters = { ...(options.filters || {}) };
    let interpretedIntent: SearchIntent | undefined;
    let effectiveQuery = (options.q || '').trim();

    // 0. Level 8 Natural Language Query Understanding
    const nlqInput = options.nlq || (options.understand ? options.q : undefined);
    if (nlqInput && nlqInput.trim().length >= 2) {
      let userContext: UserContext | undefined;
      try {
        const requesterUser = await prisma.user.findUnique({
          where: { id: requesterId },
          select: { dob: true, gender: true },
        });
        if (requesterUser?.dob) {
          const birthYear = new Date(requesterUser.dob).getFullYear();
          const currentYear = new Date().getFullYear();
          const userAge = currentYear - birthYear;
          if (userAge >= 18 && userAge <= 99) {
            userContext = { userAge, gender: requesterUser.gender || undefined };
          }
        }
      } catch {
        // Non-fatal: context omitted
      }

      const interpretation = await intentService.interpret(nlqInput, userContext);
      interpretedIntent = interpretation.intent;

      // Merge interpreted filters into activeFilters (explicit options.filters take precedence)
      if (interpretedIntent.gender && !activeFilters.gender) {
        activeFilters.gender = interpretedIntent.gender;
      }
      if (interpretedIntent.zodiacSign && !activeFilters.zodiacSign) {
        activeFilters.zodiacSign = interpretedIntent.zodiacSign;
      }
      if (interpretedIntent.ageMin !== undefined && activeFilters.ageMin === undefined) {
        activeFilters.ageMin = interpretedIntent.ageMin;
      }
      if (interpretedIntent.ageMax !== undefined && activeFilters.ageMax === undefined) {
        activeFilters.ageMax = interpretedIntent.ageMax;
      }
      if (interpretedIntent.interests && interpretedIntent.interests.length > 0) {
        activeFilters.interests = Array.from(
          new Set([...(activeFilters.interests || []), ...interpretedIntent.interests])
        );
      }

      if (interpretedIntent.text && !options.q) {
        effectiveQuery = interpretedIntent.text;
      }
    }

    const sanitizedQuery = effectiveQuery;
    const normalizedQuery = TextAnalyzer.normalizeText(sanitizedQuery);
    const tokens = TextAnalyzer.tokenize(sanitizedQuery);
    const expandedSynonyms = TextAnalyzer.expandSynonyms(tokens);
    const limit = Math.min(Math.max(options.limit || 20, 1), 50);
    const requestedMode = options.searchMode || 'hybrid';
    const isHybridMode = requestedMode === 'hybrid' && sanitizedQuery.length >= 2;
    const isSemanticMode = requestedMode === 'semantic' && sanitizedQuery.length >= 2;
    const isBroadRetrieval = isHybridMode || isSemanticMode;
    let isDegraded = false;

    // 1. Resolve bilateral blocks and exclude self
    const blockedIds = await this.getBilateralBlockedUserIds(requesterId);
    const excludedIds = [requesterId, ...blockedIds];

    // 2. Decode cursor if provided
    let cursorObj: DecodedCursor | null = null;
    if (options.cursor) {
      cursorObj = this.decodeCursor(options.cursor);
      if (!cursorObj) {
        throw new Error('INVALID_CURSOR');
      }
    }

    // 3. Build free-text matching conditions across fields if query is present (for lexical mode)
    const orClauses: any[] = [];
    if (!isBroadRetrieval && sanitizedQuery.length >= 2) {
      const searchTerms = Array.from(new Set([sanitizedQuery, normalizedQuery, ...expandedSynonyms]));
      for (const term of searchTerms) {
        if (term.length >= 2) {
          orClauses.push(
            { username: { contains: term, mode: 'insensitive' } },
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { bio: { contains: term, mode: 'insensitive' } },
            {
              interests: {
                some: {
                  subInterest: {
                    name: { contains: term, mode: 'insensitive' },
                  },
                },
              },
            }
          );
        }
      }
    }

    // 4. Construct comprehensive Prisma where object
    const where: any = {
      id: {
        notIn: excludedIds,
      },
    };

    if (orClauses.length > 0) {
      where.OR = orClauses;
    }

    // 5. Apply Level 5 Structured Filters (incorporating NLQ-extracted filters)
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      const f = activeFilters;

      if (f.gender) {
        where.gender = { equals: f.gender, mode: 'insensitive' };
      }

      if (f.zodiacSign) {
        where.zodiacSign = { equals: f.zodiacSign, mode: 'insensitive' };
      }

      if (f.ageMin !== undefined || f.ageMax !== undefined) {
        const { earliestDob, latestDob } = FilterValidator.calculateDobBounds(f.ageMin, f.ageMax);
        where.dob = {
          ...(earliestDob ? { gte: earliestDob } : {}),
          ...(latestDob ? { lte: latestDob } : {}),
        };
      }

      if (f.interests && f.interests.length > 0) {
        where.interests = {
          some: {
            subInterest: {
              name: { in: f.interests, mode: 'insensitive' },
            },
          },
        };
      }
    }

    const takeCount = isBroadRetrieval ? Math.max(limit * 3, 60) : limit + 1;

    // 6. Query PostgreSQL via Prisma with strict projection allowlist
    const rawUsers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        profilePic: true,
        gender: true,
        zodiacSign: true,
        dob: true,
        createdAt: true,
        interests: {
          select: {
            subInterest: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: takeCount,
      ...(cursorObj ? { cursor: { id: cursorObj.id }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    // 7. Hybrid Search Ranking (Candidate Fusion + Multi-Signal Re-ranking)
    if (isHybridMode) {
      const candidateDocs = rawUsers.map((u) => {
        const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
        const interests = u.interests.map((i) => i.subInterest.name);
        const canonicalText = CanonicalTextBuilder.build({
          displayName,
          username: u.username,
          bio: u.bio,
          interests,
          zodiacSign: u.zodiacSign,
          gender: u.gender,
        });
        const contentHash = SearchProjectionBuilder.computeContentHash(canonicalText);
        const lexicalScore = LexicalScorer.scoreCandidate(normalizedQuery, tokens, {
          username: u.username,
          displayName,
          bio: u.bio,
          interests,
        });
        return {
          userId: u.id,
          canonicalText,
          contentHash,
          lexicalScore,
          rawUser: u,
          displayName,
          interests,
        };
      });

      const profilesMap = new Map<string, RankableProfile>();
      for (const c of candidateDocs) {
        profilesMap.set(c.userId, {
          userId: c.userId,
          username: c.rawUser.username,
          displayName: c.displayName,
          bio: c.rawUser.bio,
          profilePic: c.rawUser.profilePic,
          interests: c.interests,
          createdAt: c.rawUser.createdAt,
          lastSeenAt: (c.rawUser as any).lastSeenAt,
        });
      }

      const lexicalItems = candidateDocs.map((c) => ({
        userId: c.userId,
        score: c.lexicalScore,
      }));

      // Retrieve semantic candidate ranking
      const rankedSemantic = await semanticSearchService.rankCandidatesBySimilarity(
        sanitizedQuery,
        candidateDocs,
        { limit: takeCount }
      );

      let semanticItems: Array<{ userId: string; score: number }> = [];
      if (rankedSemantic !== null) {
        semanticItems = rankedSemantic.map((s) => ({
          userId: s.userId,
          score: s.similarity,
        }));
      } else {
        console.warn(`[SearchService] Hybrid search degraded to pure lexical fusion for query "${sanitizedQuery}"`);
        isDegraded = true;
      }

      const fusedCandidates = HybridFusion.fuseCandidates(
        lexicalItems,
        semanticItems,
        options.hybridOptions
      );

      const rankedHybrid = defaultHybridRanker.rerank(sanitizedQuery, fusedCandidates, profilesMap);

      const candidateMap = new Map(candidateDocs.map((c) => [c.userId, c]));
      const rankedMatched = rankedHybrid
        .map((r) => ({ ranked: r, candidate: candidateMap.get(r.userId) }))
        .filter((item): item is { ranked: (typeof rankedHybrid)[0]; candidate: (typeof candidateDocs)[0] } => Boolean(item.candidate));

      const hasMore = rankedMatched.length > limit;
      const selected = hasMore ? rankedMatched.slice(0, limit) : rankedMatched;
      const nextCursor =
        hasMore && selected.length > 0
          ? this.encodeCursor(selected[selected.length - 1].candidate.rawUser)
          : undefined;

      const results: UserSearchResultDto[] = selected.map(({ ranked, candidate }) => ({
        id: candidate.rawUser.id,
        username: candidate.rawUser.username,
        displayName: candidate.displayName,
        firstName: candidate.rawUser.firstName,
        lastName: candidate.rawUser.lastName,
        bio: candidate.rawUser.bio,
        profilePic: candidate.rawUser.profilePic,
        gender: candidate.rawUser.gender,
        zodiacSign: candidate.rawUser.zodiacSign,
        dob: candidate.rawUser.dob,
        interests: candidate.interests,
        score: ranked.finalScore,
      }));

      return {
        results,
        nextCursor,
        searchMode: 'hybrid',
        ...(isDegraded ? { degraded: true } : {}),
        ...(interpretedIntent ? { interpretedIntent } : {}),
      };
    }

    // 8. Pure Semantic Search Ranking (if requested and query provided)
    if (isSemanticMode) {
      const candidateDocs = rawUsers.map((u) => {
        const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
        const interests = u.interests.map((i) => i.subInterest.name);
        const canonicalText = CanonicalTextBuilder.build({
          displayName,
          username: u.username,
          bio: u.bio,
          interests,
          zodiacSign: u.zodiacSign,
          gender: u.gender,
        });
        const contentHash = SearchProjectionBuilder.computeContentHash(canonicalText);
        return {
          userId: u.id,
          canonicalText,
          contentHash,
          rawUser: u,
          displayName,
          interests,
        };
      });

      const rankedSemantic = await semanticSearchService.rankCandidatesBySimilarity(
        sanitizedQuery,
        candidateDocs,
        { limit: limit + 1 }
      );

      if (rankedSemantic !== null) {
        // Semantic search succeeded
        const similarityMap = new Map<string, number>();
        for (const item of rankedSemantic) {
          similarityMap.set(item.userId, item.similarity);
        }

        const candidateMap = new Map<string, (typeof candidateDocs)[0]>();
        for (const c of candidateDocs) {
          candidateMap.set(c.userId, c);
        }

        const rankedCandidates = rankedSemantic
          .map((item) => candidateMap.get(item.userId))
          .filter(Boolean) as (typeof candidateDocs)[0][];

        const hasMore = rankedCandidates.length > limit;
        const selected = hasMore ? rankedCandidates.slice(0, limit) : rankedCandidates;
        const nextCursor =
          hasMore && selected.length > 0
            ? this.encodeCursor(selected[selected.length - 1].rawUser)
            : undefined;

        const results: UserSearchResultDto[] = selected.map((c) => ({
          id: c.rawUser.id,
          username: c.rawUser.username,
          displayName: c.displayName,
          firstName: c.rawUser.firstName,
          lastName: c.rawUser.lastName,
          bio: c.rawUser.bio,
          profilePic: c.rawUser.profilePic,
          gender: c.rawUser.gender,
          zodiacSign: c.rawUser.zodiacSign,
          dob: c.rawUser.dob,
          interests: c.interests,
          score: Math.round((similarityMap.get(c.userId) || 0) * 1000) / 1000,
        }));

        return {
          results,
          nextCursor,
          searchMode: 'semantic',
          ...(interpretedIntent ? { interpretedIntent } : {}),
        };
      }

      // Provider unavailable or circuit open -> GRACEFUL FALLBACK to lexical scoring
      console.warn(`[SearchService] Semantic search degraded to lexical search for query "${sanitizedQuery}"`);
      isDegraded = true;
    }

    // 8. Handle pagination for lexical mode / degraded fallback
    const hasMore = rawUsers.length > limit;
    const users = hasMore ? rawUsers.slice(0, limit) : rawUsers;
    const nextCursor =
      hasMore && users.length > 0
        ? this.encodeCursor(users[users.length - 1])
        : undefined;

    // 9. Map and rank candidates for lexical mode / degraded fallback
    const results: UserSearchResultDto[] = users.map((u) => {
      const displayName =
        [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
      const interests = u.interests.map((i) => i.subInterest.name);

      let score = 0;
      if (normalizedQuery) {
        score = LexicalScorer.scoreCandidate(normalizedQuery, tokens, {
          username: u.username,
          displayName,
          bio: u.bio,
          interests,
        });
      }

      return {
        id: u.id,
        username: u.username,
        displayName,
        firstName: u.firstName,
        lastName: u.lastName,
        bio: u.bio,
        profilePic: u.profilePic,
        gender: u.gender,
        zodiacSign: u.zodiacSign,
        dob: u.dob,
        interests,
        score,
      };
    });

    // Re-rank by score if free text was queried
    if (normalizedQuery) {
      results.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return {
      results,
      nextCursor,
      searchMode: isDegraded ? 'lexical' : requestedMode,
      ...(isDegraded ? { degraded: true } : {}),
      ...(interpretedIntent ? { interpretedIntent } : {}),
    };
  }

  /**
   * Lightweight autocomplete / typeahead search for search-as-you-type (Section 37).
   */
  public async autocompleteUsers(
    requesterId: string,
    query: string,
    limit = 10
  ): Promise<AutocompleteResultDto[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const normalizedQuery = TextAnalyzer.normalizeText(trimmed);
    const tokens = TextAnalyzer.tokenize(trimmed);
    const boundedLimit = Math.min(Math.max(limit, 1), 20);

    const blockedIds = await this.getBilateralBlockedUserIds(requesterId);
    const excludedIds = [requesterId, ...blockedIds];

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        OR: [
          { username: { startsWith: trimmed, mode: 'insensitive' } },
          { username: { contains: trimmed, mode: 'insensitive' } },
          { firstName: { startsWith: trimmed, mode: 'insensitive' } },
          { lastName: { startsWith: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePic: true,
        bio: true,
      },
      take: boundedLimit * 2,
      orderBy: [{ createdAt: 'desc' }],
    });

    const suggestions = users.map((u) => {
      const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username;
      const score = LexicalScorer.scoreCandidate(normalizedQuery, tokens, {
        username: u.username,
        displayName,
        bio: u.bio,
        interests: [],
      });

      return {
        id: u.id,
        username: u.username,
        displayName,
        profilePic: u.profilePic,
        score,
      };
    });

    suggestions.sort((a, b) => b.score - a.score);

    return suggestions.slice(0, boundedLimit).map(({ id, username, displayName, profilePic }) => ({
      id,
      username,
      displayName,
      profilePic,
    }));
  }

  /**
   * Lexical post search across titles, bodies, and community names.
   * Posts by bilaterally-blocked authors are excluded.
   */
  public async searchPosts(
    requesterId: string,
    query: string,
    limit = 20,
    cursor?: string
  ): Promise<PostSearchResponse> {
    const sanitizedQuery = query.trim();
    const normalizedQuery = TextAnalyzer.normalizeText(sanitizedQuery);
    const tokens = TextAnalyzer.tokenize(sanitizedQuery);
    const expandedSynonyms = TextAnalyzer.expandSynonyms(tokens);
    const boundedLimit = Math.min(Math.max(limit, 1), 50);

    const blockedIds = await this.getBilateralBlockedUserIds(requesterId);

    let cursorObj: DecodedCursor | null = null;
    if (cursor) {
      cursorObj = this.decodeCursor(cursor);
      if (!cursorObj) throw new Error('INVALID_CURSOR');
    }

    const searchTerms = Array.from(new Set([sanitizedQuery, normalizedQuery, ...expandedSynonyms])).filter(
      (term) => term.length >= 2
    );
    const orClauses: any[] = [];
    for (const term of searchTerms) {
      orClauses.push(
        { title: { contains: term, mode: 'insensitive' } },
        { body: { contains: term, mode: 'insensitive' } },
        { community: { name: { contains: term, mode: 'insensitive' } } }
      );
    }

    const rawPosts = await prisma.post.findMany({
      where: {
        userId: blockedIds.length > 0 ? { notIn: blockedIds } : undefined,
        OR: orClauses,
      },
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
        community: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
      take: boundedLimit + 1,
      ...(cursorObj ? { cursor: { id: cursorObj.id }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const hasMore = rawPosts.length > boundedLimit;
    const page = hasMore ? rawPosts.slice(0, boundedLimit) : rawPosts;

    const results: PostSearchResultDto[] = page.map((p) => {
      const normTitle = TextAnalyzer.normalizeText(p.title || '');
      const normBody = TextAnalyzer.normalizeText(p.body || '');
      const normCommunity = TextAnalyzer.normalizeText(p.community?.name || '');
      let score = 0;
      if (normTitle === normalizedQuery) score += 100;
      else if (normTitle.startsWith(normalizedQuery)) score += 50;
      else if (normTitle.includes(normalizedQuery)) score += 30;
      if (normCommunity === normalizedQuery) score += 40;
      else if (normCommunity.includes(normalizedQuery)) score += 20;
      for (const token of tokens) {
        if (normTitle.includes(token)) score += 15;
        if (normBody.includes(token)) score += 10;
      }
      for (const syn of expandedSynonyms) {
        if (normTitle.includes(syn) || normBody.includes(syn)) score += 5;
      }
      return {
        id: p.id,
        title: p.title,
        body: p.body,
        mediaUrls: p.mediaUrls,
        contentType: p.contentType,
        viewsCount: p.viewsCount,
        createdAt: p.createdAt,
        user: p.user,
        community: p.community,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
        score,
      };
    });
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return {
      results,
      nextCursor:
        hasMore && page.length > 0 ? this.encodeCursor(page[page.length - 1]) : undefined,
      searchMode: 'lexical',
    };
  }

  /**
   * Lexical community search across names, descriptions, and categories.
   * Exact name matches rank first, then larger communities.
   */
  public async searchCommunities(
    requesterId: string,
    query: string,
    limit = 20
  ): Promise<CommunitySearchResponse> {
    const sanitizedQuery = query.trim();
    const normalizedQuery = TextAnalyzer.normalizeText(sanitizedQuery);
    const tokens = TextAnalyzer.tokenize(sanitizedQuery);
    const expandedSynonyms = TextAnalyzer.expandSynonyms(tokens);
    const boundedLimit = Math.min(Math.max(limit, 1), 50);

    const searchTerms = Array.from(new Set([sanitizedQuery, normalizedQuery, ...expandedSynonyms])).filter(
      (term) => term.length >= 2
    );
    const orClauses: any[] = [];
    for (const term of searchTerms) {
      orClauses.push(
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } }
      );
    }

    const rawCommunities = await prisma.community.findMany({
      where: { OR: orClauses },
      include: {
        _count: { select: { members: true, posts: true } },
        members: { where: { userId: requesterId }, select: { userId: true } },
      },
      take: boundedLimit,
      orderBy: [{ members: { _count: 'desc' } }, { name: 'asc' }],
    });

    const results: CommunitySearchResultDto[] = rawCommunities.map((c) => {
      const normName = TextAnalyzer.normalizeText(c.name);
      const normDesc = TextAnalyzer.normalizeText(c.description || '');
      const normCategory = TextAnalyzer.normalizeText(c.category);
      let score = 0;
      if (normName === normalizedQuery) score += 100;
      else if (normName.startsWith(normalizedQuery)) score += 50;
      else if (normName.includes(normalizedQuery)) score += 30;
      if (normCategory === normalizedQuery) score += 25;
      for (const token of tokens) {
        if (normName.includes(token)) score += 15;
        if (normDesc.includes(token)) score += 8;
        if (normCategory.includes(token)) score += 8;
      }
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        cityScope: c.cityScope,
        memberCount: c._count.members,
        postCount: c._count.posts,
        isMember: c.members.length > 0,
        score,
      };
    });
    results.sort((a, b) => b.score - a.score || b.memberCount - a.memberCount);

    return { results, searchMode: 'lexical' };
  }
}

export const searchService = new SearchService();
