"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import styles from './roleplay.module.css';
import { StorageService } from '@/lib/storage';

const GINI_API_URL = process.env.NEXT_PUBLIC_GINI_API_URL ?? 'http://localhost:3004/api/gini_ai';
const GINI_ASSET_URL = GINI_API_URL.replace(/\/api\/gini_ai\/?$/, '');
const TOKEN_KEY = 'ginivibe_auth_token';

const authHeaders = (json = false): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = StorageService.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const VISIBLE_TAGS = 3;

function CharacterCard({
  char,
  assetUrl,
  onChat,
  onEdit,
  onDelete,
}: {
  char: any;
  assetUrl: string;
  onChat: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  const charId = char.uid || char.id;
  const tags = (char.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [marquee, setMarquee] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const visibleTags = tagsOpen ? tags : tags.slice(0, VISIBLE_TAGS);

  return (
    <div key={charId} onClick={() => onChat(charId)} className={styles.card}>
      {/* Image Section */}
      <div className={styles.imageWrapper}>
        {char.imagePath || char.avatarUrl ? (
          <img src={`${assetUrl}${char.imagePath || char.avatarUrl}`} alt={char.name} className={styles.cardImg} />
        ) : (
          <div className={styles.cardInitials}>
            {char.name?.[0]}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.cardContent}>
        <div className={styles.cardTitleRow}>
          <h3 className={styles.cardTitle}>{char.name}</h3>
          {char.mine || char.canEdit ? (
            <span className={styles.cardActions}>
              <button
                aria-label={`Edit ${char.name}`}
                title="Edit"
                className={styles.cardIconBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(charId);
                }}
              >
                <Pencil size={14} />
              </button>
              <button
                aria-label={`Delete ${char.name}`}
                title="Delete"
                className={`${styles.cardIconBtn} ${styles.cardIconBtnDanger}`}
                onClick={(e) => onDelete(e, charId, char.name)}
              >
                <Trash2 size={14} />
              </button>
            </span>
          ) : char.isPublic === false ? (
            <span className={styles.privateBadge}>Private</span>
          ) : null}
        </div>
        <div
          ref={descRef}
          className={styles.cardDesc}
          title={char.description}
          onMouseEnter={() => {
            const el = descRef.current;
            if (el && el.scrollWidth > el.clientWidth + 4) setMarquee(true);
          }}
          onMouseLeave={() => setMarquee(false)}
        >
          <span className={`${styles.cardDescInner} ${marquee ? styles.cardDescScroll : ''}`}>
            <span>{char.description}</span>
            <span aria-hidden="true">{char.description}</span>
          </span>
        </div>

        {tags.length > 0 && (
          <div className={styles.cardTags}>
            {visibleTags.map((tag: string) => (
              <span key={tag} className={styles.cardTag}>{tag}</span>
            ))}
            {!tagsOpen && tags.length > VISIBLE_TAGS && (
              <button
                type="button"
                className={`${styles.cardTag} ${styles.cardMore}`}
                title={tags.slice(VISIBLE_TAGS).join(', ')}
                onClick={(e) => {
                  e.stopPropagation();
                  setTagsOpen(true);
                }}
              >
                +{tags.length - VISIBLE_TAGS}
              </button>
            )}
            {tagsOpen && tags.length > VISIBLE_TAGS && (
              <button
                type="button"
                className={`${styles.cardTag} ${styles.cardMore}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setTagsOpen(false);
                }}
              >
                less
              </button>
            )}
          </div>
        )}

        <div className={styles.cardFooter}>
          <MessageSquare size={13} className={styles.msgIcon} />
          {(char.messageCount || 0) >= 1000 ? ((char.messageCount || 0) / 1000).toFixed(1) + 'k' : (char.messageCount || 0)}
        </div>
      </div>
    </div>
  );
}

export default function GiniAIHub() {
  const router = useRouter();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for search and filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tab, setTab] = useState<'explore' | 'mine'>('explore');
  // 30 per page = 5 full rows on wide screens (6-col grid).
  const [quota, setQuota] = useState<{ botsUsed: number; maxBots: number; isPremium: boolean } | null>(null);
  const [mineError, setMineError] = useState<string | null>(null);

  // Landing-style white card for this section only.
  useEffect(() => {
    const card = document.querySelector('.app-container');
    card?.classList.add('gv-gini-white');
    return () => card?.classList.remove('gv-gini-white');
  }, []);

  const AVAILABLE_TAGS = [
    "Male", "Female", "Male POV", "Female POV", 
    "fantasy", "mythical", "romantic", "comedy", "submissive", "game", 
    "sci-fi", "RPG", "hero", "supernatural", "roommate", "villain", 
    "monster", "married", "married partner", "saddistic", "mythological", 
    "servant", "cheating", "NTR", "slave", "friends", "school"
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, selectedTags, tab]);

  useEffect(() => {
    loadCharacters(currentPage);
  }, [debouncedSearch, sortBy, selectedTags, currentPage, tab]);

  useEffect(() => {
    fetch(`${GINI_API_URL}/quota`, { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then(q => q && setQuota({ botsUsed: q.botsUsed, maxBots: q.maxBots, isPremium: q.isPremium }))
      .catch(() => {});
  }, []);

  const loadCharacters = async (page = 1) => {
    setLoading(true);
    setMineError(null);
    try {
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.append("search", debouncedSearch);
      if (sortBy) queryParams.append("sort", sortBy);
      if (selectedTags.length > 0) queryParams.append("tags", selectedTags.join(","));
      if (tab === 'mine') queryParams.append("mine", "1");
      queryParams.append("page", page.toString());
      queryParams.append("limit", "30");

      const res = await fetch(`${GINI_API_URL}/characters?${queryParams.toString()}`, {
        headers: authHeaders(),
      });
      if (res.status === 401 && tab === 'mine') {
        setMineError('Login to see your bots.');
        setCharacters([]);
        setTotalPages(1);
        return;
      }
      const data = await res.json();
      if (data.data) {
        setCharacters(data.data);
        const pages = Math.max(1, Math.ceil(data.total / 30));
        setTotalPages(pages);
        // Clamp: deleting/filtering can strand us past the last page.
        if (page > pages) setCurrentPage(pages);
      } else {
        setCharacters(data);
        setTotalPages(1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteCharacter = async (e: React.MouseEvent, characterId: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? All its chats will be removed too. This cannot be undone.`)) return;
    try {
      const res = await fetch(`${GINI_API_URL}/characters/${characterId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Could not delete character');
        return;
      }
      const remaining = characters.filter(c => (c.uid || c.id) !== characterId);
      setCharacters(remaining);
      // If that was the last card on the page, step back so we never sit on an empty page.
      if (remaining.length === 0 && currentPage > 1) setCurrentPage(currentPage - 1);
      setQuota(q => (q ? { ...q, botsUsed: Math.max(0, q.botsUsed - 1) } : q));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete character');
    }
  };

  const startChat = (characterId: string) => {
    router.push(`/gini_ai/chat/${characterId}`);
  };

  return (
    <div className={styles.pageShell}>
      <div className={`${styles.content} ${styles.pageScroll}`}>
        
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              Welcome back, <span className={styles.gradientText}>User</span>
            </h2>
            <p className={styles.subtitle}>Who will you talk to today?</p>
            {quota && (
              <p className={styles.quotaText}>
                My bots: {quota.botsUsed}/{quota.maxBots}{quota.isPremium ? ' • Premium' : ''}
              </p>
            )}
          </div>
          <Link href="/gini_ai/create">
            <button className={styles.primaryBtn}>
              + Create Character
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className={styles.hubTabs}>
          <button
            onClick={() => setTab('explore')}
            className={`${styles.hubTab} ${tab === 'explore' ? styles.hubTabActive : ''}`}
          >
            Explore
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`${styles.hubTab} ${tab === 'mine' ? styles.hubTabActive : ''}`}
          >
            My Bots{quota ? ` (${quota.botsUsed})` : ''}
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search characters..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filtersGroup}>
            <button 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`${styles.filterBtn} ${isFiltersOpen || selectedTags.length > 0 ? styles.filterBtnActive : ''}`}
            >
              <Filter size={16} /> Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
            </button>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectInput}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Tags Drawer */}
        {isFiltersOpen && (
          <div className={styles.tagsDrawer}>
            <div className={styles.tagsHeader}>
              <h4 className={styles.tagsTitle}>Filter by Tags</h4>
              {selectedTags.length > 0 && (
                <button onClick={() => setSelectedTags([])} className={styles.clearBtn}>Clear all</button>
              )}
            </div>
            <div className={styles.tagsList}>
              {AVAILABLE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className={`${styles.tagBtn} ${isSelected ? styles.tagBtnActive : ''}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className={styles.loader}>
            <div className={styles.spinner}></div>
          </div>
        ) : mineError ? (
          <div className={styles.emptyState}>
            <p>{mineError}</p>
          </div>
        ) : characters.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No characters found matching your filters.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {characters.map(char => (
              <CharacterCard
                key={char.uid || char.id}
                char={char}
                assetUrl={GINI_ASSET_URL}
                onChat={startChat}
                onEdit={(id) => router.push(`/gini_ai/create?edit=${id}`)}
                onDelete={deleteCharacter}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={styles.pageBtn}
            >
              Previous
            </button>
            <span className={styles.pageText}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={styles.pageBtn}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
