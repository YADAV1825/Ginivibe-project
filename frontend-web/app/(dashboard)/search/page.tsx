'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  SlidersHorizontal,
  Clock,
  ArrowUpRight,
  MessageCircle,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  SearchApi,
  UserSearchResultDto,
  AutocompleteResultDto,
  PostSearchResult,
  CommunitySearchResult,
} from '@/lib/api/search';
import { feedApi, type Post, type PostComment } from '@/lib/api/feed';
import { WaterRippleImage } from '@/components/ui/water-ripple-image';
import styles from './search.module.css';

type EntityTab = 'people' | 'posts' | 'communities';

const ZODIAC_SYMBOLS: Record<string, string> = {
  aries: '♈ Aries',
  taurus: '♉ Taurus',
  gemini: '♊ Gemini',
  cancer: '♋ Cancer',
  leo: '♌ Leo',
  virgo: '♍ Virgo',
  libra: '♎ Libra',
  scorpio: '♏ Scorpio',
  sagittarius: '♐ Sagittarius',
  capricorn: '♑ Capricorn',
  aquarius: '♒ Aquarius',
  pisces: '♓ Pisces',
};

const EXPLORE_TOPICS = [
  'Photography',
  'Fitness',
  'Cricket',
  'Filmmaking',
  'Software',
  'Travel',
  'Music',
  'Investing',
  'Yoga',
  'Gaming',
];

const RECENT_SEARCHES_KEY = 'ginivibe_recent_searches';

function PostDetailModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [full, list] = await Promise.all([
          feedApi.getPost(postId),
          feedApi.getComments(postId),
        ]);
        if (cancelled) return;
        setPost(full);
        setLiked(!!full.hasLiked);
        setLikesCount(full._count?.likes ?? 0);
        setComments(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load post');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleLike = async () => {
    if (!post || likeBusy) return;
    setLikeBusy(true);
    try {
      const res = await feedApi.toggleLike(post.id);
      setLiked(res.liked);
      if (typeof res.likesCount === 'number') setLikesCount(res.likesCount);
      else setLikesCount((n) => Math.max(0, n + (res.liked ? 1 : -1)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not like post');
    } finally {
      setLikeBusy(false);
    }
  };

  const authorName = post
    ? `${post.user.firstName || post.user.username}${post.user.lastName ? ` ${post.user.lastName}` : ''}`
    : '';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(22, 24, 29, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto',
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '20px', padding: 'var(--space-5)', boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading post…</p>}
        {!loading && (error || !post) && (
          <p style={{ color: 'var(--color-error)' }}>{error ?? 'Post not found.'}</p>
        )}
        {!loading && post && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div
                style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--color-surface-elevated)',
                  fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)',
                }}
              >
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <Link
                  href={`/profile?userId=${post.user.id}`}
                  style={{ fontWeight: 700, color: 'var(--color-text-primary)', textDecoration: 'none' }}
                >
                  {authorName}
                </Link>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>@{post.user.username}</div>
              </div>
            </div>
            {post.title && <h3 style={{ margin: '0 0 var(--space-2)', fontSize: '1.15rem' }}>{post.title}</h3>}
            {post.body && <p style={{ margin: '0 0 var(--space-3)', lineHeight: 1.6 }}>{post.body}</p>}
            {(post.mediaUrls?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {post.mediaUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} loading="lazy" />
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => void toggleLike()}
                disabled={likeBusy}
                style={{
                  padding: '8px 18px', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem',
                  background: liked ? '#b6ff2e' : 'transparent', color: '#23262f',
                  border: '1px solid rgba(35,38,47,0.2)', cursor: 'pointer',
                }}
              >
                {liked ? '♥ Liked' : '♡ Like'} · {likesCount}
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {post._count?.comments ?? comments.length} comments
                {post.community ? ` · in ${post.community.name}` : ''}
              </span>
            </div>
            {comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <strong>{c.user.firstName || c.user.username}</strong>{' '}
                    <span style={{ color: 'var(--color-text-secondary)' }}>{c.body}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem',
              background: 'transparent', color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)', cursor: 'pointer',
            }}
          >
            Close
          </button>
      </div>
      </div>
    </div>
  );
}

