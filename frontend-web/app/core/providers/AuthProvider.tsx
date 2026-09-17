/* eslint-disable */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { AuthService } from '@/app/(auth)';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check initial auth state
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Route protection logic
    if (isLoading) return;
    
    const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register');
    
    const dashboardRoutes = ['/home', '/feed', '/matching', '/events', '/rooms', '/astrology', '/profile', '/settings'];
    const isDashboardRoute = dashboardRoutes.some(route => pathname?.startsWith(route));

    if (!user && isDashboardRoute) {
      router.replace('/login');
    } else if (user && isAuthRoute) {
      router.replace('/home');
    }
  }, [user, isLoading, pathname, router]);

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
