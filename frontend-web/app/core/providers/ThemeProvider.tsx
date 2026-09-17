/* eslint-disable */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorageService } from '@/lib/storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_KEY = 'ginivibe_theme_preference';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Brand default is the cream/green light world; a stored preference still wins.
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = StorageService.getItem(THEME_KEY) as Theme;
    if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    StorageService.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch by rendering nothing until mounted if needed, 
  // but to avoid flickering we apply it instantly on client side via useEffect
  // Next.js standard approach for theme providers.
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
