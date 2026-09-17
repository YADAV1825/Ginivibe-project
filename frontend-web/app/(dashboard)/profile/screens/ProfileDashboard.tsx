'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Input } from '@/app/core/components/Input';
import { Avatar } from '@/app/core/components/Avatar';
import { chatApi, type ChatUser, type PublicProfile } from '@/lib/api/chat';

export function ProfileDashboard() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [listKind, setListKind] = useState<'followers' | 'following' | null>(null);
  const [listPeople, setListPeople] = useState<ChatUser[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);

  // ?userId=… → view someone else's profile instead of our own.
  const [viewedId, setViewedId] = useState<string | null>(null);
  useEffect(() => {
    setViewedId(new URLSearchParams(window.location.search).get('userId'));
  }, []);
  const isViewingOther = !!viewedId && viewedId !== user?.id;

  const [other, setOther] = useState<PublicProfile | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!isViewingOther || !viewedId) return;
    let cancelled = false;
    setOtherLoading(true);
    setOtherError(null);
    chatApi
      .getProfile(viewedId)
      .then((profile) => {
        if (cancelled) return;
        if (profile.isSelf) {
          // Backend says it's us (id match) — fall back to self view.
          setViewedId(null);
          return;
        }
        setOther(profile);
      })
      .catch((err) => {
        if (!cancelled) setOtherError(err instanceof Error ? err.message : 'Could not load profile');
      })
      .finally(() => {
        if (!cancelled) setOtherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isViewingOther, viewedId]);

  const toggleFollowOther = async () => {
    if (!other || followBusy) return;
    setFollowBusy(true);
    try {
      if (other.isFollowing) {
        await chatApi.unfollowUser(other.id);
        setOther({
          ...other,
          isFollowing: false,
          followStatus: null,
          followersCount: Math.max(0, other.followersCount - 1),
        });
      } else {
        await chatApi.followUser(other.id);
        setOther({
          ...other,
          isFollowing: true,
          followStatus: 'ACCEPTED',
          followersCount: other.followersCount + 1,
        });
      }
    } catch {
      // keep current state; counts refresh on revisit
    } finally {
      setFollowBusy(false);
    }
  };

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    Promise.all([chatApi.getFollowers(userId), chatApi.getFollowing(userId)]).then(
      ([followers, following]) => {
        setFollowersCount(followers.count);
        setFollowingCount(following.count);
      },
      () => undefined,
    );
  }, [user?.id]);

  const openList = async (kind: 'followers' | 'following') => {
    const userId = user?.id;
    if (!userId) return;
    setListKind(kind);
    setIsListLoading(true);
    try {
      const result = kind === 'followers' ? await chatApi.getFollowers(userId) : await chatApi.getFollowing(userId);
      setListPeople(result.data);
    } catch {
      setListPeople([]);
    } finally {
      setIsListLoading(false);
    }
  };
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    interests: user?.interests?.join(', ') || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({
        ...user,
        name: formData.name,
        bio: formData.bio,
        interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean),
        avatarUrl: formData.avatarUrl || user.avatarUrl
      });
      // In a real app we'd call an API here. Since we rely on context:
      // localStorage.setItem('user', JSON.stringify(updatedUser)); // if supported
    }
    setIsEditing(false);
  };

  if (isViewingOther) {
    const displayName = other
      ? `${other.firstName || other.username}${other.lastName ? ` ${other.lastName}` : ''}`
      : '';
    return (
      <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: 'var(--space-6)' }}>
          <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: 'var(--space-2)' }}>Profile</h1>
        </header>
        <Card>
          <CardContent style={{ padding: 'var(--space-8)' }}>
            {otherLoading && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading profile…</p>}
            {!otherLoading && (otherError || !other) && (
              <p style={{ color: 'var(--color-error)', textAlign: 'center' }}>{otherError ?? 'Profile not found.'}</p>
            )}
            {!otherLoading && other && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
                <img
                  src={other.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.id}`}
                  alt={displayName}
                  style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-surface-elevated)', objectFit: 'cover' }}
                />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{displayName}</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>@{other.username}</p>
                <div style={{ display: 'flex', gap: 'var(--space-5)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{other.followersCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Followers</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{other.followingCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Following</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <Button
                    variant={other.isFollowing ? 'secondary' : undefined}
                    onClick={() => void toggleFollowOther()}
                    disabled={followBusy}
                  >
                    {other.isFollowing ? 'Following ✓' : other.followStatus === 'PENDING' ? 'Requested' : 'Follow'}
                  </Button>
                  <Button variant="secondary" onClick={() => router.push(`/messages?userId=${other.id}`)}>
                    Message
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {!otherLoading && other && (
          <Card style={{ marginTop: 'var(--space-6)' }}>
            <CardContent style={{ padding: 'var(--space-8)' }}>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>About Me</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{other.bio || 'No bio provided.'}</p>
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Interests</h3>
                {other.interests.length > 0 ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {other.interests.map((interest) => (
                      <span
                        key={interest}
                        style={{
                          fontSize: '0.875rem', padding: 'var(--space-1) var(--space-3)',
                          backgroundColor: 'var(--color-surface-elevated)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)' }}>No interests added.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Profile</h1>
      </header>

      <Card>
        <CardContent style={{ padding: 'var(--space-8)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
            <img 
              src={user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'} 
              alt={user?.name} 
              style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)', backgroundColor: 'var(--color-surface-elevated)' }} 
            />
            {!isEditing && (
              <>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{user?.name}</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>{user?.email}</p>
                <div style={{ display: 'flex', gap: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                  <button
                    type="button"
                    onClick={() => void openList('followers')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{followersCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Followers</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void openList('following')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{followingCount}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Following</div>
                  </button>
                </div>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              </>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Avatar URL</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Input 
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatarUrl} 
                    onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})} 
                    style={{ flex: 1 }}
                  />
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <img 
                      src={formData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder' }}
                    />
                  </div>
                </div>
              </div>
              <Input 
                label="Name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              <Input 
                label="Interests (comma separated)" 
                value={formData.interests} 
                onChange={(e) => setFormData({...formData, interests: e.target.value})} 
              />
              
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', justifyContent: 'flex-end' }}>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>About Me</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{user?.bio || 'No bio provided.'}</p>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Interests</h3>
                {user?.interests && user.interests.length > 0 ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {user.interests.map(interest => (
                      <span key={interest} style={{ 
                        fontSize: '0.875rem', padding: 'var(--space-1) var(--space-3)', 
                        backgroundColor: 'var(--color-surface-elevated)', 
                        borderRadius: 'var(--radius-full)', 
                        color: 'var(--color-text-secondary)' 
                      }}>
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)' }}>No interests added.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {listKind !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(22, 24, 29, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)',
          }}
          onClick={() => setListKind(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: '420px', maxHeight: '70vh', overflowY: 'auto',
              backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '20px', padding: 'var(--space-5)', boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 var(--space-3)', textTransform: 'capitalize' }}>
              {listKind} ({listKind === 'followers' ? followersCount : followingCount})
            </h3>
            {isListLoading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
            {!isListLoading && listPeople.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>Nobody here yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {listPeople.map((person) => (
                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <Avatar person={{ id: person.id, username: person.username, firstName: person.firstName, lastName: person.lastName ?? null }} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {person.firstName ? `${person.firstName} ${person.lastName ?? ''}`.trim() : person.username}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>@{person.username}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <Button variant="ghost" onClick={() => setListKind(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
