import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  currentUserId: string;
  onPress: (room: Room) => void;
  onDelete?: (room: Room) => void;
}

const TYPE_CONFIG = {
  TEXT: {
    label: 'Text Lounge',
    icon: 'chatbubble-ellipses' as const,
    gradient: ['#4f46e5', '#6366f1'] as [string, string],
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.15)',
  },
  VOICE: {
    label: 'Voice Hub',
    icon: 'mic' as const,
    gradient: ['#059669', '#10b981'] as [string, string],
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  VIDEO: {
    label: 'Video Stage',
    icon: 'videocam' as const,
    gradient: ['#9333ea', '#a855f7'] as [string, string],
    color: '#c084fc',
    bg: 'rgba(168, 85, 247, 0.15)',
  },
};

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  currentUserId,
  onPress,
  onDelete,
}) => {
  const isCreator = room.creatorId === currentUserId;
  const isFull = room.currentParticipantsCount >= room.maxCapacity;
  const config = TYPE_CONFIG[room.type] || TYPE_CONFIG.TEXT;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(room);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.(room);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={styles.cardWrapper}
    >
      <BlurView intensity={30} tint="dark" style={styles.card}>
        {/* Top Meta Row */}
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={13} color={config.color} style={styles.typeIcon} />
            <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>

          <View style={styles.rightBadges}>
            {room.visibility === 'PRIVATE' ? (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={11} color="#fbbf24" style={{ marginRight: 3 }} />
                <Text style={styles.privateBadgeText}>PIN</Text>
              </View>
            ) : (
              <View style={styles.openBadge}>
                <Ionicons name="globe-outline" size={11} color="#38bdf8" style={{ marginRight: 3 }} />
                <Text style={styles.openBadgeText}>Open</Text>
              </View>
            )}

            <View style={[styles.capacityBadge, isFull && styles.capacityBadgeFull]}>
              <Ionicons
                name="people"
                size={11}
                color={isFull ? '#f87171' : '#94a3b8'}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.capacityText, isFull && styles.capacityTextFull]}>
                {room.currentParticipantsCount}/{room.maxCapacity}
              </Text>
            </View>
          </View>
        </View>

        {/* Room Title */}
        <Text style={styles.roomName} numberOfLines={2}>
          {room.name}
        </Text>

        {/* Footer info: Creator info & CTA */}
        <View style={styles.footerRow}>
          <View style={styles.creatorInfo}>
            {isCreator ? (
              <View style={styles.hostPill}>
                <Ionicons name="star" size={11} color="#facc15" style={{ marginRight: 4 }} />
                <Text style={styles.hostPillText}>Your Room</Text>
              </View>
            ) : (
              <View style={styles.activePill}>
                <View style={styles.liveDot} />
                <Text style={styles.activePillText}>Live Now</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {isCreator && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            )}

            <LinearGradient
              colors={isFull ? ['#334155', '#475569'] : config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinBtnGradient}
            >
              <Text style={styles.joinBtnText}>{isFull ? 'Full' : 'Join'}</Text>
              <Ionicons
                name={isFull ? 'close-circle' : 'arrow-forward'}
                size={13}
                color="#ffffff"
                style={{ marginLeft: 3 }}
              />
            </LinearGradient>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  card: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeIcon: {
    marginRight: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capacityBadgeFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  capacityTextFull: {
    color: '#f87171',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hostPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#facc15',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  activePillText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  joinBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
