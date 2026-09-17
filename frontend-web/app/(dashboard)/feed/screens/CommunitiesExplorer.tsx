'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { feedApi, type Community, type Post } from '@/lib/api/feed';
import { COMMUNITY_DOMAINS, MAX_CATEGORIES } from '@/lib/community-categories';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { Card, CardContent } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { InteractivePostCard } from './FeedDashboard';
import styles from '../feed.module.css';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '0.92rem',
};

function CommunityRow({
  community,
  onPreview,
}: {
  community: Community;
  onPreview: () => void;
}) {
  const [marquee, setMarquee] = useState(false);
  const metaRef = useRef<HTMLParagraphElement>(null);
  const metaText = `${categoryLine(community)}${community.cityScope ? ` · ${community.cityScope}` : ''} · ${community.memberCount ?? 0} member${(community.memberCount ?? 0) === 1 ? '' : 's'} · ${community.postCount ?? 0} post${(community.postCount ?? 0) === 1 ? '' : 's'}`;

  return (
    <div
      onClick={onPreview}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPreview();
      }}
      onMouseEnter={() => {
        const el = metaRef.current;
        if (el && el.scrollWidth > el.clientWidth + 4) setMarquee(true);
      }}
      onMouseLeave={() => setMarquee(false)}
      className={styles.communityRow}
      style={{
        display: 'flex', alignItems: 'center', gap: '24px',
        background: '#ffffff', border: '1px solid rgba(35,38,47,0.14)',
        borderRadius: '999px', padding: '14px 28px 14px 14px', cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'color-mix(in srgb, #b6ff2e 35%, #fffdf7)',
          border: '1px solid rgba(35,38,47,0.14)',
          color: '#23262f', fontWeight: 800, fontSize: '1.6rem',
        }}
      >
        {community.name.charAt(0).toUpperCase()}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#23262f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {community.name}
        </h3>
        <p ref={metaRef} className={styles.marqueeMask} title={metaText} style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#4b4f5c' }}>
          <span className={`${styles.marqueeInner} ${marquee ? styles.marqueeScroll : ''}`}>
            <span>{metaText}</span>
            <span aria-hidden="true">{metaText}</span>
          </span>
        </p>
      </div>
      <span
        style={{
          padding: '8px 18px', borderRadius: '999px', fontWeight: 800, fontSize: '0.82rem',
          background: community.isMember ? '#b6ff2e' : '#fffdf7',
          color: '#23262f', border: '1px solid rgba(35,38,47,0.2)',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {community.isMember ? 'Joined ✓' : 'View Details'}
      </span>
    </div>
  );
}

