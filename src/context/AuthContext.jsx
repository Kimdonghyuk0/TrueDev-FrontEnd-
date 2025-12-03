import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuth,
  getAuthState,
  hasAuth,
  setAuth as persistAuth,
  setUser as persistUser,
  subscribe
} from '../state/authStore.js';
import { logout as requestLogout } from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getAuthState());

  useEffect(() => {
    const unsubscribe = subscribe(setAuth);
    return unsubscribe;
  }, []);

  const login = ({ token, refreshToken, user }) => {
    persistAuth({ token, refreshToken, user });
  };

  const logout = async ({ skipRequest = false } = {}) => {
    if (!skipRequest) {
      try {
        await requestLogout();
      } catch (error) {
        console.warn('logout_failed', error);
      }
    }
    clearAuth();
  };

  const value = useMemo(
    () => ({
      user: auth.user,
      token: auth.token,
      refreshToken: auth.refreshToken,
      isAuthed: hasAuth(),
      login,
      logout,
      setUser: (user) => persistUser(user)
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
