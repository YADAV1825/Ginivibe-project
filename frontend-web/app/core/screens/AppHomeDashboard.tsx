'use client';

import React from 'react';
import { useAuth } from '@/app/core/providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/core/components/Card';
import { Button } from '@/app/core/components/Button';
import { Rss } from 'lucide-react';
import Link from 'next/link';

export function AppHomeDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto', height: 'calc(100dvh - 212px)', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', borderRadius: 'var(--radius-lg)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>
          Here&apos;s what&apos;s happening in your universe today.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Quick Actions */}
        <Card className="gv-rise" style={{ '--enter-delay': '0ms' } as React.CSSProperties}>
          <CardHeader>
            <span className="gv-chip" style={{ marginBottom: 'var(--space-3)' }}>Matching</span>
            <CardTitle>Daily Matches</CardTitle>
            <CardDescription>You have 3 new potential matches waiting</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/matching" style={{ display: 'block' }}>
              <Button fullWidth>View Matches</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="gv-rise" style={{ '--enter-delay': '90ms' } as React.CSSProperties}>
          <CardHeader>
            <span className="gv-chip" style={{ marginBottom: 'var(--space-3)' }}>Astrology</span>
            <CardTitle>Astrology Insight</CardTitle>
            <CardDescription>Jupiter&apos;s alignment brings good fortune</CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/astrology" style={{ display: 'block' }}>
               <Button variant="secondary" fullWidth>Read Daily Horoscope</Button>
             </Link>
          </CardContent>
        </Card>

        <Card className="gv-rise" style={{ '--enter-delay': '180ms' } as React.CSSProperties}>
          <CardHeader>
            <span className="gv-chip" style={{ marginBottom: 'var(--space-3)' }}>Events</span>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Speed Matching starts in 2 hours</CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/events" style={{ display: 'block' }}>
               <Button variant="secondary" fullWidth>Join Event</Button>
             </Link>
          </CardContent>
        </Card>

        <Card className="gv-rise" style={{ '--enter-delay': '270ms' } as React.CSSProperties}>
          <CardHeader>
            <span className="gv-chip" style={{ marginBottom: 'var(--space-3)' }}>AI</span>
            <CardTitle>Gini AI</CardTitle>
            <CardDescription>Chat and connect with intelligent AI companions</CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/gini_ai" style={{ display: 'block' }}>
               <Button variant="secondary" fullWidth>Chat Now</Button>
             </Link>
          </CardContent>
        </Card>
      </div>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Recent Activity</h2>
          <Link href="/feed" style={{ color: 'var(--color-accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Rss size={16} />
            Go to Feed
          </Link>
        </div>
        
        <Card>
          <CardContent style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p>Your feed is looking a bit quiet. Connect with more people or post an update!</p>
            <Button variant="secondary" style={{ marginTop: 'var(--space-4)' }}>Create Post</Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