function CommunityPreviewModal({
  community,
  onClose,
  onEnter,
  onMembershipChange,
}: {
  community: Community;
  onClose: () => void;
  onEnter: () => void;
  onMembershipChange: (id: string, isMember: boolean, memberCount?: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const joined = Boolean(community.isMember);

  const joinAndEnter = async () => {
    if (joined) {
      onEnter();
      return;
    }
    setBusy(true);
    try {
      const res = await feedApi.joinCommunity(community.id);
      onMembershipChange(community.id, true, res.memberCount);
      onEnter();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not join community');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <span
            style={{
              width: '72px', height: '72px', borderRadius: '16px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'color-mix(in srgb, #b6ff2e 35%, #fffdf7)',
              border: '1px solid rgba(35,38,47,0.14)',
              color: '#23262f', fontWeight: 800, fontSize: '1.8rem',
            }}
          >
            {community.name.charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className={styles.modalTitle} style={{ margin: 0 }}>{community.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {categoryLine(community)}
              {community.cityScope ? ` · ${community.cityScope}` : ''}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={13} aria-hidden="true" />
              {community.memberCount ?? 0} member{(community.memberCount ?? 0) === 1 ? '' : 's'}
              {' · '}
              {community.postCount ?? 0} post{(community.postCount ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {community.description && (
          <p style={{ margin: '0 0 16px', fontSize: '0.92rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
            {community.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className={styles.submitBtn} onClick={() => void joinAndEnter()} disabled={busy} style={{ flex: 1 }}>
            {busy ? 'Joining…' : joined ? 'View community' : 'Join community'}
          </button>
          {!joined && (
            <button
              type="button"
              onClick={onEnter}
              disabled={busy}
              style={{
                flex: 1, padding: '12px 18px', borderRadius: '12px',
                background: 'transparent', color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer',
              }}
            >
              View community
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const categoryLine = (community: Community): string =>
  community.categories && community.categories.length > 0
    ? community.categories.join(' · ')
    : community.category;

function CategoryMultiSelect({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const domains = COMMUNITY_DOMAINS
    .map((d) => ({
      ...d,
      items: d.items.filter(
        (item) => !q || item.toLowerCase().includes(q) || d.domain.toLowerCase().includes(q),
      ),
    }))
    .filter((d) => d.items.length > 0);

  const toggle = (item: string) => {
    if (selected.includes(item)) onChange(selected.filter((s) => s !== item));
    else if (selected.length < MAX_CATEGORIES) onChange([...selected, item]);
  };

  const pill = (item: string, isActive: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
    background: isActive ? 'color-mix(in srgb, #b6ff2e 40%, #fffdf7)' : 'var(--color-surface)',
    color: 'var(--color-text-primary)',
  });

  return (
    <div>
      <input
        className={styles.fieldInput}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 120+ categories…"
        aria-label="Search categories"
      />
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {selected.map((s) => (
            <button key={s} type="button" onClick={() => toggle(s)} style={{ ...pill(s, true), display: 'inline-flex', alignItems: 'center', gap: '4px' }} aria-label={`Remove ${s}`}>
              {s} <X size={12} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
        {selected.length}/{MAX_CATEGORIES} selected — mix any domains.
      </p>
      <div style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {domains.map((d) => (
          <div key={d.domain}>
            <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
              {d.domain}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {d.items.map((item) => (
                <button key={item} type="button" onClick={() => toggle(item)} style={pill(item, selected.includes(item))}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
        {domains.length === 0 && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>No categories match.</p>
        )}
      </div>
    </div>
  );
}

function CreateCommunityModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Community) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [cityScope, setCityScope] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      setError('Pick at least 1 category.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await feedApi.createCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        category: categories[0],
        categories,
        cityScope: cityScope.trim() || undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create community');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 className={styles.modalTitle}>Create a community</h2>
        <form onSubmit={submit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="community-name">Name *</label>
            <input id="community-name" className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Delhi Foodies" minLength={3} maxLength={60} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="community-category">Categories *</label>
            <CategoryMultiSelect selected={categories} onChange={setCategories} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="community-desc">Description</label>
            <textarea id="community-desc" className={styles.fieldInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this community about?" rows={3} maxLength={500} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="community-city">City (optional)</label>
            <input id="community-city" className={styles.fieldInput} value={cityScope} onChange={(e) => setCityScope(e.target.value)} placeholder="e.g. Delhi" maxLength={60} />
          </div>
          {error && <p className={styles.modalError}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Creating…' : 'Create community'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditCommunityModal({ community, onClose, onSaved }: { community: Community; onClose: () => void; onSaved: (c: Community) => void }) {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description ?? '');
  const [categories, setCategories] = useState<string[]>(
    community.categories && community.categories.length > 0 ? community.categories : [community.category],
  );
  const [cityScope, setCityScope] = useState(community.cityScope ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) {
      setError('Pick at least 1 category.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await feedApi.updateCommunity(community.id, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        category: categories[0],
        categories,
        cityScope: cityScope.trim() ? cityScope.trim() : null,
      });
      onSaved({ ...community, ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <h2 className={styles.modalTitle}>Edit community</h2>
        <form onSubmit={submit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-community-name">Name *</label>
            <input id="edit-community-name" className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} minLength={3} maxLength={60} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-community-category">Categories *</label>
            <CategoryMultiSelect selected={categories} onChange={setCategories} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-community-desc">Description</label>
            <textarea id="edit-community-desc" className={styles.fieldInput} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel} htmlFor="edit-community-city">City (optional)</label>
            <input id="edit-community-city" className={styles.fieldInput} value={cityScope} onChange={(e) => setCityScope(e.target.value)} maxLength={60} />
          </div>
          {error && <p className={styles.modalError}>{error}</p>}
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CommunityDetail({ id, onBack, onDeleted }: { id: string; onBack: () => void; onDeleted: (id: string) => void }) {
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberBusy, setMemberBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, feed] = await Promise.all([
        feedApi.getCommunity(id),
        feedApi.getCommunityPosts(id, 1, 20),
      ]);
      setCommunity(detail);
      setPosts(feed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load community');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleMembership = async () => {
    if (!community) return;
    setMemberBusy(true);
    try {
      if (community.isMember) {
        const res = await feedApi.leaveCommunity(community.id);
        setCommunity({ ...community, isMember: false, memberCount: res.memberCount ?? (community.memberCount ?? 1) - 1 });
      } else {
        const res = await feedApi.joinCommunity(community.id);
        setCommunity({ ...community, isMember: true, memberCount: res.memberCount ?? (community.memberCount ?? 0) + 1 });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update membership');
    } finally {
      setMemberBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!community) return;
    if (!window.confirm(`Delete "${community.name}"? Its posts will return to the public feed.`)) return;
    try {
      await feedApi.deleteCommunity(community.id);
      onDeleted(community.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete community');
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || !community) return;
    setPosting(true);
    try {
      await feedApi.createPost({ body: composerText.trim(), contentType: 'text', communityId: community.id });
      setComposerText('');
      const feed = await feedApi.getCommunityPosts(community.id, 1, 20);
      setPosts(feed.data);
      setCommunity({ ...community, postCount: (community.postCount ?? 0) + 1 });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not publish post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.postStream}>
        <div className={styles.skeletonStream}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonMeta}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                </div>
              </div>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className={styles.postStream}>
        <Button variant="ghost" size="sm" onClick={onBack} style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-2)' }}>
          <ArrowLeft size={15} style={{ marginRight: '6px' }} /> All communities
        </Button>
        <div className={styles.emptyState}>{error ?? 'Community not found.'}</div>
      </div>
    );
  }

  return (
    <div className={styles.postStream}>
      <Button variant="ghost" size="sm" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={15} style={{ marginRight: '6px' }} /> All communities
      </Button>

      <Card>
        <CardContent style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <span
              style={{
                width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'color-mix(in srgb, #b6ff2e 35%, #fffdf7)',
                border: '1px solid rgba(35,38,47,0.14)',
                color: '#23262f', fontWeight: 800, fontSize: '1.6rem',
              }}
            >
              {community.name.charAt(0).toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {community.name}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                {categoryLine(community)}
                {community.cityScope ? ` · ${community.cityScope}` : ''}
                {` · ${community.memberCount ?? 0} member${(community.memberCount ?? 0) === 1 ? '' : 's'}`}
                {` · ${community.postCount ?? 0} post${(community.postCount ?? 0) === 1 ? '' : 's'}`}
              </p>
              {community.description && (
                <p style={{ margin: '8px 0 0', fontSize: '0.92rem', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
                  {community.description}
                </p>
              )}
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Hosted by {community.owner ? `@${community.owner.username}` : 'the community owner'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
            {community.isOwner ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: '999px' }}>
                  <Check size={14} /> You host this community
                </span>
                <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
                  <Edit2 size={14} style={{ marginRight: '6px' }} /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void handleDelete()} style={{ color: 'var(--color-error)' }}>
                  <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
                </Button>
              </>
            ) : (
              <Button size="sm" variant={community.isMember ? 'secondary' : 'primary'} onClick={() => void toggleMembership()} disabled={memberBusy}>
                {memberBusy ? 'Saving…' : community.isMember ? 'Leave community' : 'Join community'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {community.isMember ? (
        <Card>
          <CardContent style={{ padding: 'var(--space-4)' }}>
            <form onSubmit={(e) => void handlePost(e)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label htmlFor="community-composer" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Post in {community.name}
              </label>
              <textarea
                id="community-composer"
                style={{ ...inputStyle, minHeight: '84px', resize: 'vertical' }}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Share something with the community…"
                maxLength={2000}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="sm" type="submit" disabled={posting || !composerText.trim()}>
                  {posting ? <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} /> : <Send size={14} style={{ marginRight: '6px' }} />}
                  {posting ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
            Join this community to post and join the discussion.
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>No posts yet. Start the first discussion!</p>
        </div>
      ) : (
        posts.map((post) => (
          <InteractivePostCard key={post.id} post={post} currentUserId={user?.id} />
        ))
      )}

      {showEdit && (
        <EditCommunityModal
          community={community}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setCommunity(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}

export function CommunitiesExplorer() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCommunities(await feedApi.getCommunities());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load communities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleMembershipChange = useCallback((id: string, isMember: boolean, memberCount?: number) => {
    setCommunities((prev) => prev.map((c) => (c.id === id ? { ...c, isMember, memberCount: memberCount ?? c.memberCount } : c)));
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setCommunities((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
  }, []);

  if (selectedId) {
    return <CommunityDetail id={selectedId} onBack={() => { setSelectedId(null); void load(); }} onDeleted={handleDeleted} />;
  }

  const mine = communities.filter((c) => c.isMember || c.isOwner);
  const discover = communities.filter((c) => !c.isMember && !c.isOwner);
  const preview = previewId ? communities.find((c) => c.id === previewId) ?? null : null;

  const renderRows = (list: Community[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {list.map((c) => (
        <CommunityRow key={c.id} community={c} onPreview={() => setPreviewId(c.id)} />
      ))}
    </div>
  );

  return (
    <div className={styles.postStream}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.92rem' }}>
          {communities.length === 0 ? 'Find your people.' : `${communities.length} ${communities.length === 1 ? 'community' : 'communities'}`}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} style={{ marginRight: '6px' }} /> New community
        </Button>
      </div>

      {loading ? (
        <div className={styles.skeletonStream}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonMeta}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          {error} <Button variant="ghost" size="sm" onClick={() => void load()}>Try again</Button>
        </div>
      ) : communities.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
          <p style={{ margin: '0 0 12px 0' }}>No communities yet. Create the first one!</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} style={{ marginRight: '6px' }} /> New community
          </Button>
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 10px' }}>
                Your communities
              </h3>
              {renderRows(mine)}
            </section>
          )}
          {discover.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '4px 0 10px' }}>
                Discover
              </h3>
              {renderRows(discover)}
            </section>
          )}
        </>
      )}

      {preview && (
        <CommunityPreviewModal
          community={preview}
          onClose={() => setPreviewId(null)}
          onEnter={() => { setPreviewId(null); setSelectedId(preview.id); }}
          onMembershipChange={handleMembershipChange}
        />
      )}

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => { setShowCreate(false); void load().then(() => setSelectedId(c.id)); }}
        />
      )}
    </div>
  );
}
