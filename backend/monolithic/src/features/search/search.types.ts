export interface SearchFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  zodiacSign?: string;
  interests?: string[];
}

export interface UserSearchResultDto {
  id: string;
  username: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePic: string | null;
  gender: string | null;
  zodiacSign: string | null;
  dob?: string | null;
  interests: string[];
  score?: number;
}

export interface AutocompleteResultDto {
  id: string;
  username: string;
  displayName: string;
  profilePic: string | null;
}

import type { SearchIntent } from './intent.types';
import type { HybridFusionOptions } from './hybrid.types';

export interface UserSearchResponse {
  results: UserSearchResultDto[];
  nextCursor?: string;
  searchMode?: 'lexical' | 'semantic' | 'hybrid';
  degraded?: boolean;
  interpretedIntent?: SearchIntent;
}

export interface SearchQueryOptions {
  q?: string;
  nlq?: string;
  understand?: boolean;
  filters?: SearchFilters;
  limit?: number;
  cursor?: string;
  searchMode?: 'lexical' | 'semantic' | 'hybrid';
  hybridOptions?: HybridFusionOptions;
}

export interface DecodedCursor {
  id: string;
  createdAt: string;
}

export interface PostSearchResultDto {
  id: string;
  title: string | null;
  body: string | null;
  mediaUrls: string[];
  contentType: string;
  viewsCount: number;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
  community: { id: string; name: string } | null;
  likesCount: number;
  commentsCount: number;
  score?: number;
}

export interface PostSearchResponse {
  results: PostSearchResultDto[];
  nextCursor?: string;
  searchMode: 'lexical';
}

export interface CommunitySearchResultDto {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cityScope: string | null;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  score: number;
}

export interface CommunitySearchResponse {
  results: CommunitySearchResultDto[];
  searchMode: 'lexical';
}
