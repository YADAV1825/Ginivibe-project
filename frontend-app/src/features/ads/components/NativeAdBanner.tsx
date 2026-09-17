import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { VideoView, useVideoPlayer } from 'expo-video';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAdServer, PlacementType, UserTargetingContext } from '../hooks/useAdServer';

interface NativeAdBannerProps {
  placement: PlacementType;
  currentUser?: UserTargetingContext;
  containerStyle?: object;
}

// ----------------------------------------------------------------------
// HIGH-PERFORMANCE VIDEO COMPONENT (Native Hardware Acceleration + Web)
// ----------------------------------------------------------------------
const DynamicAdVideo = memo(function DynamicAdVideo({ uri }: { uri: string }) {
  // Web Platform: Render native HTML5 video with strict autoplay & inline playback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mediaContainer}>
        {/* @ts-ignore - Web JSX tag */}
        <video
          src={uri}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            backgroundColor: '#0f172a',
          }}
        />
      </View>
    );
  }

  // Native Mobile (Android & iOS) via expo-video
  return <NativeMobileVideo uri={uri} />;
});

function NativeMobileVideo({ uri }: { uri: string }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    // Listen for video status changes (loading -> readyToPlay / error)
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        setIsBuffering(false);
      } else if (status === 'loading') {
        setIsBuffering(true);
      } else if (status === 'error') {
        setIsBuffering(false);
        setHasError(true);
        console.warn('[NativeAdBanner Video Error]', error);
      }
    });

    return () => {
      statusSub?.remove?.();
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  const toggleMute = (e: any) => {
    e.stopPropagation?.();
    try {
      player.muted = !player.muted;
      setIsMuted(player.muted);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (err) {
      console.warn('[NativeAdBanner] Failed to toggle mute:', err);
    }
  };

  if (hasError) {
    return (
      <View style={[styles.mediaContainer, styles.mediaFallback]}>
        <Ionicons name="videocam-off-outline" size={36} color="#64748b" />
        <Text style={styles.fallbackText}>Video preview unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaContainer}>
      <VideoView
        player={player}
        style={styles.media}
        nativeControls={false}
        contentFit="cover"
        showsTimecodes={false}
        requiresLinearPlayback={true}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <View style={styles.bufferOverlay}>
          <ActivityIndicator size="small" color="#818cf8" />
        </View>
      )}

      {/* Interactive Sound Control Pill */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={toggleMute}
        style={styles.muteButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons
          name={isMuted ? 'volume-mute' : 'volume-high'}
          size={13}
          color="#ffffff"
        />
        <Text style={styles.muteButtonText}>{isMuted ? 'Muted' : 'Sound On'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ----------------------------------------------------------------------
// HIGH-PERFORMANCE IMAGE COMPONENT (Memory/Disk Caching + Hardware Decode)
// ----------------------------------------------------------------------
const DynamicAdImage = memo(function DynamicAdImage({ uri }: { uri: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.mediaContainer}>
      <ExpoImage
        source={{ uri }}
        style={styles.media}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        priority="high"
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {isLoading && (
        <View style={styles.bufferOverlay}>
          <ActivityIndicator size="small" color="#818cf8" />
        </View>
      )}

      {hasError && (
        <View style={[styles.mediaContainer, styles.mediaFallback]}>
          <Ionicons name="image-outline" size={36} color="#64748b" />
          <Text style={styles.fallbackText}>Sponsored Content</Text>
        </View>
      )}
    </View>
  );
});

// ----------------------------------------------------------------------
// MAIN NATIVE AD BANNER COMPONENT
// ----------------------------------------------------------------------
export const NativeAdBanner: React.FC<NativeAdBannerProps> = memo(({
  placement,
  currentUser,
  containerStyle,
}) => {
  const { adData, trackClick } = useAdServer(placement, currentUser);

  const handlePress = useCallback(async () => {
    if (!adData?.creative) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    trackClick();

    const destination = adData.creative.destinationUrl;
    if (!destination) return;

    try {
      if (Platform.OS === 'web') {
        window.open(destination, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(destination, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: '#0f172a',
          controlsColor: '#818cf8',
        });
      }
    } catch (err) {
      try {
        await Linking.openURL(destination);
      } catch (linkErr) {
        console.warn('[NativeAdBanner] Failed to open URL:', linkErr);
      }
    }
  }, [adData, trackClick]);

  if (!adData || !adData.creative) {
    return null; // Silent collapse: zero layout shift or disruption
  }

  const { creative } = adData;

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify()}
      style={[styles.container, containerStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.touchable}
      >
        {/* Sponsored Pill Badge */}
        <View style={styles.sponsoredBadge}>
          <Ionicons name="sparkles" size={10} color="#a5b4fc" style={{ marginRight: 4 }} />
          <Text style={styles.sponsoredText}>SPONSORED</Text>
        </View>

        {/* Media (Image or Video) */}
        {creative.type === 'VIDEO' ? (
          <DynamicAdVideo uri={creative.mediaUrl} />
        ) : (
          <DynamicAdImage uri={creative.mediaUrl} />
        )}

        {/* Ad Details Body */}
        <BlurView intensity={25} tint="dark" style={styles.contentBody}>
          {creative.headline ? (
            <Text style={styles.headline} numberOfLines={2}>
              {creative.headline}
            </Text>
          ) : null}

          {creative.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {creative.description}
            </Text>
          ) : null}

          {/* CTA Action Button */}
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>{creative.cta || 'Learn More'}</Text>
            <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  touchable: {
    width: '100%',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  sponsoredText: {
    color: '#e2e8f0',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  mediaContainer: {
    width: '100%',
    height: 195,
    backgroundColor: '#0b1120',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaFallback: {
    backgroundColor: '#1e293b',
    gap: 8,
  },
  fallbackText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  bufferOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    gap: 5,
  },
  muteButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  contentBody: {
    padding: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  headline: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
