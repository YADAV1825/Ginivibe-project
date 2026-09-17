import { StorageService } from '@/lib/storage';
import { User } from '@/types';

const AUTH_KEY = 'ginivibe_auth_session';
const TOKEN_KEY = 'ginivibe_auth_token';
const API_URL = 'http://localhost:3001/api/auth';

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await res.json();
    StorageService.setItem(AUTH_KEY, JSON.stringify(data.user));
    StorageService.setItem(TOKEN_KEY, data.token);
    return data.user;
  },
  
  register: async (payload: any): Promise<User> => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await res.json();
    StorageService.setItem(AUTH_KEY, JSON.stringify(data.user));
    StorageService.setItem(TOKEN_KEY, data.token);
    return data.user;
  },

  checkUsername: async (username: string): Promise<{valid: boolean, message: string}> => {
    const res = await fetch(`${API_URL}/check-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    return await res.json();
  },

  getInterests: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_URL}/interests`);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch (e) {
      console.warn("Using fallback interests due to fetch error:", e);
      return [
        { id: '1', name: 'Technology', subInterests: [{ id: '101', name: 'AI & Machine Learning' }, { id: '102', name: 'Software Development' }] },
        { id: '2', name: 'Gaming', subInterests: [{ id: '201', name: 'PC Gaming' }, { id: '202', name: 'Console Gaming' }] }
      ];
    }
  },
  
  logout: async (): Promise<void> => {
    StorageService.removeItem(AUTH_KEY);
    StorageService.removeItem(TOKEN_KEY);
  },

  getToken: (): string | null => {
    return StorageService.getItem(TOKEN_KEY);
  },
  
  getCurrentUser: (): User | null => {
    const data = StorageService.getItem(AUTH_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  }
};
