'use client';

import React from 'react';
import { useTheme } from '@/app/core/providers/ThemeProvider';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';

export function SettingsDashboard() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Settings</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how GiniVibe looks on your device.</CardDescription>
          </CardHeader>
          <CardContent style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button 
              variant={theme === 'light' ? 'primary' : 'secondary'} 
              onClick={() => setTheme('light')}
            >
              Light Mode
            </Button>
            <Button 
              variant={theme === 'dark' ? 'primary' : 'secondary'} 
              onClick={() => setTheme('dark')}
            >
              Dark Mode
            </Button>
            <Button 
              variant={theme === 'system' ? 'primary' : 'secondary'} 
              onClick={() => setTheme('system')}
            >
              System Default
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your active session and account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="secondary" 
              onClick={logout}
              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
