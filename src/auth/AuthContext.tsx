import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearToken, getToken, setToken } from '../lib/storage';
import * as api from '../lib/api';

type AuthState = {
  token: string | null;
  user: api.AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTok] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<api.AdminUser | null>(null);

  useEffect(() => {
    // Best effort to load user if token exists
    if (!token) {
      setUser(null);
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
        setTok(null);
        setUser(null);
      });
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      login: async (email, password) => {
        const res = await api.login(email, password);
        setToken(res.token);
        setTok(res.token);
        setUser(res.user);
      },
      logout: () => {
        clearToken();
        setTok(null);
        setUser(null);
      }
    }),
    [token, user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider missing');
  return v;
}
