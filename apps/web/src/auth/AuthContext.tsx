/**
 * 全局认证：token / refreshToken 存 localStorage（desk_at / desk_rt），user 来自 GET /me。
 * token 变化时 effect 内 setAuthHeader + refreshProfile；子组件用 useAuth()，受保护路由外包 RequireAuth。
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthHeader, type ApiResp } from '../api/client';

type UserMe = {
  id: number;
  nickname: string;
  avatar: string;
  onboardingDone: boolean;
  pointsBalance?: number;
  level?: number;
  /** 本人拉 /me 时存在，供扩展；H5 可不展示 */
  role?: 'user' | 'admin';
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  user: UserMe | null;
  loading: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

const TOKEN_KEY = 'desk_at';
const REFRESH_KEY = 'desk_rt';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    localStorage.getItem(REFRESH_KEY)
  );
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    setAuthHeader(token);
    const { data } = await api.get<ApiResp<UserMe>>('/me');
    if (data.success && data.data) setUser(data.data);
  }, [token]);

  // 应用启动或登录态变化：有 token 则拉 /me，无则保持 user=null；结束时关闭 loading 供 RequireAuth 判断
  useEffect(() => {
    (async () => {
      try {
        if (token) {
          setAuthHeader(token);
          await refreshProfile();
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, refreshProfile]);

  const login = useCallback(
    async (access: string, refresh: string) => {
      localStorage.setItem(TOKEN_KEY, access);
      localStorage.setItem(REFRESH_KEY, refresh);
      setToken(access);
      setRefreshToken(refresh);
      setAuthHeader(access);
      const { data } = await api.get<ApiResp<UserMe>>('/me');
      if (data.success && data.data) setUser(data.data);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setAuthHeader(null);
  }, []);

  const value = useMemo(
    () => ({ token, refreshToken, user, loading, login, logout, refreshProfile }),
    [token, refreshToken, user, loading, login, logout, refreshProfile]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}
