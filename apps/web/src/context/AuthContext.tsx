'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  status: string;
  emailVerified: boolean;
  customerRegistrationCompleted?: boolean;
  mfaEnabled: boolean;
  profile?: {
    first_name?: string;
    last_name?: string;
    country_code?: string;
    phone_number?: string;
  };
  customerRegistration?: any;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  token: string | null;
  isLoading: boolean;
  setAuthData: (token: string, user: User) => void;
  updateUserMfa: (enabled: boolean) => void;
  updateCustomerRegistration: (data?: any) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Checks if a JWT is structurally valid and not expired.
 */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Check if token expires within the next 15 seconds
    const isExpired = payload.exp * 1000 <= Date.now() + 15000;
    return !isExpired;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearAuthData = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
    } catch {
      // ignore
    }
  }, []);

  const setAuthData = useCallback((token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    try {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
    } catch {
      // ignore
    }
  }, []);

  const updateUserMfa = (enabled: boolean) => {
    if (user) {
      const updated = { ...user, mfaEnabled: enabled };
      setUser(updated);
      try {
        localStorage.setItem('auth_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const updateCustomerRegistration = (data?: any) => {
    if (user) {
      const updated = {
        ...user,
        customerRegistrationCompleted: true,
        customerRegistration: data || user.customerRegistration,
      };
      setUser(updated);
      try {
        localStorage.setItem('auth_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' }, accessToken);
    } catch {
      // ignore
    } finally {
      clearAuthData();
      window.location.href = '/login';
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const res = await apiFetch<{ accessToken: string; user: User }>('/auth/refresh', {
        method: 'POST',
      });
      if (res.ok && res.data?.accessToken && isTokenValid(res.data.accessToken)) {
        setAuthData(res.data.accessToken, res.data.user);
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch {
      clearAuthData();
      return false;
    }
  }, [clearAuthData, setAuthData]);

  useEffect(() => {
    async function restoreSession() {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        // 1. If stored token is invalid or expired, purge immediately
        if (!storedToken || !isTokenValid(storedToken)) {
          clearAuthData();
          // Try refreshing via httpOnly cookie if present
          await refreshSession();
          return;
        }

        // 2. Token is unexpired: verify it against the server /auth/me
        try {
          const res = await apiFetch<{ user: User }>('/auth/me', {}, storedToken);
          if (res.ok && res.data?.user) {
            setAccessToken(storedToken);
            setUser(res.data.user);
            try {
              localStorage.setItem('auth_user', JSON.stringify(res.data.user));
            } catch {
              // ignore
            }
          } else {
            // Token rejected by server (revoked or changed secret)
            const refreshed = await refreshSession();
            if (!refreshed) {
              clearAuthData();
            }
          }
        } catch {
          clearAuthData();
        }
      } catch {
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [clearAuthData, refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        token: accessToken,
        isLoading,
        setAuthData,
        updateUserMfa,
        updateCustomerRegistration,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
