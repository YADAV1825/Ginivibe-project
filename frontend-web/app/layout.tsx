import React from 'react';
import '../styles/globals.css';
import { ThemeProvider } from '@/app/core/providers/ThemeProvider';
import { AuthProvider } from '@/app/core/providers/AuthProvider';
import { GlobalSocketProvider } from '@/app/core/providers/GlobalSocketProvider';
import { RouteTransition } from '@/app/core/components/RouteTransition';


export const metadata = {
  title: 'GiniVibe — Meet people like you mean it',
  description: 'GiniVibe is a social network built around intention: AI matching that understands who you want to meet, live rooms, online and offline events, Vedic astrology for self-understanding, and AI characters to chat with.',
  keywords: ['social network', 'AI matching', 'astrology', 'birth chart', 'gini ai', 'audio rooms', 'events', 'meet people'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <GlobalSocketProvider>

              {children}
              <RouteTransition />
            </GlobalSocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
