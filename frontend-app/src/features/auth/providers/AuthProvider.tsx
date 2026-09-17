import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  name?: string;
  firstName?: string;
  profilePic?: string;
}

interface AuthContextType {
  token: string | null;
  userId: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (token: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    if (typeof atob === 'function') {
      try {
        const decoded = atob(base64);
        return JSON.parse(decodeURIComponent(escape(decoded)));
      } catch {
        return JSON.parse(atob(base64));
      }
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let buffer = 0;
    let bits = 0;
    for (let i = 0; i < base64.length; i++) {
      const char = base64.charAt(i);
      const index = chars.indexOf(char);
      if (index === -1 || char === '=') continue;
      buffer = (buffer << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    return JSON.parse(output);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check for stored credentials on mount
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('ginivibe_auth_token');
        let storedUserId = await AsyncStorage.getItem('ginivibe_user_id');
        const storedUserJson = await AsyncStorage.getItem('ginivibe_user');

        if (storedToken) {
          setToken(storedToken);

          let resolvedUser: AuthUser | null = null;
          if (storedUserJson) {
            try {
              resolvedUser = JSON.parse(storedUserJson);
            } catch {}
          }

          if (!storedUserId) {
            if (resolvedUser?.id) {
              storedUserId = resolvedUser.id;
            } else {
              const decoded = decodeJwtPayload(storedToken);
              if (decoded?.id || decoded?.userId || decoded?.sub) {
                storedUserId = decoded.id || decoded.userId || decoded.sub;
                if (!resolvedUser) {
                  resolvedUser = {
                    id: storedUserId!,
                    username: decoded.username,
                    email: decoded.email,
                  };
                }
              }
            }
            if (storedUserId) {
              await AsyncStorage.setItem('ginivibe_user_id', storedUserId);
            }
          }

          if (storedUserId) setUserId(storedUserId);
          if (resolvedUser) setUser(resolvedUser);
        }
      } catch (e) {
        console.warn('[AuthProvider] Error loading auth info:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/feed');
    }
  }, [token, segments, isLoading]);

  const signIn = async (newToken: string, userData?: any) => {
    await AsyncStorage.setItem('ginivibe_auth_token', newToken);
    setToken(newToken);

    let resolvedId = userData?.id || userData?.userId;
    let resolvedUser: AuthUser | null = userData || null;

    if (!resolvedId) {
      const decoded = decodeJwtPayload(newToken);
      if (decoded?.id || decoded?.userId || decoded?.sub) {
        resolvedId = decoded.id || decoded.userId || decoded.sub;
        if (!resolvedUser) {
          resolvedUser = {
            id: resolvedId!,
            username: decoded.username,
            email: decoded.email,
          };
        }
      }
    }

    if (resolvedId) {
      await AsyncStorage.setItem('ginivibe_user_id', resolvedId);
      setUserId(resolvedId);
    }
    if (resolvedUser) {
      await AsyncStorage.setItem('ginivibe_user', JSON.stringify(resolvedUser));
      setUser(resolvedUser);
    }
  };

  const signOut = async () => {
    await Promise.all([
      AsyncStorage.removeItem('ginivibe_auth_token'),
      AsyncStorage.removeItem('ginivibe_user_id'),
      AsyncStorage.removeItem('ginivibe_user'),
    ]);
    setToken(null);
    setUserId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, userId, user, isLoading, signIn, signOut }}>
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
