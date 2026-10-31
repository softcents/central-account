'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert, LogOut, Loader2, ArrowLeft, UserCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export interface ImpersonationBackupData {
  isImpersonating?: boolean;
  adminToken?: string;
  adminUser?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  targetUser?: {
    id: string;
    email: string;
    name?: string;
    status?: string;
    customerRegistration?: any;
    profile?: any;
  };
  impersonatedAt?: string;
}

export function ImpersonateBanner() {
  const pathname = usePathname();
  const [impersonation, setImpersonation] = useState<ImpersonationBackupData | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const checkImpersonation = useCallback(() => {
    try {
      const stored = localStorage.getItem('ci_impersonator_backup');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.isImpersonating || parsed.adminToken || parsed.impersonator)) {
          setImpersonation(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setImpersonation(null);
  }, []);

  useEffect(() => {
    checkImpersonation();

    const handleStorageChange = () => {
      checkImpersonation();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ci_impersonation_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ci_impersonation_updated', handleStorageChange);
    };
  }, [checkImpersonation, pathname]);

  // Never show impersonation banner while inside the dedicated admin portal
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (!impersonation) {
    return null;
  }

  const targetEmail = impersonation.targetUser?.email || 'Customer Account';
  const targetName =
    impersonation.targetUser?.customerRegistration?.full_name ||
    impersonation.targetUser?.name ||
    (impersonation.targetUser?.profile?.first_name
      ? `${impersonation.targetUser.profile.first_name} ${impersonation.targetUser.profile.last_name || ''}`.trim()
      : null);

  const adminEmail =
    impersonation.adminUser?.email ||
    (impersonation as any).impersonator?.email ||
    'Administrator';
  const adminRole =
    impersonation.adminUser?.role ||
    (impersonation as any).impersonator?.role ||
    'SUPER_ADMIN';

  const handleLeaveImpersonation = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      const adminToken =
        impersonation.adminToken || localStorage.getItem('ci_admin_token') || '';
      const targetUserId = impersonation.targetUser?.id;

      if (adminToken && targetUserId) {
        await apiFetch(
          `/admin/users/${targetUserId}/impersonate/leave`,
          { method: 'POST' },
          adminToken,
        );
      } else if (adminToken) {
        await apiFetch('/admin/impersonate/leave', { method: 'POST' }, adminToken);
      }
    } catch (err) {
      console.warn('Leave impersonation remote notification error:', err);
    } finally {
      // Always cleanly clear impersonated consumer session
      try {
        localStorage.removeItem('ci_impersonator_backup');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } catch {
        // ignore
      }

      // Smoothly navigate back to the admin directory
      window.location.href = '/admin/users';
    }
  };

  return (
    <>
      {/* Fixed top banner */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-950/95 border-b border-amber-500/40 text-slate-100 backdrop-blur-md shadow-2xl shadow-amber-950/30 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-11 sm:h-12 flex items-center justify-between text-xs gap-3">
          {/* Left badge & status */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>

            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold uppercase tracking-wider text-[10px] shrink-0">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Admin Impersonation</span>
              <span className="sm:hidden">Impersonating</span>
            </div>

            <div className="flex items-center space-x-1.5 truncate text-[11px] sm:text-xs">
              <span className="text-slate-400 hidden md:inline">Viewing as:</span>
              <span className="font-semibold text-white truncate max-w-[160px] sm:max-w-[240px]">
                {targetEmail}
              </span>
              {targetName && (
                <span className="text-slate-400 text-[11px] hidden lg:inline">
                  ({targetName})
                </span>
              )}
              <span className="text-slate-600 hidden xl:inline">|</span>
              <span className="text-slate-400 text-[11px] hidden xl:inline">
                Admin: <span className="font-mono text-amber-300/90">{adminEmail}</span> ({adminRole})
              </span>
            </div>
          </div>

          {/* Right Leave Button */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleLeaveImpersonation}
              disabled={isLeaving}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              title="End impersonation and return to Central Admin Users directory"
            >
              {isLeaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Returning to Admin...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Leave Impersonation</span>
                  <span className="xs:hidden">Leave</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer so sticky navbar or top content is never covered */}
      <div className="h-11 sm:h-12 w-full shrink-0" aria-hidden="true" />
    </>
  );
}