const TYPEWRITER_PHRASES = [
  'Search for friends...',
  'Search for communities...',
  "Try 'founder in Delhi'...",
  'Search by vibe or interest...',
];

// Intelligent query classifier to seamlessly route between NLQ and Hybrid search under the hood
const isNaturalLanguageQuery = (text: string): boolean => {
  const t = text.toLowerCase().trim();
  const words = t.split(/\s+/);
  if (words.length >= 3) return true;

  const nlqTriggers = [
    'who',
    'like',
    'likes',
    'love',
    'loves',
    'with',
    'born',
    'aged',
    'in their',
    'women',
    'woman',
    'female',
    'men',
    'man',
    'male',
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
    'aries',
    'devotee',
    'enthusiast',
  ];

  return nlqTriggers.some((trigger) => t.includes(trigger));
};

export default function SearchPage() {
  const router = useRouter();

  // Search input and filter states
  const [query, setQuery] = useState('');
  // Refs mirror the latest query/tab so executeSearch stays referentially
  // stable without re-subscribing its callers.
  const queryRef = useRef('');
  const entityTabRef = useRef<EntityTab>('people');
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Structured filter states
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedZodiac, setSelectedZodiac] = useState<string>('');
  const [ageRange, setAgeRange] = useState<{ min?: number; max?: number }>({});

  // Results & pagination
  const [entityTab, setEntityTab] = useState<EntityTab>('people');  const [results, setResults] = useState<UserSearchResultDto[]>([]);
  const [postResults, setPostResults] = useState<PostSearchResult[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunitySearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ripple artwork is visible until the user starts typing/searching.
  const [searchFocused, setSearchFocused] = useState(false);
  const showArt = !searchFocused && !hasSearched;

  // Typewriter placeholder: types a hint letter by letter, erases it,
  // then moves to the next one — infinite loop while the box is empty.
  const [typewriterText, setTypewriterText] = useState(TYPEWRITER_PHRASES[0]);
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    let phrase = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = TYPEWRITER_PHRASES[phrase];
      if (!deleting) {
        chars += 1;
        setTypewriterText(full.slice(0, chars));
        if (chars >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 1500);
          return;
        }
        timer = setTimeout(tick, 55);
      } else {
        chars -= 1;
        setTypewriterText(full.slice(0, chars));
        if (chars <= 0) {
          deleting = false;
          phrase = (phrase + 1) % TYPEWRITER_PHRASES.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 26);
      }
    };
    timer = setTimeout(tick, 700);
    return () => clearTimeout(timer);
  }, []);

  // Idle bar is slim; focus expands it (width + height) with a transition.
  // backgroundColor stays white — the module's :focus-within cream is overridden.
  const searchBarStyle: React.CSSProperties = searchFocused
    ? {
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '10px 14px 10px 20px',
        backgroundColor: '#ffffff',
        transition:
          'max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), padding 0.35s ease, box-shadow 0.35s ease',
      }
    : {
        width: '100%',
        maxWidth: '620px',
        margin: '0 auto',
        padding: '5px 10px 5px 16px',
        backgroundColor: '#ffffff',
        transition:
          'max-width 0.35s cubic-bezier(0.22, 1, 0.36, 1), padding 0.35s ease, box-shadow 0.35s ease',
      };

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<AutocompleteResultDto[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Recent searches stored locally
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Full-bleed ripple backdrop: sky shell + transparent panel while mounted.
  useEffect(() => {
    const shell = document.querySelector('.layout-container');
    const panel = document.querySelector('.app-container');
    shell?.classList.add('gv-search-shell');
    panel?.classList.add('gv-search-bleed');
    return () => {
      shell?.classList.remove('gv-search-shell');
      panel?.classList.remove('gv-search-bleed');
    };
  }, []);

  const saveRecentSearch = useCallback((searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }, [recentSearches]);

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== termToRemove);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const clearAllRecentSearches = () => {
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Debounced autocomplete on search input
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsAutocompleteOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const items = await SearchApi.autocompleteUsers(query.trim());
        setSuggestions(items);
        setIsAutocompleteOpen(items.length > 0);
      } catch {
        setSuggestions([]);
        setIsAutocompleteOpen(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsAutocompleteOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main search execution (seamlessly calls NLQ or Hybrid without user having to know).
  // `exact` skips NLQ routing so autocomplete picks (e.g. a user named "Leo")
  // search the literal text instead of being interpreted as natural language.
  const executeSearch = useCallback(
    async (overrideQuery?: string, options?: { exact?: boolean; tab?: EntityTab }) => {
      const tab = options?.tab ?? entityTabRef.current;
      const qText = (overrideQuery !== undefined ? overrideQuery : queryRef.current).trim();
      if (!qText && !selectedGender && !selectedZodiac && !ageRange.min && !ageRange.max) {
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsAutocompleteOpen(false);
      setHasSearched(true);

      if (qText) {
        saveRecentSearch(qText);
      }

      try {
        if (tab === 'posts') {
          const response = await SearchApi.searchPosts(qText, 15);
          setPostResults(response.results || []);
          setNextCursor(response.nextCursor);
          return;
        }
        if (tab === 'communities') {
          const response = await SearchApi.searchCommunities(qText, 20);
          setCommunityResults(response.results || []);
          setNextCursor(undefined);
          return;
        }

        // Automatically determine whether to use NLQ (natural language) or Hybrid search
        const useNlq = !options?.exact && qText.length > 0 && isNaturalLanguageQuery(qText);
        const response = await SearchApi.searchUsers({
          q: useNlq ? undefined : qText || undefined,
          nlq: useNlq ? qText : undefined,
          mode: useNlq ? 'hybrid' : 'hybrid',
          gender: selectedGender || undefined,
          zodiacSign: selectedZodiac || undefined,
          ageMin: ageRange.min,
          ageMax: ageRange.max,
          limit: 15,
        });

        // Deduplicate results
        const deduplicated = Array.from(
          new Map((response.results || []).map((u) => [u.id, u])).values()
        );
        setResults(deduplicated);
        setNextCursor(response.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to perform search. Please try again.');
        setResults([]);
        setPostResults([]);
        setCommunityResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedGender, selectedZodiac, ageRange, saveRecentSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSelectAutocomplete = (item: AutocompleteResultDto) => {
    setIsAutocompleteOpen(false);
    setQuery(item.username);
    executeSearch(item.username, { exact: true });
  };

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    executeSearch(term);
  };

  const handleSelectExplore = (topic: string) => {
    setQuery(topic);
    executeSearch(topic);
  };

  const handleEntityTab = (tab: EntityTab) => {
    setEntityTab(tab);
    entityTabRef.current = tab;
    if (query.trim().length >= 2) {
      executeSearch(query.trim(), { tab });
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    const qText = query.trim();

    try {
      if (entityTab === 'posts') {
        const response = await SearchApi.searchPosts(qText, 15, nextCursor);
        setPostResults((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = (response.results || []).filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
        setNextCursor(response.nextCursor);
        return;
      }

      const useNlq = qText.length > 0 && isNaturalLanguageQuery(qText);
      const response = await SearchApi.searchUsers({
        q: useNlq ? undefined : qText || undefined,
        nlq: useNlq ? qText : undefined,
        mode: useNlq ? 'hybrid' : 'hybrid',
        gender: selectedGender || undefined,
        zodiacSign: selectedZodiac || undefined,
        ageMin: ageRange.min,
        ageMax: ageRange.max,
        limit: 15,
        cursor: nextCursor,
      });

      setResults((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const newItems = (response.results || []).filter((u) => !existingIds.has(u.id));
        return [...prev, ...newItems];
      });
      setNextCursor(response.nextCursor);
    } catch (err) {
      console.error('[SearchPage] Load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const hasActiveFilters = Boolean(selectedGender || selectedZodiac || ageRange.min || ageRange.max);

  const handleResetFilters = () => {
    setSelectedGender('');
    setSelectedZodiac('');
    setAgeRange({});
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsAutocompleteOpen(false);
    setResults([]);
    setPostResults([]);
    setCommunityResults([]);
    setNextCursor(undefined);
    setHasSearched(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val || val.trim().length === 0) {
      setResults([]);
      setPostResults([]);
      setCommunityResults([]);
      setNextCursor(undefined);
      setHasSearched(false);
      setSuggestions([]);
      setIsAutocompleteOpen(false);
      setError(null);
    }
  };

  const handleJoinCommunity = async (id: string) => {
    try {
      await feedApi.joinCommunity(id);
      setCommunityResults((prev) => prev.map((c) => (c.id === id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join community');
    }
  };

  const [activePostId, setActivePostId] = useState<string | null>(null);

  return (
    <div className="gv-search-stage">
      <div className="gv-search-bg">
        <WaterRippleImage
          src="/images/search-meadow.svg"
          zoom={1.1}
          paused={!showArt}
          className={showArt ? '' : 'gv-ripple-hidden'}
        />
      </div>
      <div className="gv-search-veil" aria-hidden="true" />
      <div className="gv-search-content">
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Search</h1>
        <p className={styles.subtitle}>Find friends, creators, and people with your vibe</p>
      </div>

      {/* Instagram-Style Unified Search Bar */}
      <div className={styles.searchSection} ref={searchContainerRef}>
        <form onSubmit={handleSubmit} className={styles.searchBarWrapper} style={searchBarStyle}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={query === '' ? typewriterText : 'Search by name, username, bio, or interests...'}
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setSearchFocused(true);
              if (suggestions.length > 0) setIsAutocompleteOpen(true);
            }}
            onBlur={() => setSearchFocused(false)}
            autoComplete="off"
            spellCheck="false"
          />

          <div className={styles.actionsRight}>
            {query.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClear}
                title="Clear input"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="button"
              className={`${styles.filterToggleBtn} ${isFiltersOpen || hasActiveFilters ? styles.filterToggleBtnActive : ''}`}
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              title="Filters"
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {hasActiveFilters && <span className={styles.activeFilterDot} />}
            </button>

            <button type="submit" className={styles.searchSubmitBtn}>
              Search
            </button>
          </div>
        </form>

        {/* Instagram-Style Autocomplete Suggestions Dropdown */}
        {isAutocompleteOpen && suggestions.length > 0 && (
          <div className={styles.autocompleteDropdown}>
            {suggestions.map((item) => {
              const initial = (item.displayName || item.username).charAt(0).toUpperCase();
              return (
                <div
                  key={item.id}
                  className={styles.autocompleteItem}
                  onClick={() => handleSelectAutocomplete(item)}
                >
                  {item.profilePic ? (
                    <img
                      src={item.profilePic}
                      alt={item.displayName}
                      className={styles.autocompleteAvatar}
                    />
                  ) : (
                    <div className={styles.autocompleteAvatarFallback}>{initial}</div>
                  )}

                  <div className={styles.autocompleteMeta}>
                    <span className={styles.autocompleteName}>{item.displayName}</span>
                    <span className={styles.autocompleteHandle}>@{item.username}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entity tabs: people, posts, communities */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }} role="tablist" aria-label="Search in">
        {([
          { id: 'people', label: 'People' },
          { id: 'posts', label: 'Posts' },
          { id: 'communities', label: 'Communities' },
        ] as Array<{ id: EntityTab; label: string }>).map((tab) => {
          const isActive = entityTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleEntityTab(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                background: isActive ? '#23262f' : 'transparent',
                color: isActive ? '#f8e7c9' : 'var(--color-text-secondary)',
                border: isActive ? '1px solid #23262f' : '1px solid var(--color-border)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Optional Filter Drawer (people search only) */}
      {isFiltersOpen && entityTab === 'people' && (
        <div className={styles.filtersDrawer}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Gender</label>
              <select
                className={styles.filterSelect}
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-Binary</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Zodiac Sign</label>
              <select
                className={styles.filterSelect}
                value={selectedZodiac}
                onChange={(e) => setSelectedZodiac(e.target.value)}
              >
                <option value="">All Zodiacs</option>
                {Object.entries(ZODIAC_SYMBOLS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Age Range</label>
              <div className={styles.ageRangeInputs}>
                <input
                  type="number"
                  min="18"
                  max="99"
                  placeholder="Min (18)"
                  className={styles.filterInput}
                  value={ageRange.min ?? ''}
                  onChange={(e) =>
                    setAgeRange((prev) => ({
                      ...prev,
                      min: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
                />
                <span className={styles.ageSeparator}>–</span>
                <input
                  type="number"
                  min="18"
                  max="99"
                  placeholder="Max (99)"
                  className={styles.filterInput}
                  value={ageRange.max ?? ''}
                  onChange={(e) =>
                    setAgeRange((prev) => ({
                      ...prev,
                      max: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className={styles.filtersActions}>
            <button type="button" className={styles.resetBtn} onClick={handleResetFilters}>
              Reset
            </button>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={() => {
                setIsFiltersOpen(false);
                executeSearch();
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
        </div>
      )}

      {/* Default State: Instagram-Style Recent Searches & Explore Topics */}
      {!hasSearched && !isLoading && (
        <div className={styles.defaultState}>
          {recentSearches.length > 0 && (
            <div className={styles.recentsSection}>
              <div className={styles.recentsHeader}>
                <h2 className={styles.recentsTitle}>Recent</h2>
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={clearAllRecentSearches}
                >
                  Clear all
                </button>
              </div>

              <div className={styles.recentsList}>
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    className={styles.recentItem}
                    onClick={() => handleSelectRecent(term)}
                  >
                    <div className={styles.recentLeft}>
                      <Clock size={16} className={styles.recentIcon} />
                      <span>{term}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.recentRemoveBtn}
                      onClick={(e) => removeRecentSearch(e, term)}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explore Topics */}
          <div className={styles.exploreSection}>
            <h2 className={styles.exploreTitle}>Explore Vibes & Interests</h2>
            <div className={styles.chipsWrapper}>
              {EXPLORE_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className={styles.exploreChip}
                  onClick={() => handleSelectExplore(topic)}
                >
                  <TrendingUp size={14} />
                  <span>{topic}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className={styles.skeletonList}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonTextWrap}>
                <div className={styles.skeletonLine} style={{ width: '35%' }} />
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Feed (Instagram-Style User Cards) */}
      {!isLoading && hasSearched && entityTab === 'people' && results.length > 0 && (
        <div className={styles.resultsFeed}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'person' : 'people'} found
            </span>
          </div>

          {results.map((user, index) => {
            const initial = (user.displayName || user.username).charAt(0).toUpperCase();
            const zodiacLabel = user.zodiacSign ? ZODIAC_SYMBOLS[user.zodiacSign.toLowerCase()] : null;

            return (
              <div key={`${user.id}-${index}`} className={styles.userCard}>
                <div className={styles.userLeft}>
                  {user.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt={user.displayName}
                      className={styles.userAvatar}
                    />
                  ) : (
                    <div className={styles.userAvatarFallback}>{initial}</div>
                  )}

                  <div className={styles.userContent}>
                    <div className={styles.userNameRow}>
                      <span className={styles.userDisplayName}>{user.displayName}</span>
                      <span className={styles.userHandle}>@{user.username}</span>
                    </div>

                    {user.bio && <p className={styles.userBio}>{user.bio}</p>}

                    {(zodiacLabel || (user.interests && user.interests.length > 0)) && (
                      <div className={styles.userTags}>
                        {zodiacLabel && (
                          <span className={`${styles.userTag} ${styles.zodiacTag}`}>
                            {zodiacLabel}
                          </span>
                        )}
                        {user.interests?.slice(0, 3).map((interest) => (
                          <span key={interest} className={styles.userTag}>
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.userRight}>
                  <Link
                    href={`/profile?userId=${user.id}`}
                    className={styles.viewProfileBtn}
                  >
                    <span>View Profile</span>
                    <ArrowUpRight size={15} />
                  </Link>
                  <Link
                    href={`/messages?userId=${user.id}`}
                    className={styles.messageBtn}
                    title="Send message"
                  >
                    <MessageCircle size={16} />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {nextCursor && (
            <div className={styles.loadMoreWrapper}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post results */}
      {!isLoading && hasSearched && entityTab === 'posts' && postResults.length > 0 && (
        <div className={styles.resultsFeed}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              {postResults.length} {postResults.length === 1 ? 'post' : 'posts'} found
            </span>
          </div>
          {postResults.map((post) => (
            <div
              key={post.id}
              className={styles.userCard}
              onClick={() => setActivePostId(post.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') setActivePostId(post.id); }}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.userLeft}>
                <div className={styles.userAvatarFallback}>
                  {(post.user.firstName || post.user.username).charAt(0).toUpperCase()}
                </div>
                <div className={styles.userContent}>
                  <div className={styles.userNameRow}>
                    <span className={styles.userDisplayName}>
                      {post.user.firstName || post.user.username} {post.user.lastName ?? ''}
                    </span>
                    <span className={styles.userHandle}>@{post.user.username}</span>
                  </div>
                  {post.title && <p className={styles.userBio} style={{ fontWeight: 700 }}>{post.title}</p>}
                  {post.body && <p className={styles.userBio}>{post.body.length > 220 ? `${post.body.slice(0, 220)}…` : post.body}</p>}
                  <div className={styles.userTags}>
                    {post.community && (
                      <span className={`${styles.userTag} ${styles.zodiacTag}`}>in {post.community.name}</span>
                    )}
                    <span className={styles.userTag}>{post.likesCount} likes</span>
                    <span className={styles.userTag}>{post.commentsCount} comments</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {nextCursor && (
            <div className={styles.loadMoreWrapper}>
              <button
                type="button"
                className={styles.loadMoreBtn}
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Community results */}
      {!isLoading && hasSearched && entityTab === 'communities' && communityResults.length > 0 && (
        <div className={styles.resultsFeed}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              {communityResults.length} {communityResults.length === 1 ? 'community' : 'communities'} found
            </span>
          </div>
          {communityResults.map((community) => (
            <div key={community.id} className={styles.userCard}>
              <div className={styles.userLeft}>
                <div className={styles.userAvatarFallback}>
                  {community.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userContent}>
                  <div className={styles.userNameRow}>
                    <span className={styles.userDisplayName}>{community.name}</span>
                    <span className={styles.userHandle}>{community.category}</span>
                  </div>
                  {community.description && <p className={styles.userBio}>{community.description}</p>}
                  <div className={styles.userTags}>
                    <span className={styles.userTag}>{community.memberCount} members</span>
                    <span className={styles.userTag}>{community.postCount} posts</span>
                    {community.cityScope && <span className={styles.userTag}>{community.cityScope}</span>}
                  </div>
                </div>
              </div>
              <div className={styles.userRight}>
                {community.isMember ? (
                  <span className={styles.userTag}>Joined</span>
                ) : (
                  <button
                    type="button"
                    className={styles.viewProfileBtn}
                    onClick={() => void handleJoinCommunity(community.id)}
                  >
                    <span>Join</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Search Results */}
      {!isLoading && hasSearched && (
        (entityTab === 'people' && results.length === 0) ||
        (entityTab === 'posts' && postResults.length === 0) ||
        (entityTab === 'communities' && communityResults.length === 0)
      ) && (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No results found</h3>
          <p className={styles.emptySubtitle}>
            {entityTab === 'people' && (
              <>We couldn&apos;t find anyone matching &ldquo;{query}&rdquo;. Try searching with different names, usernames, or interests.</>
            )}
            {entityTab === 'posts' && (
              <>No posts matched &ldquo;{query}&rdquo;. Try different keywords — synonyms like &ldquo;kitty&rdquo; for &ldquo;cat&rdquo; also work.</>
            )}
            {entityTab === 'communities' && (
              <>No communities matched &ldquo;{query}&rdquo;. Try a category like travel, food, or tech.</>
            )}
          </p>
        </div>
      )}
      </div>
      </div>
      {activePostId && <PostDetailModal postId={activePostId} onClose={() => setActivePostId(null)} />}
    </div>
  );
}
