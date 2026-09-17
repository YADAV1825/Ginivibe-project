import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { CandidateProfile, CandidateScore } from '../types';

const { width, height } = Dimensions.get('window');

interface CandidateCardProps {
  candidate: CandidateProfile;
  matchScore?: CandidateScore | null;
  onPass: () => void;
  onFollow?: (message?: string) => void;
  actionLoading?: boolean;
  isLiveMode?: boolean;
  callTimer?: number;
  isCalling?: boolean;
  onRequestCall?: () => void;
  onCancelCall?: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  matchScore,
  onPass,
  onFollow,
  actionLoading = false,
  isLiveMode = false,
  callTimer = 0,
  isCalling = false,
  onRequestCall,
  onCancelCall,
}) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [messageText, setMessageText] = useState('');

  const scorePercent = matchScore?.totalScore
    ? Math.round(matchScore.totalScore * 100)
    : matchScore?.score
    ? Math.round(matchScore.score * 100)
    : 92;

  const handleSendFollow = () => {
    if (onFollow) {
      onFollow(messageText.trim() || undefined);
    }
    setShowRequestModal(false);
    setMessageText('');
  };

  const handleCancelModal = () => {
    setShowRequestModal(false);
    setMessageText('');
  };

  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.cardContainer}>
      <BlurView intensity={35} tint="dark" style={styles.cardGlass}>
        {/* Top Hero Photo Section */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => setShowPhotoModal(true)}
          style={styles.heroPhotoWrapper}
        >
          <Image
            source={{ uri: candidate.avatarUrl || 'https://i.pravatar.cc/600?u=' + candidate.id }}
            style={styles.heroPhoto}
            resizeMode="cover"
          />

          {/* Floating Badges Header */}
          <View style={styles.topBadgesRow}>
            {isLiveMode ? (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            ) : candidate.zodiacSign ? (
              <View style={styles.zodiacBadge}>
                <Text style={styles.zodiacBadgeText}>♈ {candidate.zodiacSign}</Text>
              </View>
            ) : (
              <View />
            )}

            <View style={styles.badgeContainer}>
              <Ionicons name="sparkles" size={14} color="#f59e0b" />
              <Text style={styles.badgeText}>{scorePercent}% Match</Text>
            </View>
          </View>

          {/* Bottom Dark Gradient over Photo */}
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.45)', 'rgba(15, 23, 42, 0.95)']}
            style={styles.photoGradientOverlay}
          >
            <View style={styles.photoBottomContent}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {candidate.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPhotoModal(true)}
                  style={styles.expandButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="expand-outline" size={15} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.handleText} numberOfLines={1}>
                {candidate.handle || '@uniqueuser'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Profile Content Section */}
        <View style={styles.content}>
          {/* Details Pill Row */}
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Ionicons
                name={candidate.gender?.toLowerCase() === 'female' ? 'female' : 'male'}
                size={14}
                color={candidate.gender?.toLowerCase() === 'female' ? '#ec4899' : '#38bdf8'}
              />
              <Text style={styles.pillText}>
                {candidate.age} yrs • {candidate.gender || 'Person'}
              </Text>
            </View>

            {candidate.location ? (
              <View style={styles.pill}>
                <Ionicons name="location-sharp" size={13} color="#38bdf8" />
                <Text style={styles.pillText}>{candidate.location}</Text>
              </View>
            ) : null}

            {candidate.personalityType ? (
              <View style={styles.pillAccent}>
                <Text style={styles.pillAccentText}>{candidate.personalityType}</Text>
              </View>
            ) : null}
          </View>

          {/* Bio */}
          {candidate.bio ? (
            <View style={styles.bioBox}>
              <Text style={styles.bioText} numberOfLines={3}>
                {candidate.bio}
              </Text>
            </View>
          ) : null}

          {/* Tags */}
          {candidate.tags && candidate.tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {candidate.tags.slice(0, 6).map((tag, idx) => (
                <View key={idx} style={styles.tagPill}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Action Controls Section */}
        <View style={styles.actionsContainer}>
          {isLiveMode ? (
            isCalling ? (
              <View style={styles.callingBox}>
                <View style={styles.timerRow}>
                  <ActivityIndicator size="small" color="#f59e0b" />
                  <Text style={styles.timerText}>{callTimer}s</Text>
                </View>
                <Text style={styles.callingSubtext}>Waiting for {candidate.name} to accept...</Text>
                <TouchableOpacity
                  onPress={onCancelCall}
                  style={styles.cancelCallButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelCallText}>Cancel Call</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  onPress={onPass}
                  disabled={actionLoading}
                  style={styles.skipButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#cbd5e1" />
                  <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onRequestCall}
                  disabled={actionLoading}
                  style={styles.actionButtonPrimary}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.actionGradient}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="videocam" size={20} color="#fff" />
                        <Text style={styles.primaryButtonText}>Request Video Call</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.buttonsRow}>
              {/* Skip Button */}
              <TouchableOpacity
                onPress={onPass}
                disabled={actionLoading}
                style={styles.skipButton}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#cbd5e1" />
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              {/* Friend Request Button */}
              <TouchableOpacity
                onPress={() => setShowRequestModal(true)}
                disabled={actionLoading}
                style={styles.actionButtonPrimary}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.actionGradient}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="heart" size={18} color="#fff" />
                      <Text style={styles.primaryButtonText}>Friend Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BlurView>

      {/* Friend Request Message Modal (Matches frontend-web FollowModal) */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Animated.View entering={ZoomIn.duration(200)} style={styles.requestModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalCandidateInfo}>
                <Image
                  source={{ uri: candidate.avatarUrl || 'https://i.pravatar.cc/150?u=' + candidate.id }}
                  style={styles.modalAvatar}
                />
                <View style={styles.modalHeaderTextWrapper}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    Send Friend Request to {candidate.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    They will see your request and message in their Messages inbox.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCancelModal}
                style={styles.modalCloseButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Message Input Section */}
            <View style={styles.modalInputSection}>
              <View style={styles.modalLabelRow}>
                <Text style={styles.modalInputLabel}>Introductory Message</Text>
                <Text style={styles.charCount}>{messageText.length}/150</Text>
              </View>
              <TextInput
                style={styles.modalTextInput}
                placeholder={`Hi ${candidate.name}! Saw we matched and wanted to connect...`}
                placeholderTextColor="#64748b"
                value={messageText}
                maxLength={150}
                onChangeText={setMessageText}
                multiline
                autoFocus
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                onPress={handleCancelModal}
                style={styles.modalCancelButton}
                disabled={actionLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendFollow}
                style={styles.modalSendButton}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={styles.modalSendGradient}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={14} color="#fff" />
                      <Text style={styles.modalSendText}>Send Friend Request</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fullscreen Photo Modal */}
      <Modal visible={showPhotoModal} transparent animationType="fade" onRequestClose={() => setShowPhotoModal(false)}>
        <View style={styles.fullscreenModalBackdrop}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowPhotoModal(false)}
          >
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          <Animated.View entering={ZoomIn.duration(200)}>
            <Image
              source={{ uri: candidate.avatarUrl || 'https://i.pravatar.cc/800?u=' + candidate.id }}
              style={styles.fullscreenPhoto}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    flex: 1,
    marginVertical: 4,
  },
  cardGlass: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'space-between',
  },
  heroPhotoWrapper: {
    width: '100%',
    flex: 1.15,
    minHeight: 180,
    maxHeight: 270,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  topBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  zodiacBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  zodiacBadgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  photoGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  photoBottomContent: {
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    flex: 1,
  },
  expandButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  handleText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  pillAccent: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pillAccentText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  bioBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  bioText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  skipButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
  },
  actionButtonPrimary: {
    flex: 1.6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 7,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  callingBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    color: '#f59e0b',
    fontSize: 22,
    fontWeight: '800',
  },
  callingSubtext: {
    color: '#94a3b8',
    fontSize: 14,
  },
  cancelCallButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelCallText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  requestModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalCandidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  modalHeaderTextWrapper: {
    flex: 1,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalInputSection: {
    gap: 6,
  },
  modalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInputLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  charCount: {
    color: '#64748b',
    fontSize: 11,
  },
  modalTextInput: {
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  modalCancelText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSendButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  modalSendText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  fullscreenModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  fullscreenPhoto: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 20,
  },
});
