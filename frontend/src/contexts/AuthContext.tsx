'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

interface RegisterPayload {
  email: string; password: string;
  firstName: string; lastName: string;
  role?: 'client' | 'restaurant';
  phone?: string;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Au mount : si on a un token, on récupère l'utilisateur
  useEffect(() => {
    const token = getAccessToken();
    if (!token) { setLoading(false); return; }
    api<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await api<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST', body: { email, password }, auth: false,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function register(payload: RegisterPayload) {
    const data = await api<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST', body: payload, auth: false,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
