'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, MessageSquare, Mic, Video, Lock, Globe,
  Trash2, Radio, Sparkles, RefreshCw
} from 'lucide-react';
import { RoomsApi, type Room, type RoomType, type RoomFilter } from '../api/rooms';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { JoinPrivateModal } from '../components/JoinPrivateModal';
import { useAuth } from '@/app/core/providers/AuthProvider';
import styles from '../rooms.module.css';

const TABS: { id: RoomFilter; label: string }[] = [
  { id: 'all', label: 'All Rooms' },
  { id: 'public', label: 'Open' },
  { id: 'private', label: 'Private' },
  { id: 'mine', label: 'Created by Me' },
  { id: 'joined', label: 'Joined' },
];

const TYPES: { id: RoomType | 'ALL'; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'ALL', label: 'All Types', icon: Sparkles },
  { id: 'TEXT', label: 'Text Chat', icon: MessageSquare },
  { id: 'VOICE', label: 'Voice Rooms', icon: Mic },
  { id: 'VIDEO', label: 'Video Calls', icon: Video },
];

export function RoomsDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState<RoomFilter>('all');
  const [activeType, setActiveType] = useState<RoomType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [privateRoomToJoin, setPrivateRoomToJoin] = useState<Room | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const typeParam = activeType === 'ALL' ? undefined : activeType;
      const data = await RoomsApi.list(activeTab, typeParam);
      setRooms(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load rooms');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, activeType]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const handleJoinClick = (room: Room) => {
    if (room.visibility === 'PRIVATE') {
      setPrivateRoomToJoin(room);
    } else {
      router.push(`/rooms/${room.id}`);
    }
  };

  const handlePrivateJoinConfirm = async (roomId: string, accessCode: string) => {
    // Attempt join to verify access code
    const res = await RoomsApi.join(roomId, accessCode);
    if (res && res.token) {
      // Store token in session storage or pass via route state/query
      sessionStorage.setItem(`room_token_${roomId}`, res.token);
      if (res.livekitUrl) {
        sessionStorage.setItem(`room_livekit_${roomId}`, res.livekitUrl);
      }
      router.push(`/rooms/${roomId}`);
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to end and delete this room?')) return;

    try {
      await RoomsApi.delete(roomId);
      await loadRooms();
    } catch (err: any) {
      alert(err.message || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <Radio size={28} color="var(--color-accent)" />
            Live Rooms
          </h1>
          <p>Real-time group collaboration: instant text channels, voice lounges, and HD video calls.</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Rooms left empty for more than 10 minutes close automatically.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => void loadRooms()}
            className={styles.typeChip}
            title="Refresh"
            style={{ padding: '0.65rem 0.9rem' }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className={styles.createBtn} onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchAndTabs}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search rooms by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.tabList}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter Chips */}
        <div className={styles.typeFilterRow}>
          {TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                className={`${styles.typeChip} ${activeType === type.id ? styles.typeChipActive : ''}`}
                onClick={() => setActiveType(type.id)}
              >
                <Icon size={14} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorBanner} style={{ marginBottom: 'var(--space-6)' }}>
          <span>{error}</span>
          <button
            onClick={() => void loadRooms()}
            style={{ marginLeft: 'auto', textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <RefreshCw size={28} className="animate-spin" color="var(--color-accent)" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Loading rooms...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Users size={28} />
          </div>
          <h3>No rooms found</h3>
          <p>
            {searchQuery
              ? `No rooms matched your search "${searchQuery}".`
              : activeTab === 'mine'
              ? "You haven't created any rooms yet. Start one for your friends or team!"
              : 'There are no active rooms in this section right now.'}
          </p>
          <button className={styles.createBtn} onClick={() => setIsCreateOpen(true)} style={{ margin: '0 auto' }}>
            <Plus size={18} />
            <span>Create the First Room</span>
          </button>
        </div>
      ) : (
        <div className={styles.roomsGrid}>
          {filteredRooms.map((room) => {
            const isCreator = user?.id === room.creatorId;

            return (
              <div key={room.id} className={styles.roomCard}>
                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.badgeGroup}>
                      {room.type === 'TEXT' && (
                        <span className={`${styles.typeBadge} ${styles.typeBadgeText}`}>
                          <MessageSquare size={12} /> Text
                        </span>
                      )}
                      {room.type === 'VOICE' && (
                        <span className={`${styles.typeBadge} ${styles.typeBadgeVoice}`}>
                          <Mic size={12} /> Voice
                        </span>
                      )}
                      {room.type === 'VIDEO' && (
                        <span className={`${styles.typeBadge} ${styles.typeBadgeVideo}`}>
                          <Video size={12} /> Video
                        </span>
                      )}

                      {room.visibility === 'PRIVATE' ? (
                        <span className={`${styles.visibilityBadge} ${styles.visibilityPrivate}`}>
                          <Lock size={12} /> PIN
                        </span>
                      ) : (
                        <span className={`${styles.visibilityBadge} ${styles.visibilityOpen}`}>
                          <Globe size={12} /> Open
                        </span>
                      )}
                    </div>

                    <div className={styles.liveIndicator}>
                      <span className={styles.livePulseDot} />
                      <span>Live</span>
                    </div>
                  </div>

                  <h2 className={styles.roomName}>{room.name}</h2>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.occupancyInfo}>
                    <Users size={15} />
                    <span>
                      <strong>{room.currentParticipantsCount ?? 0}</strong> / {room.maxCapacity}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCreator && (
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteRoom(e, room.id)}
                        title="Delete this room"
                        aria-label="Delete room"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <button className={styles.joinBtn} onClick={() => handleJoinClick(room)}>
                      <span>Join Room</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newRoom) => {
          void loadRooms();
          router.push(`/rooms/${newRoom.id}`);
        }}
      />

      <JoinPrivateModal
        room={privateRoomToJoin}
        isOpen={!!privateRoomToJoin}
        onClose={() => setPrivateRoomToJoin(null)}
        onConfirm={handlePrivateJoinConfirm}
      />
    </div>
  );
}
