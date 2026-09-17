'use client';

import React, { useState } from 'react';
import { Crown, LogOut, Pencil, Search, Trash2, UserMinus, Users, X } from 'lucide-react';
import { Button } from '@/app/core/components/Button';
import { Avatar } from '@/app/core/components/Avatar';
import { chatApi, type ChatUser, type Conversation } from '@/lib/api/chat';

export function GroupMembersModal({
  conversation,
  currentUserId,
  onClose,
  onChanged,
  onLeft,
}: {
  conversation: Conversation;
  currentUserId: string | null;
  onClose: () => void;
  onChanged: () => void;
  onLeft: () => void;
}) {
  const myMembership = conversation.members.find((m) => m.userId === currentUserId);
  const isAdmin = myMembership?.role === 'admin';
  const [members, setMembers] = useState(conversation.members);
  const [title, setTitle] = useState(conversation.title ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
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
      const memberIds = new Set(members.map((m) => m.userId));
      setResults(users.filter((u) => u.id !== currentUserId && !memberIds.has(u.id)));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (user: ChatUser) => {
    setBusy(true);
    setError(null);
    try {
      const res = await chatApi.addGroupMembers(conversation.id, [user.id]);
      setMembers(res.members);
      setResults((prev) => prev.filter((u) => u.id !== user.id));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add member');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (userId: string) => {
    const target = members.find((m) => m.userId === userId);
    const leaving = userId === currentUserId;
    if (!leaving && !window.confirm(`Remove @${target?.user.username} from the group?`)) return;
    if (leaving && !window.confirm('Leave this group?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await chatApi.removeGroupMember(conversation.id, userId);
      if (leaving || res.deleted) {
        onLeft();
        return;
      }
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async () => {
    if (title.trim().length < 3) {
      setError('Group name must be at least 3 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await chatApi.renameGroup(conversation.id, title.trim());
      setEditingTitle(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename group');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Delete "${conversation.title}" for everyone? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await chatApi.deleteConversation(conversation.id);
      onLeft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete group');
    } finally {
      setBusy(false);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={19} /> Group info
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

        {editingTitle && isAdmin ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)' }}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)', fontSize: '0.92rem',
              }}
            />
            <Button size="sm" onClick={() => void handleRename()} disabled={busy}>Save</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title || 'Group chat'}
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                title="Rename group"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <Pencil size={15} />
              </button>
            )}
          </div>
        )}

        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
          {members.length} member{members.length === 1 ? '' : 's'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: isAdmin ? 'var(--space-4)' : 'var(--space-2)' }}>
          {members.map((m) => {
            const isSelf = m.userId === currentUserId;
            const canRemove = isAdmin && !isSelf && m.role !== 'admin';
            return (
              <div
                key={m.userId}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '12px',
                  background: 'transparent',
                }}
              >
                <Avatar person={{ id: m.user.id, username: m.user.username, firstName: m.user.firstName }} size="sm" />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.user.firstName || m.user.username}
                      {isSelf ? ' (you)' : ''}
                    </span>
                    {m.role === 'admin' && (
                      <span title="Admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Crown size={12} /> Admin
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>@{m.user.username}</span>
                </span>
                {(canRemove || isSelf) && (
                  <button
                    type="button"
                    onClick={() => void handleRemove(m.userId)}
                    disabled={busy}
                    title={isSelf ? 'Leave group' : `Remove @${m.user.username}`}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '6px' }}
                  >
                    {isSelf ? <LogOut size={16} /> : <UserMinus size={16} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
              Add members
            </p>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                value={query}
                onChange={(e) => void runSearch(e.target.value)}
                placeholder="Search people (min 2 letters)"
                style={{
                  width: '100%', padding: '10px 12px 10px 36px', borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)', fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto', marginBottom: 'var(--space-4)' }}>
              {searching && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Searching…</p>}
              {results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => void handleAdd(u)}
                  disabled={busy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '12px',
                    border: 'none', background: 'transparent',
                    color: 'var(--color-text-primary)', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Avatar person={{ id: u.id, username: u.username, firstName: u.firstName }} size="sm" />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{u.username}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-accent)' }}>ADD</span>
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', margin: '0 0 12px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isAdmin && (
            <Button variant="secondary" fullWidth onClick={() => currentUserId && void handleRemove(currentUserId)} disabled={busy}>
              <LogOut size={15} style={{ marginRight: '6px' }} /> Leave group
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" fullWidth onClick={() => void handleDeleteGroup()} disabled={busy} style={{ color: 'var(--color-error)' }}>
              <Trash2 size={15} style={{ marginRight: '6px' }} /> Delete group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
