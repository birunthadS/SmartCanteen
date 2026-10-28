import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuth = (tok: string, usr: User) => {
    localStorage.setItem('canteen_token', tok);
    localStorage.setItem('canteen_user', JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  };

  const clearAuth = () => {
    localStorage.removeItem('canteen_token');
    localStorage.removeItem('canteen_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('canteen_user', JSON.stringify(res.data.user));
      }
    } catch {
      clearAuth();
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('canteen_token');
    const savedUser = localStorage.getItem('canteen_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Verify token is still valid
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    // Throws on PENDING / REJECTED — the LoginPage handles these codes
    const res = await api.post('/auth/login', { email, password });
    if (!res.data.success) throw new Error(res.data.message || 'Login failed');
    saveAuth(res.data.token, res.data.user);
  };

  const logout = () => {
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
