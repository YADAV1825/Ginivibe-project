import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedBackground from '../../../components/AnimatedBackground';
import AnimatedPressable from '../../../components/AnimatedPressable';
import {
  EventResponse,
  getEvents,
  getPersonalizedEvents,
  getMyOrganizedEvents,
  getMyAttendingEvents,
  rsvpToEvent,
} from '../api/EventsAPI';

type FilterKey =
  | 'all'
  | 'live'
  | 'upcoming'
  | 'online'
  | 'offline'
  | 'personalized'
  | 'organized'
  | 'attending';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All Events' },
  { key: 'live', label: 'Live Now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'In-Person' },
  { key: 'personalized', label: 'Personalized' },
  { key: 'organized', label: 'Organized' },
  { key: 'attending', label: 'Attending' },
];

const STATUS_COLORS: Record<string, string> = {
  LIVE: '#ef4444',
  FUTURE: '#818cf8',
  ENDED: '#64748b',
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ', ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

async function fetchByFilter(filter: FilterKey) {
  switch (filter) {
    case 'live':
      return (await getEvents('live')).data;
    case 'upcoming':
      return (await getEvents('future')).data;
    case 'online':
      return (await getEvents(undefined, 'online')).data;
    case 'offline':
      return (await getEvents(undefined, 'offline')).data;
    case 'personalized':
      return (await getPersonalizedEvents()).data;
    case 'organized':
      return (await getMyOrganizedEvents()).data;
    case 'attending':
      return (await getMyAttendingEvents()).data;
    case 'all':
    default:
      return (await getEvents()).data;
  }
}

function EventCard({ event, index, onPress, onJoin }: { event: EventResponse; index: number; onPress: () => void; onJoin: () => void }) {
  const isGoing = event.userAttendanceStatus === 'GOING';

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 60).springify()}>
      <AnimatedPressable scaleTo={0.97} onPress={onPress}>
        <BlurView intensity={20} tint="dark" style={styles.card}>
          {event.bannerImageUrl ? (
            <Image source={{ uri: event.bannerImageUrl }} style={styles.banner} resizeMode="cover" />
          ) : (
            <View style={[styles.banner, styles.bannerFallback]}>
              <Ionicons name="calendar-outline" size={32} color="#475569" />
            </View>
          )}

          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[event.status]}22` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[event.status] }]}>{event.status}</Text>
              </View>
              <View style={styles.attendeeRow}>
                <Ionicons name="people-outline" size={13} color="#94a3b8" />
                <Text style={styles.attendeeText}>{event.attendeeCount}</Text>
              </View>
            </View>

            <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color="#94a3b8" />
              <Text style={styles.metaText}>{formatDate(event.startAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name={event.mode === 'ONLINE' ? 'videocam-outline' : 'location-outline'} size={13} color="#94a3b8" />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.mode === 'ONLINE' ? (event.platform || 'Online Event') : (event.location || event.venue || 'In-Person')}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.detailsBtn} onPress={onPress}>
                <Text style={styles.detailsBtnText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.joinBtn, isGoing && styles.joinBtnActive]}
                onPress={onJoin}
                disabled={isGoing || event.isFull}
              >
                <Text style={styles.joinBtnText}>
                  {isGoing ? 'Going' : event.isFull ? 'Full' : 'Join Event'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchByFilter(filter);
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  const handleJoin = async (eventId: string) => {
    try {
      await rsvpToEvent(eventId, 'GOING');
      load(false);
    } catch (err) {
      // surfaced via card state on next load
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/events/create' as any)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, filter === f.key && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#818cf8" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#818cf8" />}
          >
            {error && <Text style={styles.errorText}>{error}</Text>}
            {!error && events.length === 0 && (
              <Text style={styles.emptyText}>No events found for this filter.</Text>
            )}
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                onPress={() => router.push(`/events/${event.id}` as any)}
                onJoin={() => handleJoin(event.id)}
              />
            ))}
            <View style={{ height: 80 }} />
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterPillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  banner: {
    width: '100%',
    height: 140,
  },
  bannerFallback: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 13,
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailsBtnText: {
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: 13,
  },
  joinBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  joinBtnActive: {
    backgroundColor: '#22c55e',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
});
