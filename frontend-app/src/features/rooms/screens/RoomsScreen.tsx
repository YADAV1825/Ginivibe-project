import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoomsAPI } from '../api/RoomsAPI';
import { Room, RoomFilter, RoomType, CreateRoomInput } from '../types';
import { RoomCard } from '../components/RoomCard';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { JoinPrivateModal } from '../components/JoinPrivateModal';

const FILTER_TABS: { label: string; value: RoomFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'My Rooms', value: 'mine' },
];

const TYPE_FILTERS: { label: string; value?: RoomType; icon: any }[] = [
  { label: 'All Types', value: undefined, icon: 'apps-outline' },
  { label: 'Text', value: 'TEXT', icon: 'chatbubble-ellipses-outline' },
  { label: 'Voice', value: 'VOICE', icon: 'mic-outline' },
  { label: 'Video', value: 'VIDEO', icon: 'videocam-outline' },
];

export default function RoomsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeFilter, setActiveFilter] = useState<RoomFilter>('all');
  const [activeType, setActiveType] = useState<RoomType | undefined>(undefined);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [privateRoomToJoin, setPrivateRoomToJoin] = useState<Room | null>(null);

  // 1. Resolve current user ID
  useEffect(() => {
    (async () => {
      const storedId =
        (await AsyncStorage.getItem('ginivibe_user_id')) ||
        (await AsyncStorage.getItem('user_id'));
      if (storedId) {
        setCurrentUserId(storedId);
        return;
      }
      const storedUser = await AsyncStorage.getItem('ginivibe_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const resolved = parsed.id || parsed.userId || parsed._id;
          if (resolved) {
            setCurrentUserId(resolved);
            await AsyncStorage.setItem('ginivibe_user_id', resolved);
          }
        } catch {}
      }
    })();
  }, []);

  // 2. Fetch rooms
  const loadRooms = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await RoomsAPI.list(activeFilter, activeType);
      setRooms(data);
    } catch (err: any) {
      console.warn('[RoomsScreen] Failed to load rooms:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, activeType]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRooms(true);
  };

  // Filtered rooms by search query
  const displayedRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const query = searchQuery.trim().toLowerCase();
    return rooms.filter((r) => r.name.toLowerCase().includes(query));
  }, [rooms, searchQuery]);

  // Handle Joining Room
  const handleRoomPress = async (room: Room) => {
    if (room.visibility === 'PRIVATE') {
      setPrivateRoomToJoin(room);
    } else {
      enterRoom(room);
    }
  };

  const enterRoom = async (room: Room, accessCode?: string) => {
    try {
      const res = await RoomsAPI.join(room.id, accessCode);
      router.push({
        pathname: '/rooms/[id]' as any,
        params: {
          id: room.id,
          name: room.name,
          type: room.type,
          visibility: room.visibility,
          token: res.token,
          tokenType: res.tokenType,
          livekitUrl: res.livekitUrl || '',
        },
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to join room';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Room Join Error', msg);
      }
    }
  };

  // Handle Room Deletion
  const handleDeleteRoom = (room: Room) => {
    const confirmDelete = async () => {
      try {
        await RoomsAPI.delete(room.id);
        setRooms((prev) => prev.filter((r) => r.id !== room.id));
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not delete room');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete room "${room.name}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Room',
        `Are you sure you want to permanently delete "${room.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // Handle Room Creation
  const handleCreateRoom = async (input: CreateRoomInput) => {
    const newRoom = await RoomsAPI.create(input);
    // Enter the room immediately
    enterRoom(newRoom, input.accessCode);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/home');
            }}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#f8fafc" />
          </TouchableOpacity>

          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Community Lounges</Text>
              <View style={styles.livePulse}>
                <View style={styles.livePulseDot} />
              </View>
            </View>
            <Text style={styles.subtitle}>Drop into live Voice, Video & Text spaces</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCreateModalVisible(true);
          }}
          style={styles.createBtnWrapper}
        >
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createBtn}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.createBtnText}>Host</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search lounges by name..."
            placeholderTextColor="#64748b"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter(tab.value);
            }}
            style={[styles.tabBtn, activeFilter === tab.value && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeFilter === tab.value && styles.tabBtnTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filter Chips */}
      <View style={styles.typeChipsContainer}>
        {TYPE_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveType(item.value);
            }}
            style={[
              styles.typeChip,
              activeType === item.value && styles.typeChipActive,
            ]}
          >
            <Ionicons
              name={item.icon}
              size={14}
              color={activeType === item.value ? '#c084fc' : '#64748b'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.typeChipText,
                activeType === item.value && styles.typeChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rooms List */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Finding active lounges...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedRooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              currentUserId={currentUserId}
              onPress={handleRoomPress}
              onDelete={handleDeleteRoom}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#a855f7"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="radio-outline" size={36} color="#818cf8" />
              </View>
              <Text style={styles.emptyTitle}>No Lounges Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No rooms matching "${searchQuery}"`
                  : activeFilter === 'mine'
                  ? "You haven't created any rooms yet. Be the first to start a conversation!"
                  : 'There are no active lounges right now. Create one and invite the community!'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setCreateModalVisible(true)}
                style={styles.emptyActionBtn}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6366f1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyGradient}
                >
                  <Ionicons name="add" size={18} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.emptyActionBtnText}>Create a Lounge</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modals */}
      <CreateRoomModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateRoom}
      />

      <JoinPrivateModal
        room={privateRoomToJoin}
        visible={Boolean(privateRoomToJoin)}
        onClose={() => setPrivateRoomToJoin(null)}
        onSubmit={async (pin) => {
          if (privateRoomToJoin) {
            await enterRoom(privateRoomToJoin, pin);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  livePulse: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  createBtnWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    padding: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  typeChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  typeChipActive: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: '#c084fc',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  typeChipTextActive: {
    color: '#c084fc',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 6,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
