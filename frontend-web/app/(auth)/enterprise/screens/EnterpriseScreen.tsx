'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Building2, ArrowRight } from 'lucide-react';
import { EnterpriseAuth } from '@/app/core/services/EnterpriseAuth';

export function EnterpriseScreen() {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'REGISTER') {
        const { token } = await EnterpriseAuth.register({ email, password, organizationName });
        localStorage.setItem('enterprise_token', token);
        router.push('/enterprise-dashboard');
      } else {
        const { token } = await EnterpriseAuth.login({ email, password });
        localStorage.setItem('enterprise_token', token);
        router.push('/enterprise-dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: '100%', maxWidth: '450px' }} className="glass">
      <CardHeader style={{ textAlign: 'center', paddingBottom: 0, borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'var(--color-surface-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <Building2 size={32} />
          </div>
        </div>
        <CardTitle style={{ fontSize: '1.5rem' }}>GiniVibe Enterprise</CardTitle>
        <CardDescription>
          {mode === 'LOGIN' ? 'Welcome back to your organization portal' : 'Grow your brand with targeted Astrology Ads'}
        </CardDescription>
      </CardHeader>
      
      <CardContent style={{ paddingTop: 'var(--space-6)' }}>
        {step === 1 ? (
          <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onSubmit={handleSubmit}>
            
            {mode === 'REGISTER' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization Name</label>
                  <input 
                    type="text" 
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Celestial Media" 
                    required
                    style={{
                      width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization Type</label>
                  <select required style={{
                      width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)'
                  }}>
                    <option value="ADVERTISING_AGENCY">Advertising Agency</option>
                    <option value="ASTROLOGY_SERVICE">Astrology Service</option>
                    <option value="DATING_BRAND">Dating Brand</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Work Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@organization.com" 
                required
                style={{
                  width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                style={{
                  width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            {error && <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</div>}

            <Button type="submit" disabled={loading} fullWidth style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Sign In to Portal' : 'Create Organization Account')} 
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(76, 175, 80, 0.1)', 
              color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' 
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Account Created!</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              Your Enterprise portal is ready. Check your email to verify your organization domain.
            </p>
            <Button fullWidth variant="secondary" onClick={() => { router.push('/enterprise-dashboard'); }}>Go to Enterprise Dashboard</Button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {step === 1 && (
            <button 
              onClick={() => { setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {mode === 'LOGIN' ? "Don't have an enterprise account? " : "Already have an enterprise account? "}
              <span style={{ color: 'var(--color-primary)' }}>
                {mode === 'LOGIN' ? "Register here" : "Login here"}
              </span>
            </button>
          )}
          
          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: 'var(--space-2) 0' }} />
          
          <Link href="/login" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>
            Looking for personal consumer login? <span style={{ color: 'var(--color-primary)' }}>Click here</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
