'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  X, 
  UploadCloud, 
  Film, 
  Users, 
  Layers, 
  Heart,
  MessageCircle,
  Share2,
  Send,
  Eye,
  Edit2,
  Trash2,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { feedApi, Post } from '@/lib/api/feed';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { NativeAdBanner } from '@/app/core/components/NativeAdBanner';
import { CommunitiesExplorer } from './CommunitiesExplorer';
import styles from '../feed.module.css';

type FeedTab = 'all' | 'images' | 'videos' | 'communities';

interface CommentItem {
  id: string;
  body: string;
  userId?: string;
  user: {
    id?: string;
    username: string;
    firstName?: string | null;
  };
}

// ==========================================
// Interactive Post Card Component
// ==========================================
export function InteractivePostCard({
  post, 
  currentUserId, 
  authToken 
}: { 
  post: Post & { hasLiked?: boolean; viewsCount?: number }; 
  currentUserId?: string | null; 
  authToken?: string | null; 
}) {
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [isLiked, setIsLiked] = useState(Boolean(post.hasLiked));
  const [isLiking, setIsLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  // Views Tracking
  const [viewsCount, setViewsCount] = useState(post.viewsCount ?? 0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredView = useRef(false);

  // Sync state if feed refreshes
  useEffect(() => {
    setLikesCount(post._count?.likes ?? 0);
    setIsLiked(Boolean(post.hasLiked));
    setViewsCount(post.viewsCount ?? 0);
  }, [post.id, post._count?.likes, post.hasLiked, post.viewsCount]);

  // Social view tracking via IntersectionObserver
  useEffect(() => {
    if (!cardRef.current || hasTriggeredView.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggeredView.current) {
          hasTriggeredView.current = true;
          (feedApi as any).trackView(post.id).then((res: any) => {
            if (res?.viewsCount !== undefined) {
              setViewsCount(res.viewsCount);
            }
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id, authToken]);

  // Comment states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsCount, setCommentsCount] = useState(post._count?.comments ?? 0);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Inline Comment Editing States
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editBodyText, setEditBodyText] = useState('');

  const [copied, setCopied] = useState(false);

  const hasMedia = Boolean(post.mediaUrls && post.mediaUrls.length > 0);
  const isVideoPost =
    hasMedia &&
    (post.contentType === 'video' ||
      Boolean(post.mediaUrls[0].match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)));
  const isTextPost = !hasMedia;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    // Trigger pulse animation on like
    if (!prevLiked) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 450);
    }

    try {
      const res = (await feedApi.toggleLike(post.id)) as { liked: boolean; likesCount?: number };
      setIsLiked(res.liked);
      if (typeof res.likesCount === 'number') {
        setLikesCount(res.likesCount);
      }
    } catch (err: any) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      console.error('Like toggle failed:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    setCommentError('');

    if (nextState && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const data: any = await feedApi.getComments(post.id);
        setComments(Array.isArray(data) ? data : (data && typeof data === 'object' && 'data' in data ? data.data : []));
      } catch (err: any) {
        console.error('Failed to load comments:', err);
        setCommentError('Could not load comments. Please check connection.');
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError('');

    try {
      const newComment = await feedApi.addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      setCommentError(err?.message || 'Failed to post comment. Ensure you are signed in.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editBodyText.trim()) return;
    setCommentError('');

    try {
      const updated = await feedApi.updateComment(commentId, editBodyText.trim(), authToken);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: updated.body } : c))
      );
      setEditingCommentId(null);
    } catch (err: any) {
      console.error('Failed to update comment:', err);
      setCommentError(err.message || 'Could not update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    setCommentError('');

    try {
      await feedApi.deleteComment(commentId, authToken);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      setCommentError(err.message || 'Could not delete comment');
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'GiniVibe Post',
          text: post.body,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const authorName = post.user?.firstName
    ? `${post.user.firstName} ${post.user.lastName || ''}`.trim()
    : post.user?.username || 'User';

  return (
    <div className={styles.reelRow}>
    <div ref={cardRef} className={`${styles.postCard} ${styles.postCardSolid} ${styles.reelFixed} ${isTextPost ? styles.reelTextCard : ''}`}>
      {/* Author Header */}
      <div className={styles.authorHeader}>
        <div className={styles.avatar}>
          {post.user?.firstName?.[0] || post.user?.username?.[0] || 'U'}
        </div>
        <div className={styles.authorMeta}>
          <div className={styles.authorNameRow}>
            <span className={styles.authorName}>{authorName}</span>
            {post.community?.name && (
              <span className={styles.communityBadge}>
                <Users size={11} /> {post.community.name}
              </span>
            )}
          </div>
          <div className={styles.authorSubline}>
            @{post.user?.username || 'unknown'} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Title & Body: compact above media, or a designed stage for text posts */}
      {hasMedia ? (
        <>
          {(post.title || post.body) && (
            <div className={styles.reelCompact} data-noscroll>
              {post.title && (
                <div className={styles.postTitle}>{post.title}</div>
              )}
              {post.body && (
                <div className={styles.postBody}>{post.body}</div>
              )}
            </div>
          )}

          {/* Media Rendering: absolute-fill letterbox on graphite */}
          <div className={`${styles.mediaContainer} ${styles.reelMedia}`}>
            {isVideoPost ? (
              <video
                src={post.mediaUrls[0]}
                controls
                preload="metadata"
                playsInline
              />
            ) : (
              <img
                src={post.mediaUrls[0]}
                alt={post.title || 'Post visual content'}
                loading="lazy"
              />
            )}
          </div>
        </>
      ) : (
        <div className={styles.reelTextStage} data-noscroll>
          <span className={styles.reelQuoteMark} aria-hidden="true">&ldquo;</span>
          <div className={styles.reelTextInner}>
            {post.title && (
              <div className={`${styles.postTitle} ${styles.reelTextTitle}`}>{post.title}</div>
            )}
            {post.body && (
              <div className={`${styles.postBody} ${styles.reelTextBody}`}>{post.body}</div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Comments Drawer (toggled from the side rail) */}
      {showComments && (
        <div className={styles.commentDrawer} data-noscroll>
          {commentError && (
            <div className={styles.commentAlert}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} />
                <span>{commentError}</span>
              </div>
              <button
                type="button"
                onClick={() => setCommentError('')}
                className={styles.commentActionBtn}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleAddComment} className={styles.commentForm}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className={styles.commentInput}
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className={styles.commentSubmit}
              title="Send comment"
            >
              {isSubmittingComment ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={15} />
              )}
            </button>
          </form>

          {isLoadingComments ? (
            <p className={styles.commentEmpty}>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className={styles.commentEmpty}>No comments yet.</p>
          ) : (
            <div className={styles.commentList}>
              {comments.map((comment) => {
                const isCommentAuthor = Boolean(
                  currentUserId && (comment.userId === currentUserId || comment.user?.id === currentUserId)
                );
                const isPostAuthor = Boolean(currentUserId && post.userId === currentUserId);
                const canEdit = isCommentAuthor;
                const canDelete = isCommentAuthor || isPostAuthor;
                const isAuthorBadge = Boolean(
                  post.userId && (comment.userId === post.userId || comment.user?.id === post.userId)
                );
                const isEditing = editingCommentId === comment.id;

                return (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentBody}>
                      <div className={styles.commentAuthor}>
                        <span>{comment.user?.firstName || comment.user?.username || 'User'}</span>
                        {isAuthorBadge && (
                          <span className={styles.commentAuthorBadge}>Author</span>
                        )}
                      </div>

                      {isEditing ? (
                        <div className={styles.commentEditRow}>
                          <input
                            type="text"
                            value={editBodyText}
                            onChange={(e) => setEditBodyText(e.target.value)}
                            className={styles.commentEditInput}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleEditComment(comment.id)}
                            className={`${styles.commentActionBtn} ${styles.commentSave}`}
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className={styles.commentActionBtn}
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.commentText}>
                          {comment.body}
                        </div>
                      )}
                    </div>

                    {/* Edit / Delete Action Buttons */}
                    {!isEditing && (canEdit || canDelete) && (
                      <div className={styles.commentOwnerActions}>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditBodyText(comment.body);
                            }}
                            className={styles.commentActionBtn}
                            title="Edit comment"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className={`${styles.commentActionBtn} ${styles.commentDelete}`}
                            title="Delete comment"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>

      {/* Side action rail (Instagram-style): like, comments, views, share */}
      <div className={styles.reelRail} aria-label="Post actions">
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          className={`${styles.reelRailBtn} ${isLiked ? styles.reelRailBtnLiked : ''} ${justLiked ? styles.heartAnimate : ''}`}
        >
          <Heart
            size={20}
            fill={isLiked ? 'var(--color-accent)' : 'none'}
            color={isLiked ? 'var(--color-accent)' : 'currentColor'}
          />
          <span>{likesCount}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleComments}
          aria-label="Comments"
          className={`${styles.reelRailBtn} ${showComments ? styles.actionBtnActive : ''}`}
        >
          <MessageCircle size={20} />
          <span>{commentsCount}</span>
        </button>

        <div className={`${styles.reelRailBtn} ${styles.reelRailStatic}`} aria-label={`${viewsCount} views`}>
          <Eye size={20} />
          <span>{viewsCount}</span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share"
          className={styles.reelRailBtn}
        >
          <Share2 size={20} />
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Feed Dashboard Page Component
// ==========================================
export default function FeedDashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  // Tab syncs to ?tab= so refreshes and links keep the filter.
  // NOTE: always start on 'all' so the first client render matches the
  // server (hydration); the real tab is applied in an effect below.
  const readTabFromUrl = (): FeedTab => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      return t === 'images' || t === 'videos' || t === 'communities' ? t : 'all';
    } catch {
      return 'all';
    }
  };
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  useEffect(() => {
    setActiveTab(readTabFromUrl());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const selectTab = (tab: FeedTab) => {
    setActiveTab(tab);
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('tab', tab);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    } catch {
      // Non-fatal: filter still applies for this visit.
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postType, setPostType] = useState<'text' | 'media'>('text');

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [communities, setCommunities] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reels-style paging, native edition: the scroller gets mandatory
  // scroll-snap with stop-always on every card. One gesture = one card,
  // everywhere (cards, margins, rail) — the browser guarantees alignment,
  // so half-stuck states are impossible by construction.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Fresh filter restarts at the top (and re-attempts the ad slot).
  useEffect(() => {
    document
      .querySelector('.main-content')
      ?.scrollTo({ top: 0, behavior: 'auto' });
    setHasAd(true);
    setAdCountdown(0);
    adLockUntilRef.current = 0;
  }, [activeTab]);

  const fetchPosts = async () => {
    setIsRefreshing(true);
    try {
      const res = await feedApi.getFeed();
      setPosts(res.data || []);
      setError('');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to connect to backend feed API');
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    feedApi
      .getCommunities()
      .then((data) => setCommunities(data || []))
      .catch((err) => console.warn('Failed to load communities:', err));
  }, []);

  // Full-bleed reels stage: transparent panel + fixed backdrop while mounted.
  // Native one-card snap lives on the shared scroller only while the reel
  // stream is showing (never for communities explorer or reduced motion).
  useEffect(() => {
    const panel = document.querySelector('.app-container');
    const scroller = document.querySelector('.main-content');
    panel?.classList.add('gv-feed-bleed');
    const wantSnap = activeTab !== 'communities' && !reduceMotion;
    if (wantSnap) scroller?.classList.add('gv-feed-snap');
    return () => {
      panel?.classList.remove('gv-feed-bleed');
      scroller?.classList.remove('gv-feed-snap');
    };
  }, [activeTab, reduceMotion]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let mediaUrls: string[] = [];
      const detectedContentType: 'text' | 'image' | 'video' =
        postType === 'text'
          ? 'text'
          : selectedFile?.type.startsWith('video')
          ? 'video'
          : 'image';

      if (postType === 'media') {
        if (!selectedFile) {
          throw new Error('Please select an image or video file from your device.');
        }
        const uploadRes = await feedApi.uploadMedia(selectedFile);
        mediaUrls = [uploadRes.url];
      }

      await feedApi.createPost({
        contentType: detectedContentType,
        title: postType === 'text' ? title : undefined,
        body,
        mediaUrls,
        communityId: selectedCommunityId || undefined,
      });

      setTitle('');
      setBody('');
      setSelectedCommunityId('');
      clearSelectedFile();
      setIsModalOpen(false);
      await fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'communities') return Boolean(post.community && post.community.id);
      if (activeTab === 'images') {
        return (
          post.contentType === 'image' ||
          (post.mediaUrls && post.mediaUrls.some((url) => !url.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)))
        );
      }
      if (activeTab === 'videos') {
        return (
          post.contentType === 'video' ||
          (post.mediaUrls && post.mediaUrls.some((url) => Boolean(url.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i))))
        );
      }
      return true;
    });
  }, [posts, activeTab]);

  // Infinite loop: short feeds repeat in rounds forever instead of ending.
  // A sentinel at the stream end appends another round as you approach it.
  const shouldLoop = filteredPosts.length > 0 && filteredPosts.length < 8;
  const [rounds, setRounds] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Sponsored slot: shown once (round 0). Unskippable 3s per viewing —
  // while the ad dominates, page scrolling freezes outright (no yank-back,
  // no governor paging, so no fight and no glitch). Timer ends → free.
  const [hasAd, setHasAd] = useState(true);
  const [adCountdown, setAdCountdown] = useState(0);
  const adRef = useRef<HTMLDivElement | null>(null);
  const adLockRef = useRef(false);
  const adInViewRef = useRef(false);
  const adLockUntilRef = useRef(0);

  useEffect(() => {
    const el = adRef.current;
    if (!el || !hasAd) return;
    const root = document.querySelector('.main-content') as HTMLElement | null;
    let countTimer: number | null = null;
    const stopCountdown = () => {
      if (countTimer) {
        window.clearInterval(countTimer);
        countTimer = null;
      }
    };
    const freezeScroll = () => {
      root?.style.setProperty('overflow', 'hidden');
    };
    const freeScroll = () => {
      root?.style.removeProperty('overflow');
    };
    const unlock = () => {
      adLockRef.current = false;
      setAdCountdown(0);
      stopCountdown();
      freeScroll();
    };
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting);
        const was = adInViewRef.current;
        adInViewRef.current = vis;
        if (vis && !was) {
          // Every impression locks 3s: same ad re-watched, tab switched,
          // or new session — no free replays.
          adLockUntilRef.current = Date.now() + 3000;
          adLockRef.current = true;
          setAdCountdown(3);
          freezeScroll();
          stopCountdown();
          countTimer = window.setInterval(() => {
            const left = Math.max(
              0,
              Math.ceil((adLockUntilRef.current - Date.now()) / 1000),
            );
            if (left <= 0) {
              unlock();
            } else {
              setAdCountdown(left);
            }
          }, 250);
        }
        // Left the ad by any non-scroll path (tab/filter/unmount): never
        // trap, never leave a stale pill or a frozen page behind.
        if (!vis && was) {
          unlock();
        }
      },
      { root, threshold: 0.8 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unlock();
      adInViewRef.current = false;
    };
  }, [hasAd, activeTab, filteredPosts.length]);

  // Single sponsored slot shared by the post stream and the empty state,
  // so every ad gets the frame, countdown and 3s lock.
  const handleAdEmpty = useCallback(() => setHasAd(false), []);
  const renderAdSlot = () =>
    hasAd ? (
      <div ref={adRef} className={styles.reelSnap}>
        <div className={styles.adFrame}>
          <div className={styles.adPill}>
            {adCountdown > 0 ? `Ad • Skip in ${adCountdown}s` : 'Sponsored'}
          </div>
          <NativeAdBanner
            placement="FEED"
            currentUser={user}
            onEmpty={handleAdEmpty}
          />
        </div>
      </div>
    ) : null;

  // Fresh data (refetch, tab switch, new post) restarts the loop.
  useEffect(() => {
    setRounds(1);
  }, [filteredPosts]);

  const loopedPosts = useMemo(() => {
    if (!shouldLoop) {
      return filteredPosts.map((post, i) => ({ post, round: 0, index: i }));
    }
    // Bounded DOM: at most 3 rounds (~18 cards). Endless scrolling is done
    // by wrapping the scroll position, not by growing the list — the 30-item
    // cap that dead-ended the feed is gone.
    const out: Array<{ post: Post; round: number; index: number }> = [];
    const totalRounds = Math.min(rounds, 3);
    for (let r = 0; r < totalRounds; r++) {
      filteredPosts.forEach((post, i) => {
        out.push({ post, round: r, index: i });
      });
    }
    return out;
  }, [filteredPosts, rounds, shouldLoop]);

  // Anchor: first card of round 1. Its offset = exact height of round 0,
  // so wrapping back by that amount lands on identical content.
  const roundAnchorRef = useRef<HTMLDivElement | null>(null);
  const roundsRef = useRef(rounds);
  roundsRef.current = rounds;

  useEffect(() => {
    if (!shouldLoop) return;
    const el = sentinelRef.current;
    if (!el) return;
    const root = document.querySelector('.main-content');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (roundsRef.current < 3) {
            setRounds((r) => r + 1);
            return;
          }
          // Infinite loop: jump back by exactly one round. Rounds 1 and 2
          // are identical (ad lives only in round 0), so the jump is
          // invisible and the DOM never grows.
          const scroller = document.querySelector('.main-content') as HTMLElement | null;
          const anchor = roundAnchorRef.current;
          if (scroller && anchor) {
            const roundH =
              anchor.getBoundingClientRect().top -
              scroller.getBoundingClientRect().top +
              scroller.scrollTop;
            if (roundH > 0) {
              scroller.scrollTo({ top: scroller.scrollTop - roundH, behavior: 'auto' });
            }
          }
        }
      },
      { root, rootMargin: '0px 0px 600px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldLoop, loopedPosts.length, filteredPosts.length]);

  // Wheel governor: every wheel gesture glides exactly one card (slow or
  // hard — never 2-3), smoothly. Mandatory snap backstops the landing, so
  // nothing ever rests mid-way. Touch, scrollbar and keyboard stay native
  // (snap + stop-always page them one card at a time on their own).
  useEffect(() => {
    if (reduceMotion || activeTab === 'communities' || isInitialLoading || loopedPosts.length === 0) return;
    const scroller = document.querySelector('.main-content') as HTMLElement | null;
    if (!scroller) return;
    let acc = 0;
    let timer: number | null = null;
    const stepPx = () => window.innerHeight * 0.84 + 20;
    const flush = () => {
      timer = null;
      const a = acc;
      acc = 0;
      if (Math.abs(a) < 24) return; // jitter absorbed; still snapped in place
      const dir = a > 0 ? 1 : -1;
      scroller.scrollTo({ top: scroller.scrollTop + dir * stepPx(), behavior: 'smooth' });
    };
    const onWheel = (e: WheelEvent) => {
      // Ad frozen: hands off entirely — the page is overflow-hidden, and any
      // manual scrollTo here would fight it and tear. Native no-op instead.
      if (adLockRef.current) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.('[data-noscroll]')) return; // inner areas scroll natively
      e.preventDefault();
      acc += e.deltaY;
      // Long continuous push pages immediately instead of freezing mid-gesture.
      if (Math.abs(acc) > window.innerHeight * 0.5) {
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
        flush();
        return;
      }
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(flush, 120);
    };
    scroller.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      scroller.removeEventListener('wheel', onWheel);
      if (timer) window.clearTimeout(timer);
    };
  }, [activeTab, isInitialLoading, loopedPosts.length, reduceMotion]);

  return (
    <div className="gv-feed-stage">
      <div className="gv-feed-bg" aria-hidden="true" />
      <div className="gv-feed-content">
    <div className={styles.container}>

      {/* Fixed left rail: title + create + filters (matching-style) */}
      <nav className={styles.feedRail} aria-label="Feed filters">
        <div className={styles.feedRailTitle}>
          <h1>Social Feed</h1>
          <p>Discover what&apos;s trending in your community</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={styles.feedRailCreate}
        >
          <Plus size={18} />
          <span>Create Post</span>
        </button>
        <div className={styles.feedRailDivider} aria-hidden="true" />
        <div className={styles.feedRailPills}>
        {[
          { key: 'all', label: 'All Posts', icon: Layers },
          { key: 'images', label: 'Images', icon: ImageIcon },
          { key: 'videos', label: 'Videos', icon: Film },
          { key: 'communities', label: 'Communities', icon: Users },
        ].map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => selectTab(key as FeedTab)}
              aria-pressed={isActive}
              className={`${styles.feedRailPill} ${isActive ? styles.feedRailPillActive : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
        </div>
      </nav>

      {/* Posts Stream (communities tab owns its own explorer UI) */}
      {activeTab === 'communities' ? (
        <CommunitiesExplorer />
      ) : (
      <div className={styles.postStream}>
        {isInitialLoading ? (
          <div className={styles.skeletonStream}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonHeader}>
                  <div className={styles.skeletonAvatar} />
                  <div className={styles.skeletonMeta}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  </div>
                </div>
                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
                {i % 2 === 0 && <div className={styles.skeletonMedia} />}
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          loopedPosts.map(({ post, round, index }) => (
            <React.Fragment key={`${post.id}-r${round}`}>
            <div
              ref={round === 1 && index === 0 ? roundAnchorRef : undefined}
              className={styles.reelSnap}
            >
              <InteractivePostCard 
                post={post} 
                currentUserId={user?.id}
              />
            </div>
            {/* Sponsored slot: its own full snap section after the first post */}
            {round === 0 && index === 0 && renderAdSlot()}
            </React.Fragment>
          ))
        ) : (
          <>
            <div className={styles.emptyState}>
              No posts found for tab: <b>{activeTab}</b>. Click <b>Create Post</b> above to get started.
            </div>
            {renderAdSlot()}
          </>
        )}
      </div>
      )}
      {/* Infinite-loop sentinel: appends another round near the bottom */}
      {activeTab !== 'communities' && filteredPosts.length > 0 && shouldLoop && (
        <div ref={sentinelRef} aria-hidden="true" style={{ height: 4 }} />
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          data-noscroll
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedCommunityId('');
                clearSelectedFile();
              }}
              className={styles.modalClose}
            >
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle}>
              Create New Post
            </h2>

            {/* Post Type Selector */}
            <div className={styles.typeToggle}>
              <button
                type="button"
                onClick={() => setPostType('text')}
                className={`${styles.typeBtn} ${postType === 'text' ? styles.typeBtnActive : ''}`}
              >
                <FileText size={15} /> Text Only
              </button>
              <button
                type="button"
                onClick={() => setPostType('media')}
                className={`${styles.typeBtn} ${postType === 'media' ? styles.typeBtnActive : ''}`}
              >
                <ImageIcon size={15} /> Image / Video
              </button>
            </div>

            {error && (
              <div className={styles.modalError}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePost} className={styles.modalForm}>
              {/* Community Selector */}
              <div>
                <label className={styles.fieldLabel}>
                  Community Sanctuary (Optional)
                </label>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className={styles.fieldSelect}
                >
                  <option value="">No Community (Public Feed)</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </option>
                  ))}
                </select>
              </div>

              {postType === 'text' ? (
                <div key="post-text-fields" className={styles.formGroup}>
                  <div>
                    <label className={styles.fieldLabel}>
                      Title
                    </label>
                    <input
                      key="post-title-input"
                      required
                      type="text"
                      value={title || ''}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title of your post..."
                      className={styles.fieldInput}
                    />
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>
                      Body
                    </label>
                    <textarea
                      key="post-text-body"
                      rows={4}
                      value={body || ''}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your thoughts..."
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              ) : (
                <div key="post-media-fields" className={styles.formGroup}>
                  <div>
                    <label className={styles.fieldLabel}>
                      Media File
                    </label>
                    <input
                      key="post-media-file-input"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*"
                      style={{ display: 'none' }}
                    />
                    {!filePreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.uploadZone}
                      >
                        <UploadCloud size={32} color="var(--color-accent)" style={{ marginBottom: '8px' }} />
                        <div className={styles.uploadLabel}>Click to select media</div>
                        <div className={styles.uploadHint}>PNG, JPG, MP4 or WEBM</div>
                      </div>
                    ) : (
                      <div className={styles.previewContainer}>
                        {selectedFile?.type.startsWith('video') ? (
                          <video src={filePreview} controls />
                        ) : (
                          <img src={filePreview} alt="Preview" />
                        )}
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          className={styles.previewRemove}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>
                      Caption / Description
                    </label>
                    <textarea
                      key="post-media-caption"
                      required
                      rows={3}
                      value={body || ''}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Caption for your media upload..."
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? 'Submitting...' : 'Post to Feed'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}