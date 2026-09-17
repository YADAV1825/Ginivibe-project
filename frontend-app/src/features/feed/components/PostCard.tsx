import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AnimatedPressable from '../../../components/AnimatedPressable';
import { Post, feedApi } from '../api/feedApi';
import { VideoView, useVideoPlayer } from 'expo-video';

interface PostCardProps {
  post: Post & { hasLiked?: boolean; viewsCount?: number };
  authToken?: string | null;
  currentUserId?: string | null;
  onCommentPress?: () => void;
}

interface CommentItem {
  id: string;
  body: string;
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

function DynamicFeedVideo({ uri }: { uri: string }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showIcon, setShowIcon] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
    setShowIcon(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowIcon(false), 400);
  };

  const toggleMute = () => {
    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <View style={styles.mediaContainer}>
      <Pressable onPress={togglePlay} style={styles.videoWrapper}>
        <VideoView
          player={player}
          style={styles.videoPlayer}
          nativeControls={false}
          contentFit="cover"
        />

        {showIcon && (
          <View style={styles.centerIconWrap}>
            <Ionicons
              name={isPlaying ? 'play' : 'pause'}
              size={56}
              color="rgba(255,255,255,0.9)"
            />
          </View>
        )}
      </Pressable>

      <Pressable onPress={toggleMute} style={styles.muteBtn} hitSlop={10}>
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={18}
          color="#fff"
        />
      </Pressable>
    </View>
  );
}

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|mkv)$/i.test(url);

function DynamicFeedImage({ uri }: { uri: string }) {
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (width, height) => {
        if (width > 0 && height > 0) {
          const rawRatio = width / height;
          const clampedRatio = Math.min(Math.max(rawRatio, 0.8), 1.91);
          setAspectRatio(clampedRatio);
        }
      },
      () => setHasError(true)
    );
  }, [uri]);

  if (hasError) {
    return (
      <View style={[styles.mediaContainer, styles.mediaError]}>
        <Ionicons name="image-outline" size={32} color="#64748b" />
        <Text style={styles.errorText}>Unable to load image</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaContainer}>
      <Image
        source={{ uri }}
        style={[styles.postImage, { aspectRatio }]}
        resizeMode="cover"
      />
    </View>
  );
}

