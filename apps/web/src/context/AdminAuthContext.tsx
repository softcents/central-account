'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, adminUser: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now() + 15000;
  } catch {
    return false;
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clearAdminAuth = useCallback(() => {
    setToken(null);
    setAdmin(null);
    try {
      localStorage.removeItem('ci_admin_token');
      localStorage.removeItem('ci_admin_user');
    } catch {
      // ignore
    }
  }, []);

  const login = (newToken: string, newAdmin: AdminUser) => {
    setToken(newToken);
    setAdmin(newAdmin);
    try {
      localStorage.setItem('ci_admin_token', newToken);
      localStorage.setItem('ci_admin_user', JSON.stringify(newAdmin));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    clearAdminAuth();
    router.push('/admin/login');
  };

  useEffect(() => {
    async function restoreAdminSession() {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('ci_admin_token');

        if (!storedToken || !isTokenValid(storedToken)) {
          clearAdminAuth();
          return;
        }

        // Verify with server /admin/auth/me
        const res = await apiFetch<any>('/admin/auth/me', {}, storedToken);
        if (res.ok && res.data) {
          setToken(storedToken);
          setAdmin(res.data);
          try {
            localStorage.setItem('ci_admin_user', JSON.stringify(res.data));
          } catch {
            // ignore
          }
        } else {
          clearAdminAuth();
        }
      } catch {
        clearAdminAuth();
      } finally {
        setIsLoading(false);
      }
    }

    restoreAdminSession();
  }, [clearAdminAuth]);

  return (
    <AdminAuthContext.Provider value={{ admin, token, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
