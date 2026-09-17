'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { Card, CardContent } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Input } from '@/app/core/components/Input';
import { AuthService } from '@/app/(auth)';
import { Check, Cpu, Briefcase, Film, TrendingUp, Utensils, Gamepad2, Newspaper, Trophy, Plane, HeartPulse, Sparkles } from 'lucide-react';
import styles from './Register.module.css';

const ICON_MAP: Record<string, any> = {
  Technology: Cpu,
  Finance: TrendingUp,
  Sports: Trophy,
  Entertainment: Film,
  Gaming: Gamepad2,
  Wellness: HeartPulse,
  Art: Sparkles,
  Career: Briefcase,
  Food: Utensils,
  News: Newspaper,
  Travel: Plane,
};

export function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const router = useRouter();

  // Step 1: Credentials
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  // Step 2: Demographics
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');

  // Step 3 & 4: Interests (Reddit-style: multi-select majors, then searchable subs)
  const [allInterests, setAllInterests] = useState<any[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestsError, setInterestsError] = useState('');
  const [selectedMajorInterestIds, setSelectedMajorInterestIds] = useState<string[]>([]);
  const [selectedSubInterestIds, setSelectedSubInterestIds] = useState<string[]>([]);
  const [subSearch, setSubSearch] = useState('');

  useEffect(() => {
    setInterestsLoading(true);
    setInterestsError('');
    AuthService.getInterests()
      .then((data) => {
        setAllInterests(Array.isArray(data) ? data : []);
        if (!Array.isArray(data) || data.length === 0) {
          setInterestsError('No interest categories found. Please seed the database.');
        }
      })
      .catch((err) => {
        console.error(err);
        setInterestsError('Could not load interests. Check your connection and try again.');
      })
      .finally(() => setInterestsLoading(false));
  }, []);

  const toggleMajorInterest = useCallback((id: string) => {
    setSelectedMajorInterestIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      return next;
    });
    // Prune sub-selections that no longer belong to a selected major
    setSelectedSubInterestIds((prevSubs) => {
      return prevSubs;
    });
  }, []);

  // Keep sub-selections consistent when a major is deselected
  useEffect(() => {
    if (selectedMajorInterestIds.length === 0) return;
    const allowed = new Set(
      allInterests
        .filter((i) => selectedMajorInterestIds.includes(i.id))
        .flatMap((i) => (i.subInterests || []).map((s: any) => s.id)),
    );
    setSelectedSubInterestIds((prev) => prev.filter((id) => allowed.has(id)));
  }, [selectedMajorInterestIds, allInterests]);

  // Debounced Username Check
  useEffect(() => {
    if (username.length === 0) {
      setUsernameValid(null);
      setUsernameMessage('');
      return;
    }

    if (username.length < 8) {
      setUsernameValid(false);
      setUsernameMessage('Username must be at least 8 characters.');
      return;
    }

    setUsernameValid(null);
    setUsernameMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await AuthService.checkUsername(username);
        setUsernameValid(res.valid);
        setUsernameMessage(res.message);
      } catch (err) {
        setUsernameValid(false);
        setUsernameMessage('Error checking username.');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const user = await AuthService.register({
        username, email, password,
        firstName, lastName, dob, gender,
        interests: selectedSubInterestIds
      });
      setUser(user);
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubInterest = (id: string) => {
    setSelectedSubInterestIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Card className={`glass ${styles.container}`}>
      <CardContent style={{ padding: 'var(--space-6)', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {step === 1 && (
          <>
            <div className={styles.stepHeader}>
              <h2 className={styles.title}>Join GiniVibe</h2>
              <p className={styles.subtitle}>Create your credentials</p>
            </div>
            <div className={styles.formGroup}>
              <Input 
                label="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              {username.length > 0 && (
                <span className={usernameValid ? styles.successText : styles.errorText}>
                  {usernameMessage}
                </span>
              )}
              <Input 
                label="Email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input 
                label="Password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className={styles.actions}>
              <Button 
                onClick={handleNext} 
                disabled={!usernameValid || !email || !password}
              >
                Continue
              </Button>
            </div>
            <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Already have an account? </span>
                <Link href="/login" style={{ color: 'var(--color-accent)' }}>Login here</Link>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: '8px 0' }} />
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Are you a business? </span>
                <Link href="/enterprise" style={{ color: 'var(--color-accent)' }}>Enterprise login or create an organization account</Link>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className={styles.stepHeader}>
              <h2 className={styles.title}>About You</h2>
              <p className={styles.subtitle}>Let's get to know you better</p>
            </div>
            <div className={styles.formGroup}>
              <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
              <Input label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
              <Input label="Date of Birth" type="date" value={dob} onChange={e => setDob(e.target.value)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Gender</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Male', 'Female', 'Non-Binary', 'Other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      style={{
                        flex: '1 1 calc(50% - 8px)',
                        padding: '12px',
                        borderRadius: '8px',
                        background: gender === g ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${gender === g ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        color: gender === g ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        fontWeight: gender === g ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext} disabled={!firstName || !dob || !gender}>Continue</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className={styles.stepHeader}>
              <h2 className={styles.title}>Choose your interests</h2>
              <p className={styles.subtitle}>
                Your choices determine what you see next
                {selectedMajorInterestIds.length > 0 && ` · ${selectedMajorInterestIds.length} selected`}
              </p>
            </div>
            {interestsLoading ? (
              <p className={styles.subtitle} style={{ textAlign: 'center', padding: '24px 0' }}>Loading categories…</p>
            ) : interestsError && allInterests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p className={styles.subtitle}>{interestsError}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInterestsLoading(true);
                    setInterestsError('');
                    AuthService.getInterests()
                      .then((data) => setAllInterests(Array.isArray(data) ? data : []))
                      .catch(() => setInterestsError('Could not load interests. Check your connection and try again.'))
                      .finally(() => setInterestsLoading(false));
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className={styles.grid} role="group" aria-label="Interest categories">
                {allInterests.map(interest => {
                  const Icon = ICON_MAP[interest.name] || Sparkles;
                  const isSelected = selectedMajorInterestIds.includes(interest.id);
                  return (
                    <div
                      key={interest.id}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`${styles.gridItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => toggleMajorInterest(interest.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleMajorInterest(interest.id);
                        }
                      }}
                    >
                      <div className={styles.gridIcon}>
                        <Icon size={24} />
                      </div>
                      <span className={styles.gridLabel}>{interest.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleBack}>Back</Button>
              <Button onClick={handleNext} disabled={selectedMajorInterestIds.length === 0}>
                Continue{selectedMajorInterestIds.length > 0 ? ` (${selectedMajorInterestIds.length})` : ''}
              </Button>
            </div>
          </>
        )}

        {step === 4 && (() => {
          const selectedMajors = allInterests.filter((i) => selectedMajorInterestIds.includes(i.id));
          const q = subSearch.trim().toLowerCase();
          const visibleGroups = selectedMajors
            .map((major) => ({
              major,
              subs: (major.subInterests || []).filter((sub: any) =>
                q === '' ? true : sub.name.toLowerCase().includes(q),
              ),
            }))
            .filter((g) => g.subs.length > 0);
          return (
            <>
              <div className={styles.stepHeader}>
                <h2 className={styles.title}>Customize your feed</h2>
                <p className={styles.subtitle}>
                  Every selection improves your feed and matching
                  {selectedSubInterestIds.length > 0 && ` · ${selectedSubInterestIds.length} picked`}
                </p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="search"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder="Find more of your interests"
                  aria-label="Search sub-interests"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--color-border)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
              {visibleGroups.length === 0 ? (
                <p className={styles.subtitle} style={{ textAlign: 'center', padding: '16px 0' }}>
                  {q ? `No matches for “${subSearch.trim()}”. Try another keyword.` : 'No sub-interests in the selected categories yet.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-6)', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                  {visibleGroups.map(({ major, subs }) => (
                    <div key={major.id}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        {major.name}
                      </div>
                      <div className={styles.pillsContainer} style={{ marginBottom: 0, maxHeight: 'none', overflow: 'visible' }}>
                        {subs.map((sub: any) => {
                          const isSelected = selectedSubInterestIds.includes(sub.id);
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              aria-pressed={isSelected}
                              className={`${styles.pill} ${isSelected ? styles.selected : ''}`}
                              onClick={() => toggleSubInterest(sub.id)}
                            >
                              {isSelected && <Check size={16} />}
                              {sub.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.actions}>
                <Button variant="outline" onClick={handleBack}>Back</Button>
                <Button onClick={handleRegister} disabled={loading || selectedSubInterestIds.length === 0}>
                  {loading ? 'Creating...' : `Finish Registration${selectedSubInterestIds.length > 0 ? ` (${selectedSubInterestIds.length})` : ''}`}
                </Button>
              </div>
            </>
          );
        })()}

      </CardContent>
    </Card>
  );
}
