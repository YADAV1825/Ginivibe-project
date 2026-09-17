'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Mic, Video, Lock, Globe, AlertCircle } from 'lucide-react';
import { RoomsApi, type CreateRoomInput, type Room, type RoomType, type RoomVisibility } from '../api/rooms';
import styles from '../rooms.module.css';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: Room) => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('TEXT');
  const [visibility, setVisibility] = useState<RoomVisibility>('OPEN');
  const [accessCode, setAccessCode] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 3) {
      setError('Room name must be at least 3 characters');
      return;
    }

    if (visibility === 'PRIVATE' && (!accessCode || accessCode.length < 4)) {
      setError('Private rooms require an access code of at least 4 characters');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const input: CreateRoomInput = {
        name: name.trim(),
        type,
        visibility,
        maxCapacity: Number(maxCapacity),
        ...(visibility === 'PRIVATE' ? { accessCode } : {}),
      };

      const created = await RoomsApi.create(input);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create New Room</h2>
          <button className={styles.closeModalBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Room Name</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Design Sync, Chill Lounge, Team Huddle"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Room Type</label>
              <div className={styles.typeSelectGrid}>
                <div
                  className={`${styles.typeOption} ${type === 'TEXT' ? styles.typeOptionSelected : ''}`}
                  onClick={() => setType('TEXT')}
                >
                  <MessageSquare size={22} color="var(--color-accent)" />
                  <span className={styles.typeOptionTitle}>Text Chat</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Persistent DB chat</span>
                </div>

                <div
                  className={`${styles.typeOption} ${type === 'VOICE' ? styles.typeOptionSelected : ''}`}
                  onClick={() => setType('VOICE')}
                >
                  <Mic size={22} color="var(--color-accent)" />
                  <span className={styles.typeOptionTitle}>Voice Room</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>Live audio SFU</span>
                </div>

                <div
                  className={`${styles.typeOption} ${type === 'VIDEO' ? styles.typeOptionSelected : ''}`}
                  onClick={() => setType('VIDEO')}
                >
                  <Video size={22} color="var(--color-accent)" />
                  <span className={styles.typeOptionTitle}>Video Call</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>HD video & screen</span>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Visibility</label>
              <div className={styles.visibilityToggle}>
                <button
                  type="button"
                  className={`${styles.visibilityBtn} ${visibility === 'OPEN' ? styles.visibilityBtnSelected : ''}`}
                  onClick={() => setVisibility('OPEN')}
                >
                  <Globe size={16} />
                  <span>Open (Public)</span>
                </button>
                <button
                  type="button"
                  className={`${styles.visibilityBtn} ${visibility === 'PRIVATE' ? styles.visibilityBtnSelected : ''}`}
                  onClick={() => setVisibility('PRIVATE')}
                >
                  <Lock size={16} />
                  <span>Private (PIN)</span>
                </button>
              </div>
            </div>

            {visibility === 'PRIVATE' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Access Code (PIN)</label>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="At least 4 characters/digits"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  minLength={4}
                  required
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Capacity ({maxCapacity} / 30 max participants)
              </label>
              <input
                type="range"
                min={2}
                max={30}
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
