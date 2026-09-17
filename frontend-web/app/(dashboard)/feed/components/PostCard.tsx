'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart,
  MessageCircle,
  Share2,
  Send,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { feedApi, Post } from '@/lib/api/feed';
import { Avatar, AvatarStack } from '@/app/core/components/Avatar';
import styles from '../feed.module.css';

interface Liker {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
}

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

export interface PostCardProps {
  post: Post & { hasLiked?: boolean; viewsCount?: number };
  currentUserId?: string | null;
  authToken?: string | null;
}

export function InteractivePostCard({ post, currentUserId, authToken }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [isLiked, setIsLiked] = useState(Boolean(post.hasLiked));
  const [isLiking, setIsLiking] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [likers, setLikers] = useState<Liker[]>([]);

  // Liker face-pile: only fetched when the post actually has likes.
  // State updates live in async callbacks so no render cascades.
  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => ((post._count?.likes ?? 0) === 0 ? [] : feedApi.getLikers(post.id)))
      .then(
        (people) => { if (!cancelled) setLikers(people); },
        () => { if (!cancelled) setLikers([]); },
      );
    return () => { cancelled = true; };
  }, [post.id, post._count?.likes]);

  // Views Tracking
  const [viewsCount, setViewsCount] = useState(post.viewsCount ?? 0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredView = useRef(false);

  useEffect(() => {
    setLikesCount(post._count?.likes ?? 0);
    setIsLiked(Boolean(post.hasLiked));
    setViewsCount(post.viewsCount ?? 0);
  }, [post.id, post._count?.likes, post.hasLiked, post.viewsCount]);

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
          }).catch(() => {
            /* View tracking is best-effort; ignore offline/backend failures. */
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

  // Inline Editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editBodyText, setEditBodyText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

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
      if (res.liked) {
        // Refresh the face-pile so the new like shows up.
        feedApi.getLikers(post.id).then(setLikers, () => undefined);
      } else if (currentUserId) {
        setLikers((prev) => prev.filter((liker) => liker.id !== currentUserId));
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
        setCommentError('Could not load comments.');
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
      setCommentError(err?.message || 'Failed to post comment. Ensure you are logged in.');
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
    <div ref={cardRef} className={styles.postCard}>
      {/* Author Header */}
      <div className={styles.authorHeader}>
        <Avatar
          person={{
            id: post.user?.id,
            username: post.user?.username,
            firstName: post.user?.firstName,
            lastName: post.user?.lastName,
          }}
          size="md"
        />
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

      {/* Title & Body */}
      {post.title && (
        <div className={styles.postTitle}>{post.title}</div>
      )}
      {post.body && (
        <div className={styles.postBody}>{post.body}</div>
      )}

      {/* Media Rendering */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className={styles.mediaContainer}>
          {post.contentType === 'video' || Boolean(post.mediaUrls[0].match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)) ? (
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
      )}

      {/* Action Buttons Bar */}
      <div className={styles.actionBar}>
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          className={`${styles.actionBtn} ${isLiked ? styles.actionBtnLiked : ''} ${justLiked ? styles.heartAnimate : ''}`}
        >
          {likers.length > 0 && (
            <AvatarStack people={likers} max={3} size="xs" label={`Liked by ${likers.map((liker) => liker.firstName || liker.username).join(', ')}`} />
          )}
          <Heart
            size={18}
            fill={isLiked ? 'var(--color-accent)' : 'none'}
            color={isLiked ? 'var(--color-accent)' : 'currentColor'}
          />
          <span>{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={handleToggleComments}
          className={`${styles.actionBtn} ${showComments ? styles.actionBtnActive : ''}`}
        >
          <MessageCircle size={18} />
          <span>{commentsCount}</span>
        </button>

        {/* View Count Display */}
        <div className={styles.viewCount}>
          <Eye size={18} />
          <span>{viewsCount}</span>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className={`${styles.actionBtn} ${styles.actionBtnShare} ${copied ? styles.actionBtnCopied : ''}`}
        >
          <Share2 size={18} />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className={styles.commentDrawer}>
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
                    <Avatar
                      person={{
                        id: comment.user?.id,
                        username: comment.user?.username,
                        firstName: comment.user?.firstName,
                      }}
                      size="xs"
                    />
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
  );
}

export const PostCard = InteractivePostCard;