'use client';

import React, { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';
import { type Room } from '../api/rooms';
import styles from '../rooms.module.css';

interface JoinPrivateModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (roomId: string, accessCode: string) => Promise<void>;
}

export function JoinPrivateModal({ room, isOpen, onClose, onConfirm }: JoinPrivateModalProps) {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode) {
      setError('Please enter the access PIN');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onConfirm(room.id, accessCode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid access code or failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className={styles.modalHeader}>
          <h2>Private Room</h2>
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

            <div style={{ textAlign: 'center', margin: 'var(--space-2) 0' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
                  color: 'var(--color-error)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{room.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                This room is protected. Enter the PIN code provided by the creator to enter.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Access PIN</label>
              <input
                type="password"
                className={styles.formInput}
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Verifying...' : 'Unlock & Join'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
