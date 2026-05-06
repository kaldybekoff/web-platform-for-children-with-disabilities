import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import * as meApi from '../api/me';
import type { UserResponse, UserRole } from '../api/types';

const CSRF_KEY = 'csrf_token';
const USER_KEY = 'user';

interface AuthState {
  user: UserResponse | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: UserRole }) => Promise<void>;
  loginWithToken: (csrfToken: string) => void;
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
  const hasCsrf = !!localStorage.getItem(CSRF_KEY);
  const [loading, setLoading] = useState(hasCsrf);

  const persistUser = useCallback((newUser: UserResponse | null) => {
    if (newUser) localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    else localStorage.removeItem(USER_KEY);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(CSRF_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await meApi.getMe();
      persistUser(u);
    } catch {
      clearAuth();
    }
  }, [persistUser, clearAuth]);

  useEffect(() => {
    if (!hasCsrf) {
      setLoading(false);
      return;
    }
    meApi
      .getMe()
      .then((u) => persistUser(u))
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      localStorage.setItem(CSRF_KEY, res.csrf_token);
      persistUser(res.user);
    },
    [persistUser]
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
    },
    []
  );

  const loginWithToken = useCallback((csrfToken: string) => {
    localStorage.setItem(CSRF_KEY, csrfToken);
    // useEffect won't re-run; fetch user manually
    meApi.getMe().then((u) => persistUser(u)).catch(() => clearAuth());
  }, [persistUser, clearAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    userRole: user?.role ?? 'student',
    login,
    register,
    loginWithToken,
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
