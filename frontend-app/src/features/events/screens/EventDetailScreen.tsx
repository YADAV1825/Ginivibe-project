//frontend-app/src/features/events/screens/EventDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../../components/AnimatedBackground';
import { useEventDetail } from '../hooks/useEventDetail';
import { rsvpToEvent, cancelRsvp, leaveWaitlist, updateEvent, deleteEvent } from '../api/EventsAPI';

interface EventDetailScreenProps {
  eventId: string;
  onBack: () => void;
}

export default function EventDetailScreen({ eventId, onBack }: EventDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { event, loading, error, refetch } = useEventDetail({ eventId });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('ginivibe_auth_token').then(token => {
      if (!token) return;
      try {
        setCurrentUserId(JSON.parse(globalThis.atob(token.split('.')[1])).id);
      } catch {
        setCurrentUserId(null);
      }
    });
  }, []);

  const handleRsvp = async (status: 'GOING' | 'INTERESTED' | 'DECLINED') => {
    if (!event) return;

    setRsvpLoading(true);
    try {
      if (event.waitlistStatus === 'WAITLISTED') {
        await leaveWaitlist(eventId);
      } else if (event.userAttendanceStatus === status) {
        // Cancel RSVP
        await cancelRsvp(eventId);
      } else {
        // Set RSVP status
        await rsvpToEvent(eventId, status);
      }
      await refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleEdit = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!event || !editTitle.trim()) return;
    setRsvpLoading(true);
    try {
      await updateEvent(eventId, { title: editTitle.trim(), description: editDescription.trim() });
      setEditing(false);
      await refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete event', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteEvent(eventId);
          onBack();
        } catch (err: any) {
          Alert.alert('Error', err.message);
        }
      } },
    ]);
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#818cf8" />
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  if (error || !event) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error || 'Event not found'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onBack}>
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = endDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Details</Text>
          {currentUserId === event.organizer.id ? <TouchableOpacity onPress={handleEdit}><Ionicons name="create-outline" size={24} color="#fff" /></TouchableOpacity> : <View style={{ width: 32 }} />}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Banner Image — visible to anyone who can see this event */}
          {event.bannerImageUrl && (
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <Image source={{ uri: event.bannerImageUrl }} style={styles.bannerImage} />
            </Animated.View>
          )}

          {/* Event Title & Status */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <BlurView intensity={30} tint="dark" style={styles.titleCard}>
              <View style={styles.statusBadge}>
                <Ionicons
                  name={event.status === 'LIVE' ? 'radio-outline' : 'calendar-outline'}
                  size={12}
                  color={event.status === 'LIVE' ? '#ef4444' : '#818cf8'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: event.status === 'LIVE' ? '#ef4444' : '#818cf8' },
                  ]}
                >
                  {event.status}
                </Text>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              {event.description && (
                <Text style={styles.description}>{event.description}</Text>
              )}
            </BlurView>
          </Animated.View>

          {editing && (
            <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
              <TextInput style={styles.editInput} value={editTitle} onChangeText={setEditTitle} placeholder="Event title" placeholderTextColor="#94a3b8" />
              <TextInput style={[styles.editInput, styles.editInputMultiline]} value={editDescription} onChangeText={setEditDescription} placeholder="Description" placeholderTextColor="#94a3b8" multiline />
              <TouchableOpacity style={styles.editSaveButton} onPress={() => void saveEdit()} disabled={rsvpLoading}><Text style={styles.rsvpButtonText}>Save Changes</Text></TouchableOpacity>
            </BlurView>
          )}

          {/* Event Details Grid */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <BlurView intensity={20} tint="dark" style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="calendar-outline" size={20} color="#818cf8" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>{formattedDate}</Text>
                  <Text style={styles.detailValue}>
                    {formattedTime} - {endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons
                    name={event.mode === 'ONLINE' ? 'globe-outline' : 'location-outline'}
                    size={20}
                    color={event.mode === 'ONLINE' ? '#10b981' : '#f59e0b'}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    {event.mode === 'ONLINE' ? 'Online Event' : 'Location'}
                  </Text>
                  {event.mode === 'ONLINE' ? (
                    <>
                      {event.platform && <Text style={styles.detailValue}>{event.platform}</Text>}
                      {event.meetingUrl && (
                        <Text style={[styles.detailValue, { color: '#818cf8' }]}>
                          Join meeting
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      {event.venue && <Text style={styles.detailValue}>{event.venue}</Text>}
                      {event.location && <Text style={styles.detailValue}>{event.location}</Text>}
                    </>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <Ionicons name="people-outline" size={20} color="#10b981" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Attendees</Text>
                  <Text style={styles.detailValue}>
                    {event.attendeeCount} person{event.attendeeCount !== 1 ? 's' : ''} going
                  </Text>
                  {event.capacity && (
                    <Text style={styles.detailValue}>
                      Capacity: {event.capacity}
                    </Text>
                  )}
                  {event.waitlistStatus === 'WAITLISTED' && (
                    <Text style={styles.detailValue}>
                      Waitlist position: {event.waitlistPosition}
                    </Text>
                  )}
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Organizer Info */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <BlurView intensity={20} tint="dark" style={styles.organizerCard}>
              <Text style={styles.sectionTitle}>Organized by</Text>
              <View style={styles.organizerInfo}>
                <View
                  style={[
                    styles.organizerAvatar,
                    { backgroundColor: '#818cf8' },
                  ]}
                >
                  <Text style={styles.organizerAvatarText}>
                    {event.organizer.firstName?.charAt(0) ||
                      event.organizer.username.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.organizerName}>
                    {event.organizer.firstName || event.organizer.username}
                  </Text>
                  <Text style={styles.organizerUsername}>
                    @{event.organizer.username}
                  </Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Attendees List */}
          {event.attendees && event.attendees.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <BlurView intensity={20} tint="dark" style={styles.attendeesCard}>
                <Text style={styles.sectionTitle}>Attendees ({event.attendees.length})</Text>
                {event.attendees.slice(0, 5).map((attendee, idx) => (
                  <View key={attendee.id} style={[styles.attendeeRow, idx !== Math.min(4, event.attendees.length - 1) && styles.attendeeDivider]}>
                    <View
                      style={[
                        styles.attendeeAvatar,
                        { backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)` },
                      ]}
                    >
                      <Text style={styles.attendeeAvatarText}>
                        {attendee.firstName?.charAt(0) || attendee.username.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attendeeName}>
                        {attendee.firstName || attendee.username}
                      </Text>
                      <Text style={styles.attendeeStatus}>{attendee.rsvpStatus}</Text>
                    </View>
                  </View>
                ))}
                {event.attendees.length > 5 && (
                  <Text style={styles.moreAttendees}>
                    +{event.attendees.length - 5} more
                  </Text>
                )}
              </BlurView>
            </Animated.View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* RSVP Buttons */}
        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={[styles.rsvpContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <BlurView intensity={40} tint="dark" style={styles.rsvpButtons}>
            <TouchableOpacity
              style={[
                styles.rsvpButton,
                styles.goingButton,
                event.userAttendanceStatus === 'GOING' && styles.rsvpButtonActive,
              ]}
              onPress={() => handleRsvp('GOING')}
              disabled={rsvpLoading}
            >
              {rsvpLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={
                      event.userAttendanceStatus === 'GOING'
                        ? 'checkmark-circle'
                        : 'checkmark-circle-outline'
                    }
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.rsvpButtonText}>
                    {event.waitlistStatus === 'WAITLISTED'
                      ? 'Leave Waitlist'
                      : event.userAttendanceStatus === 'GOING'
                        ? 'Leave Event'
                        : event.isFull
                          ? 'Join Waitlist'
                          : 'Join Event'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {currentUserId === event.organizer.id && <TouchableOpacity
              style={[
                styles.rsvpButton,
                styles.interestedButton,
                event.userAttendanceStatus === 'INTERESTED' && styles.rsvpButtonActive,
              ]}
              onPress={handleDelete}
              disabled={rsvpLoading}
            >
              {rsvpLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.rsvpButtonText}>Delete Event</Text>
                </>
              )}
            </TouchableOpacity>}
          </BlurView>
        </Animated.View>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 120,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },
  titleCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#f8fafc',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  organizerCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  organizerUsername: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  attendeesCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  attendeeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  attendeeStatus: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  moreAttendees: {
    fontSize: 13,
    color: '#818cf8',
    fontWeight: '600',
    marginTop: 12,
  },
  rsvpContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 85 : 75,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  goingButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  interestedButton: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  rsvpButtonActive: {
    backgroundColor: 'rgba(129, 140, 248, 0.3)',
    borderColor: 'rgba(129, 140, 248, 0.5)',
  },
  rsvpButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  editInput: {
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  editInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editSaveButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(129, 140, 248, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
  },
  retryButtonText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '600',
  },
});