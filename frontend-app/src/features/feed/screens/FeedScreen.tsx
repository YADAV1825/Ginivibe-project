import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../../components/AnimatedBackground';
import PostCard from '../components/PostCard';
import { Post, feedApi, getAuthToken } from '../api/feedApi';
import { NativeAdBanner } from '../../ads';


const { width } = Dimensions.get('window');

type FeedTab = 'all' | 'images' | 'videos' | 'communities';
const TABS: { key: FeedTab; label: string }[] = [
  { key: 'all', label: 'All Posts' },
  { key: 'images', label: 'Images' },
  { key: 'videos', label: 'Videos' },
  { key: 'communities', label: 'Communities' },
];

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm|m4v|3gp)(\?.*)?$/i.test(url);
}

function isImageUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(url);
}

function filterPosts(posts: Post[], tab: FeedTab) {
  switch (tab) {
    case 'images':
      return posts.filter((p) => {
        if (p.contentType === 'image') return true;
        const firstUrl = p.mediaUrls?.[0];
        return isImageUrl(firstUrl) || (p.mediaUrls && p.mediaUrls.length > 0 && !isVideoUrl(firstUrl));
      });

    case 'videos':
      return posts.filter((p) => {
        if (p.contentType === 'video') return true;
        const firstUrl = p.mediaUrls?.[0];
        return isVideoUrl(firstUrl);
      });

    case 'communities':
      return posts.filter((p) => Boolean(p.community && p.community.id));

    case 'all':
    default:
      return posts;
  }
}

function CreatePostModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setBody('');
    setTitle('');
    setMedia(null);
  };

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setMedia(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!body.trim() && !media) return;
    setSubmitting(true);
    try {
      let mediaUrls: string[] = [];
      if (media) {
        const uploaded = await feedApi.uploadMedia(media.uri, media.mimeType ?? undefined, media.fileName ?? undefined);
        mediaUrls = [uploaded.url];
      }
      await feedApi.createPost({
        contentType: media ? 'media' : 'text',
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        mediaUrls,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      // Keep modal open
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor="#64748b"
            style={styles.modalInput}
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="What's on your mind?"
            placeholderTextColor="#64748b"
            style={[styles.modalInput, styles.modalTextArea]}
            multiline
          />

          {media ? (
            <View style={styles.mediaPreviewWrap}>
              <Image source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setMedia(null)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickMedia}>
              <Ionicons name="image-outline" size={18} color="#a5b4fc" />
              <Text style={styles.attachBtnText}>Add photo or video</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (!body.trim() && !media) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={(!body.trim() && !media) || submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const indicatorPosition = useSharedValue(0);
  const tabWidth = (width - 32) / TABS.length;

  // Track posts already viewed during this screen session to avoid repeated view calls
  const viewedPostsRef = useRef<Set<string>>(new Set());

 // Pure JavaScript base64 decoder that works across iOS, Android, and Web without atob
  const decodeBase64 = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const input = str.replace(/[^A-Za-z0-9+/=]/g, '');

  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input.charAt(i);
    if (char === '=') break;

    const charIndex = chars.indexOf(char);
    if (charIndex === -1) continue;

    buffer = (buffer << 6) | charIndex;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
};

  useEffect(() => {
    const loadSession = async () => {
      const token = await getAuthToken();
      setAuthToken(token);

      // 1. Check AsyncStorage user object
      const storedUser =
        (await AsyncStorage.getItem('ginivibe_user')) ||
        (await AsyncStorage.getItem('user'));

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const resolvedId = parsed.id || parsed.userId || parsed._id;
          if (resolvedId) {
            setCurrentUserId(resolvedId);
            return;
          }
        } catch {}
      }

      // 2. Fallback to decoding the JWT safely without native atob
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
              base64 += '=';
            }
            const decodedString = decodeBase64(base64);
            const decoded = JSON.parse(decodedString);
            setCurrentUserId(decoded.id || decoded.userId || decoded.sub || null);
          }
        } catch (err) {
          console.warn('[FeedScreen] Failed to decode JWT for currentUserId:', err);
        }
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    const index = TABS.findIndex((t) => t.key === activeTab);
    indicatorPosition.value = withSpring(index * tabWidth, { damping: 15, stiffness: 200 });
  }, [activeTab, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await feedApi.getFeed();
      setPosts(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  // Viewability detection for Instagram/Facebook view counter
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    viewableItems.forEach((viewable) => {
      const postId = viewable.item?.id;
      if (postId && !viewedPostsRef.current.has(postId)) {
        viewedPostsRef.current.add(postId);
        feedApi.trackView(postId).catch(() => {});
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
  }).current;

  const visiblePosts = filterPosts(posts, activeTab);

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ zIndex: 10 }}>
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Feed</Text>
            <View style={styles.topBarActions}>
              <TouchableOpacity style={styles.createPostBtn} onPress={() => setIsCreateOpen(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createPostBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>

          <BlurView intensity={40} tint="dark" style={styles.headerGlass}>
            <View style={styles.header}>
              <Animated.View style={[styles.activeIndicator, { width: tabWidth }, indicatorStyle]}>
                <View style={styles.indicatorPill} />
              </Animated.View>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabContainer, { width: tabWidth }]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tab, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color="#818cf8" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={visiblePosts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={({ item, index }) => (
              <View>
                <PostCard 
                  post={item} 
                  authToken={authToken} 
                  currentUserId={currentUserId} 
                />
                {index === 0 && (
                  <NativeAdBanner
                    placement="FEED"
                    currentUser={{ id: currentUserId || undefined }}
                  />
                )}
              </View>
            )}
            ListEmptyComponent={
              <View>
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : (
                  <Text style={styles.emptyText}>Nothing here yet. Be the first to post!</Text>
                )}
                <NativeAdBanner
                  placement="FEED"
                  currentUser={{ id: currentUserId || undefined }}
                />
              </View>
            }
            ListFooterComponent={<View style={{ height: 80 }} />}
          />
        )}
      </View>

      <CreatePostModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => load(false)}
      />
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  createPostBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  headerGlass: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  indicatorPill: {
    width: '85%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTextArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  attachBtnText: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
  },
  mediaPreviewWrap: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: 180,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});