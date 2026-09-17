import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../../components/AnimatedBackground';
import AnimatedPressable from '../../../components/AnimatedPressable';
import { CandidateCard } from '../components/CandidateCard';
import { useNonLiveMatching } from '../hooks/useNonLiveMatching';
import { useLiveMatching } from '../hooks/useLiveMatching';
import { NativeAdBanner } from '../../ads';

interface StrategyOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
}

const MATCHING_STRATEGIES: StrategyOption[] = [
  {
    id: 'personalized',
    title: 'Personalized Matching',
    description: 'Based on your overall profile and preferences',
    icon: 'people-outline',
    color: '#6366f1',
    gradient: ['#6366f1', '#4338ca'],
  },
  {
    id: 'field',
    title: 'Field-Based Matching',
    description: 'Connect with people in your industry or hobbies',
    icon: 'sparkles-outline',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'personality',
    title: 'Personality Matching',
    description: 'MBTI and deep psychological compatibility',
    icon: 'finger-print-outline',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
  },
  {
    id: 'mood',
    title: 'Mood-Based Matching',
    description: 'Find someone matching your current vibe',
    icon: 'happy-outline',
    color: '#ec4899',
    gradient: ['#ec4899', '#be185d'],
  },
  {
    id: 'kundli',
    title: 'Kundli & Astrology',
    description: 'Vedic astrology and cosmic alignment',
    icon: 'planet-outline',
    color: '#a855f7',
    gradient: ['#a855f7', '#7e22ce'],
  },
];

