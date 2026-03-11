import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import * as meApi from '../api/me';
import type { UserResponse, UserRole } from '../api/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!token);

  const persist = useCallback((newToken: string | null, newUser: UserResponse | null) => {
    if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
    else localStorage.removeItem(TOKEN_KEY);
    if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    else localStorage.removeItem(USER_KEY);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await meApi.getMe();
      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch {
      persist(null, null);
    }
  }, [token, persist]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    meApi
      .getMe()
      .then((u) => {
        setUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => persist(null, null))
      .finally(() => setLoading(false));
  }, [token, persist]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      persist(res.access_token, res.user);
    },
    [persist]
  );

  const register = useCallback(
    async (data: { email: string; password: string; name: string; role: UserRole }) => {
      const parts = data.name.trim().split(/\s+/);
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';
      await authApi.register({
        email: data.email,
        password: data.password,
        first_name,
        last_name,
        role: data.role,
      });
      const res = await authApi.login({ email: data.email, password: data.password });
      persist(res.access_token, res.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const value: AuthContextValue = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    userRole: user?.role ?? 'student',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
