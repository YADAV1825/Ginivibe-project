"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAuth } from '@/app/core/services/AdminAuth';
import { ShieldAlert } from 'lucide-react';

export function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ginivibe.com');
  const [password, setPassword] = useState('supersecret');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await AdminAuth.login({ email, password });
      localStorage.setItem('admin_token', res.token);
      router.push('/admin-dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)'
    }}>
      <div style={{
        width: '400px', padding: '40px', backgroundColor: '#111', 
        borderRadius: '12px', border: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <ShieldAlert color="var(--color-error)" size={48} />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.5rem', fontWeight: 600 }}>
          GiniVibe Control Plane
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '32px', fontSize: '0.875rem' }}>
          Authorized Platform Administrators Only
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              padding: '12px', borderRadius: '6px', border: '1px solid #333',
              backgroundColor: '#000', color: '#fff'
            }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              padding: '12px', borderRadius: '6px', border: '1px solid #333',
              backgroundColor: '#000', color: '#fff'
            }}
          />
          {error && <div style={{ color: 'var(--color-error)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
          
          <button type="submit" style={{
            padding: '12px', borderRadius: '6px', backgroundColor: 'var(--color-error)',
            color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer',
            marginTop: '8px'
          }}>
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
}