function StrategyCard({
  strategy,
  index,
  onSelect,
}: {
  strategy: StrategyOption;
  index: number;
  onSelect: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(70 + index * 45).springify()}>
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={onSelect}
        style={styles.strategyCardGlass}
      >
        <LinearGradient
          colors={[`${strategy.color}14`, 'rgba(15, 23, 42, 0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.strategyIconBox,
            { backgroundColor: `${strategy.color}1e`, borderColor: `${strategy.color}45` },
          ]}
        >
          <Ionicons name={strategy.icon} size={22} color={strategy.color} />
        </View>
        <View style={styles.strategyTextWrapper}>
          <Text style={styles.strategyCardTitle}>{strategy.title}</Text>
          <Text style={styles.strategyCardDesc} numberOfLines={2}>
            {strategy.description}
          </Text>
        </View>
        <View style={styles.chevronWrapper}>
          <View style={[styles.chevronCircle, { backgroundColor: `${strategy.color}18` }]}>
            <Ionicons name="chevron-forward" size={15} color={strategy.color} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MatchingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeMode, setActiveMode] = useState<'live' | 'non-live' | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyOption | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<StrategyOption | null>(null);

  // Hooks for fetching candidates
  const nonLive = useNonLiveMatching(activeMode === 'non-live');
  const live = useLiveMatching(activeMode === 'live');

  // Handle call acceptance
  const { acceptedRoomCode, clearAcceptedRoom } = live;
  useEffect(() => {
    if (acceptedRoomCode) {
      clearAcceptedRoom();
      router.push({
        pathname: '/video-call',
        params: { roomCode: acceptedRoomCode },
      });
    }
  }, [acceptedRoomCode, router, clearAcceptedRoom]);

  const handleSelectStrategy = (strategy: StrategyOption) => {
    setSelectedStrategy(strategy);
  };

  const handleChooseMode = (mode: 'live' | 'non-live') => {
    if (selectedStrategy) {
      setActiveStrategy(selectedStrategy);
    }
    setSelectedStrategy(null);
    setActiveMode(mode);
  };

  const handleChangeMode = () => {
    // Re-open mode modal for the active strategy or go back to menu
    if (activeStrategy) {
      setSelectedStrategy(activeStrategy);
    }
    setActiveMode(null);
  };

  const handleBackToHub = () => {
    setActiveMode(null);
    setActiveStrategy(null);
    setSelectedStrategy(null);
  };

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          {activeMode ? (
            <TouchableOpacity onPress={handleChangeMode} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color="#38bdf8" />
              <Text style={styles.backButtonText}>Change Mode</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerTitleRow}>
              <View style={{ flex: 1 }}>
                <Animated.Text entering={FadeInDown.delay(100).springify()} style={styles.header}>
                  Matching Hub
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(150).springify()} style={styles.headerSubtitle}>
                  Select a strategy to start matching
                </Animated.Text>
              </View>
              <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.hubBadge}>
                <Ionicons name="sparkles" size={12} color="#c084fc" />
                <Text style={styles.hubBadgeText}>5 Modes</Text>
              </Animated.View>
            </View>
          )}

          {activeMode ? (
            <View style={styles.modeIndicatorBadge}>
              <View
                style={[
                  styles.modeDot,
                  { backgroundColor: activeMode === 'live' ? '#10b981' : '#38bdf8' },
                ]}
              />
              <Text style={styles.modeBadgeText} numberOfLines={1}>
                {activeMode === 'live' ? 'Live' : 'Non-Live'} • {activeStrategy?.title || 'Matching'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Mode Views: Non-Live or Live */}
        {activeMode === 'non-live' ? (
          <View style={styles.activeModeContainer}>
            {nonLive.loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingText}>Finding best compatibility match...</Text>
              </View>
            ) : nonLive.emptyState ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="planet-outline" size={64} color="#64748b" />
                <Text style={styles.emptyTitle}>No more candidates right now!</Text>
                <Text style={styles.emptySubtitle}>
                  You've browsed through the currently available profiles. Check back soon.
                </Text>
                <TouchableOpacity onPress={handleBackToHub} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Back to Matching Hub</Text>
                </TouchableOpacity>
              </View>
            ) : nonLive.candidate ? (
              <View style={styles.cardWrapper}>
                {nonLive.error ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#f87171" />
                    <Text style={styles.errorText}>{nonLive.error}</Text>
                  </View>
                ) : null}
                <CandidateCard
                  candidate={nonLive.candidate}
                  matchScore={nonLive.matchScore}
                  onPass={nonLive.passCandidate}
                  onFollow={nonLive.followCandidate}
                  actionLoading={nonLive.actionLoading}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {nonLive.error || 'Could not connect to matching service.'}
                </Text>
                <TouchableOpacity
                  onPress={() => nonLive.fetchNextCandidate()}
                  style={styles.primaryActionButton}
                >
                  <Text style={styles.primaryActionText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : activeMode === 'live' ? (
          <View style={styles.activeModeContainer}>
            {live.loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Looking for online peers...</Text>
              </View>
            ) : live.candidate ? (
              <View style={styles.cardWrapper}>
                {live.error ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color="#f87171" />
                    <Text style={styles.errorText}>{live.error}</Text>
                  </View>
                ) : null}
                <CandidateCard
                  candidate={{
                    id: live.candidate.id,
                    name: live.candidate.name || live.candidate.username || 'Peer',
                    handle: live.candidate.username ? `@${live.candidate.username}` : undefined,
                    age: live.candidate.age || 25,
                    bio: live.candidate.bio || 'Online and ready for a live video call!',
                    avatarUrl:
                      live.candidate.avatarUrl ||
                      live.candidate.profilePic ||
                      `https://i.pravatar.cc/150?u=${live.candidate.id}`,
                    tags: live.candidate.tags || ['Live', 'Video'],
                    gender: live.candidate.gender,
                  }}
                  isLiveMode={true}
                  isCalling={!!live.callRequest}
                  callTimer={live.callTimer}
                  onPass={live.skipCandidate}
                  onRequestCall={live.requestVideoCall}
                  onCancelCall={live.cancelVideoCall}
                  actionLoading={live.actionLoading}
                />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="videocam-outline" size={60} color="#64748b" />
                <Text style={styles.emptyTitle}>No peers currently available</Text>
                <Text style={styles.emptySubtitle}>
                  There are no online users waiting for {activeStrategy?.title || 'live matching'} right now.
                </Text>
                <View style={styles.emptyActionsRow}>
                  <TouchableOpacity onPress={live.refetch} style={styles.secondaryButton}>
                    <Ionicons name="refresh" size={16} color="#cbd5e1" style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryButtonText}>Refresh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleBackToHub} style={styles.primaryActionButton}>
                    <Text style={styles.primaryActionText}>Back to Hub</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* Main Hub View (Strategy Cards) */
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Strategies Section Title */}
            <Animated.Text entering={FadeInDown.delay(90).springify()} style={styles.sectionTitle}>
              Matchmaking Strategies
            </Animated.Text>

            {/* Strategy Options List */}
            <View style={styles.strategiesContainer}>
              {MATCHING_STRATEGIES.map((strategy, index) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  index={index}
                  onSelect={() => handleSelectStrategy(strategy)}
                />
              ))}
            </View>

            {/* In-House Sponsored Placement */}
            <NativeAdBanner
              placement="MATCHING"
              containerStyle={{ marginTop: 14, marginBottom: 20 }}
            />
          </ScrollView>
        )}

        {/* Strategy Selection Modal: "Choose Matching Mode" */}
        {!!selectedStrategy && !activeMode && (
          <View style={styles.strategyModalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedStrategy(null)}
            />
            <Animated.View entering={ZoomIn.duration(200)} style={styles.strategyModalCard}>
              <View style={styles.strategyModalGlass}>
                <TouchableOpacity
                  style={styles.closeStrategyModal}
                  onPress={() => setSelectedStrategy(null)}
                >
                  <Ionicons name="close" size={22} color="#94a3b8" />
                </TouchableOpacity>

                <View
                  style={[
                    styles.selectedStrategyBadge,
                    { backgroundColor: `${selectedStrategy?.color || '#6366f1'}20` },
                  ]}
                >
                  <Ionicons
                    name={selectedStrategy?.icon || 'sparkles'}
                    size={16}
                    color={selectedStrategy?.color || '#818cf8'}
                  />
                  <Text
                    style={[
                      styles.selectedStrategyBadgeText,
                      { color: selectedStrategy?.color || '#818cf8' },
                    ]}
                  >
                    {selectedStrategy?.title}
                  </Text>
                </View>

                <Text style={styles.strategyModalTitle}>Choose Matching Mode</Text>
                <Text style={styles.strategyModalSubtitle}>
                  How would you like to connect using {selectedStrategy?.title}?
                </Text>

                <View style={styles.strategyChoicesRow}>
                  {/* Live Match Choice */}
                  <TouchableOpacity
                    style={styles.strategyChoiceButton}
                    onPress={() => handleChooseMode('live')}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.choiceGradient}
                    >
                      <View style={styles.choiceIconCircle}>
                        <Ionicons name="videocam" size={30} color="#fff" />
                      </View>
                      <Text style={styles.choiceTitle}>Live Match</Text>
                      <Text style={styles.choiceSubtitle}>Instant Video Connection</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Non-Live Choice */}
                  <TouchableOpacity
                    style={styles.strategyChoiceButton}
                    onPress={() => handleChooseMode('non-live')}
                    activeOpacity={0.85}
                  >
                    <View style={styles.choiceGlass}>
                      <View style={[styles.choiceIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                        <Ionicons name="people" size={30} color="#38bdf8" />
                      </View>
                      <Text style={styles.choiceTitle}>Non-Live</Text>
                      <Text style={styles.choiceSubtitle}>Browse Profiles First</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '400',
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  hubBadgeText: {
    color: '#c084fc',
    fontSize: 11.5,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '600',
  },
  modeIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: 200,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeBadgeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  activeModeContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 95 : 85,
  },
  cardWrapper: {
    flex: 1,
    width: '100%',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 2,
  },
  strategiesContainer: {
    gap: 10,
  },
  strategyCardGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    overflow: 'hidden',
  },
  strategyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  strategyTextWrapper: {
    flex: 1,
  },
  strategyCardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  strategyCardDesc: {
    color: '#94a3b8',
    fontSize: 12.5,
    lineHeight: 17,
  },
  chevronWrapper: {
    paddingLeft: 8,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 14,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 14,
  },
  primaryActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#38bdf8',
  },
  primaryActionText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  // Strategy Selection Modal Styles
  strategyModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  strategyModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 25,
  },
  strategyModalGlass: {
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    alignItems: 'center',
  },
  closeStrategyModal: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  selectedStrategyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  selectedStrategyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  strategyModalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  strategyModalSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  strategyChoicesRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  strategyChoiceButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  choiceGradient: {
    paddingVertical: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 160,
  },
  choiceGlass: {
    paddingVertical: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 160,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 20,
  },
  choiceIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  choiceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  choiceSubtitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
  },
});
