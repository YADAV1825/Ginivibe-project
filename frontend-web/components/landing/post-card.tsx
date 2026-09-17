'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Eye, Share2 } from 'lucide-react';
import type { Post } from '@/lib/api/feed';

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function compact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${n}`;
}

interface LandingPostCardProps {
  post: Post;
}

/** Landing-native post card in the Lime/Champagne/Graphite world.
 *  Mirrors the app feed shape with an interactive like button. */
export function LandingPostCard({ post }: LandingPostCardProps) {
  const [liked, setLiked] = useState(false);
  const name = `${post.user.firstName} ${post.user.lastName}`.trim() || post.user.username;
  const initial = name.charAt(0).toUpperCase();
  const likes = (post._count?.likes ?? 0) + (liked ? 1 : 0);

  return (
    <article className="gv-post" aria-label={`Post by ${name}`}>
      <div className="gv-post-head">
        <div className="gv-post-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="gv-post-who">
          <div className="gv-post-name">
            {name}
            {post.community && (
              <span className="gv-post-badge">{post.community.name}</span>
            )}
          </div>
          <div className="gv-post-sub" suppressHydrationWarning>
            @{post.user.username} · {timeAgo(post.createdAt)}
          </div>
        </div>
      </div>
      {post.title && <h3 className="gv-post-title">{post.title}</h3>}
      <p className="gv-post-body">{post.body}</p>
      <div className="gv-post-actions">
        <button
          type="button"
          className={`gv-post-btn${liked ? ' is-liked' : ''}`}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike this post' : 'Like this post'}
          onClick={() => setLiked((v) => !v)}
        >
          <Heart size={16} aria-hidden="true" />
          <span>{compact(likes)}</span>
        </button>
        <span className="gv-post-btn is-static">
          <MessageCircle size={16} aria-hidden="true" />
          <span>{compact(post._count?.comments ?? 0)}</span>
        </span>
        <span className="gv-post-btn is-static">
          <Eye size={16} aria-hidden="true" />
          <span>{compact(post.viewsCount ?? 0)}</span>
        </span>
        <span className="gv-post-share">
          <Share2 size={16} aria-hidden="true" />
          <span>Share</span>
        </span>
      </div>
    </article>
  );
}