export default function PostCard({ post, authToken, currentUserId }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post._count?.likes ?? 0);
  const [isLiked, setIsLiked] = useState(Boolean(post.hasLiked));
  const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0);
  const viewsCount = post.viewsCount ?? 0;

  useEffect(() => {
    setLikesCount(post._count?.likes ?? 0);
    setIsLiked(Boolean(post.hasLiked));
    setCommentsCount(post._count?.comments ?? 0);
  }, [post.id, post._count?.likes, post.hasLiked, post._count?.comments]);

  // Comment State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editBodyText, setEditBodyText] = useState('');
  const [updatingComment, setUpdatingComment] = useState(false);

  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const data = await feedApi.getComments(post.id);
      setComments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load comments:', err.message || err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = (await feedApi.toggleLike(post.id)) as { liked: boolean; likesCount?: number };
      setIsLiked(res.liked);
      if (typeof res.likesCount === 'number') {
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || submittingComment) return;

    const textToSend = commentText.trim();
    setCommentText('');
    setSubmittingComment(true);

    try {
      const newComment = await feedApi.addComment(post.id, textToSend);
      setComments((prev) => [...prev, newComment]);
      setCommentsCount((prev) => prev + 1);
    } catch (err: any) {
      console.error('Failed to post comment:', err.message || err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const startEditing = (item: CommentItem) => {
    setEditingCommentId(item.id);
    setEditBodyText(item.body);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditBodyText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editBodyText.trim() || updatingComment) return;

    try {
      setUpdatingComment(true);
      const updated = await feedApi.updateComment(commentId, editBodyText.trim());
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: updated.body } : c))
      );
      cancelEditing();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update comment');
    } finally {
      setUpdatingComment(false);
    }
  };

 const executeDeleteComment = async (commentId: string) => {
    try {
      await feedApi.deleteComment(commentId);
      // Optimistically remove comment from list
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('[PostCard] Delete comment error:', err);
      if (Platform.OS === 'web') {
        window.alert(err?.message || 'Failed to delete comment');
      } else {
        Alert.alert('Cannot Delete', err?.message || 'Failed to delete comment');
      }
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this comment?');
      if (confirmed) {
        executeDeleteComment(commentId);
      }
      return;
    }

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => executeDeleteComment(commentId),
        },
      ]
    );
  };

  const displayName = post.user.firstName
    ? `${post.user.firstName} ${post.user.lastName || ''}`.trim()
    : post.user.username;

  return (
    <BlurView intensity={25} tint="dark" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.authorName}>{displayName}</Text>
          <Text style={styles.username}>@{post.user.username}</Text>
        </View>
        {post.community && (
          <View style={styles.communityBadge}>
            <Text style={styles.communityText}>{post.community.name}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      {post.body ? <Text style={styles.bodyText}>{post.body}</Text> : null}

      {/* Media Images / Videos */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <View style={styles.feedMediaWrapper}>
          {post.mediaUrls.map((url, index) =>
            post.contentType === 'video' || isVideoUrl(url) ? (
              <DynamicFeedVideo key={`${url}-${index}`} uri={url} />
            ) : (
              <DynamicFeedImage key={`${url}-${index}`} uri={url} />
            )
          )}
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.footer}>
        <AnimatedPressable style={styles.actionBtn} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#ef4444' : '#94a3b8'}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>{likesCount}</Text>
        </AnimatedPressable>

        <AnimatedPressable
          style={styles.actionBtn}
          onPress={() => setShowComments((prev) => !prev)}
        >
          <Ionicons
            name={showComments ? 'chatbubble' : 'chatbubble-outline'}
            size={19}
            color={showComments ? '#6366f1' : '#94a3b8'}
          />
          <Text style={[styles.actionText, showComments && styles.activeCommentText]}>
            {commentsCount}
          </Text>
        </AnimatedPressable>

        {/* Views Count Counter */}
        <View style={styles.actionBtn}>
          <Ionicons name="eye-outline" size={20} color="#38bdf8" />
          <Text style={styles.actionText}>{viewsCount}</Text>
        </View>

        <AnimatedPressable style={[styles.actionBtn, { marginLeft: 'auto' }]}>
          <Ionicons name="share-social-outline" size={19} color="#94a3b8" />
        </AnimatedPressable>
      </View>

      {/* Comments Drawer */}
      {showComments && (
        <View style={styles.commentDrawer}>
          <View style={styles.commentsListContainer}>
            {loadingComments ? (
              <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 8 }} />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet. Start the conversation!</Text>
            ) : (
              comments.map((item) => {
                const isOwner = Boolean(currentUserId && item.user.id === currentUserId);
                const isEditing = editingCommentId === item.id;
console.log('[DEBUG OWNER]', {
  currentUserId,
  commentAuthorId: item.user?.id,
  commentAuthorUser: item.user?.username,
  isOwner: Boolean(currentUserId && item.user?.id === currentUserId),
});
                return (
                  <View key={item.id} style={styles.commentItem}>
                    {isEditing ? (
                      <View style={styles.editRow}>
                        <TextInput
                          value={editBodyText}
                          onChangeText={setEditBodyText}
                          style={styles.editInput}
                          multiline
                        />
                        <TouchableOpacity
                          onPress={() => handleSaveEdit(item.id)}
                          disabled={updatingComment}
                          style={styles.editActionBtn}
                        >
                          {updatingComment ? (
                            <ActivityIndicator size="small" color="#22c55e" />
                          ) : (
                            <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelEditing} style={styles.editActionBtn}>
                          <Ionicons name="close-circle" size={22} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.commentRow}>
                        <View style={styles.commentTextContainer}>
                          <Text style={styles.commentAuthor}>@{item.user.username}: </Text>
                          <Text style={styles.commentBody}>{item.body}</Text>
                        </View>

                        {/* Owner Controls */}
                        {isOwner && (
                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              onPress={() => startEditing(item)}
                              hitSlop={8}
                              style={styles.actionIcon}
                            >
                              <Ionicons name="pencil" size={14} color="#94a3b8" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteComment(item.id)}
                              hitSlop={8}
                              style={styles.actionIcon}
                            >
                              <Ionicons name="trash-outline" size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Comment Input Bar */}
          <View style={styles.commentInputRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Write a comment..."
              placeholderTextColor="#64748b"
              style={styles.commentInput}
              multiline={false}
            />
            <TouchableOpacity
              style={[
                styles.sendCommentBtn,
                (!commentText.trim() || submittingComment) && styles.sendCommentBtnDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={15} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  headerMeta: {
    flex: 1,
  },
  authorName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    color: '#64748b',
    fontSize: 13,
  },
  communityBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  communityText: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '500',
  },
  bodyText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  feedMediaWrapper: {
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  mediaContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  mediaError: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  centerIconWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  likedText: {
    color: '#ef4444',
  },
  activeCommentText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  commentDrawer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  commentsListContainer: {
    gap: 6,
    marginBottom: 10,
    maxHeight: 200,
  },
  noCommentsText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  commentItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  commentBody: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    padding: 2,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#f8fafc',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  editActionBtn: {
    padding: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sendCommentBtn: {
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
  },
  sendCommentBtnDisabled: {
    opacity: 0.4,
  },
});