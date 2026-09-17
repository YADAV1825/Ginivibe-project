'use client';

import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { Button } from '@/app/core/components/Button';
import { Avatar } from '@/app/core/components/Avatar';
import { chatApi, type ChatUser, type Conversation } from '@/lib/api/chat';

export function CreateGroupModal({
  currentUserId,
  onClose,
  onCreated,
}: {
  currentUserId: string | null;
  onClose: () => void;
  onCreated: (conversation: Conversation) => void;
}) {
  const [title, setTitle] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ChatUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (term: string) => {
    setQuery(term);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const users = await chatApi.searchUsers(term.trim());
      setResults(users.filter((u) => u.id !== currentUserId));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleSelect = (user: ChatUser) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (title.trim().length < 3) {
      setError('Give your group a name (at least 3 characters).');
      return;
    }
    if (selected.length < 1) {
      setError('Add at least one member to the group.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const group = await chatApi.createGroup(
        title.trim(),
        selected.map((u) => u.id)
      );
      onCreated(group);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px', maxHeight: '85vh', overflowY: 'auto',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          padding: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={19} /> New group
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }} htmlFor="group-title">
          Group name
        </label>
        <input
          id="group-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Weekend Riders"
          maxLength={60}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '12px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-elevated)',
            color: 'var(--color-text-primary)', fontSize: '0.92rem',
            marginBottom: 'var(--space-4)',
          }}
        />

        {selected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 'var(--space-3)' }}>
            {selected.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleSelect(u)}
                title="Remove"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 6px 5px 5px', borderRadius: '999px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Avatar person={{ id: u.id, username: u.username, firstName: u.firstName }} size="xs" />
                @{u.username}
                <X size={13} />
              </button>
            ))}
          </div>
        )}

        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }} htmlFor="group-search">
          Add members
        </label>
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            id="group-search"
            value={query}
            onChange={(e) => void runSearch(e.target.value)}
            placeholder="Search people (min 2 letters)"
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)', fontSize: '0.92rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto', marginBottom: 'var(--space-4)' }}>
          {searching && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Searching…</p>}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No people found.</p>
          )}
          {results.map((u) => {
            const isSelected = selected.some((s) => s.id === u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleSelect(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '12px',
                  border: isSelected ? '1px solid var(--color-accent)' : '1px solid transparent',
                  background: isSelected ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent',
                  color: 'var(--color-text-primary)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Avatar person={{ id: u.id, username: u.username, firstName: u.firstName }} size="sm" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.firstName || u.username}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>@{u.username}</span>
                </span>
                {isSelected && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent)' }}>ADDED</span>}
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', margin: '0 0 12px' }}>{error}</p>
        )}

        <Button fullWidth onClick={() => void handleCreate()} disabled={creating}>
          {creating ? 'Creating…' : `Create group${selected.length > 0 ? ` (${selected.length + 1} members)` : ''}`}
        </Button>
      </div>
    </div>
  );
}
