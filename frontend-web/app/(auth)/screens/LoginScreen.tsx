'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Input } from '@/app/core/components/Input';
import { AuthService } from '@/app/(auth)';
import { LayoutDashboard } from 'lucide-react';

export function LoginScreen() {
  const [email, setEmail] = useState('demo@ginivibe.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await AuthService.login(email, password);
      setUser(user);
      router.push('/home');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: '100%', maxWidth: '400px' }} className="glass">
      <CardHeader style={{ textAlign: 'center', paddingBottom: 0, borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            borderRadius: 'var(--radius-lg)', 
            backgroundColor: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-on-accent)'
          }}>
            <LayoutDashboard size={24} />
          </div>
        </div>
        <CardTitle style={{ fontSize: '1.5rem' }}>GiniVibe</CardTitle>
        <CardDescription>Welcome back</CardDescription>
      </CardHeader>
      
      <CardContent style={{ paddingTop: 'var(--space-6)' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input 
            label="Email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <Input 
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          {error && <div style={{ color: 'var(--color-error)', fontSize: '0.875rem' }}>{error}</div>}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="#" style={{ fontSize: '0.875rem', color: 'var(--color-accent)' }}>
              Forgot password?
            </Link>
          </div>
          
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div style={{ 
          display: 'flex', alignItems: 'center', 
          margin: 'var(--space-6) 0', 
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ margin: '0 var(--space-4)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Link href="/register" style={{ display: 'block' }}>
            <Button variant="secondary" fullWidth>Create account</Button>
          </Link>
          <Link href="/enterprise" style={{ display: 'block' }}>
            <Button variant="ghost" fullWidth style={{ color: 'var(--color-text-secondary)' }}>Enterprise login / sign up</Button>
          </Link>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Are you a business?{' '}
            <Link href="/enterprise" style={{ color: 'var(--color-accent)' }}>
              Create an organization account
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
