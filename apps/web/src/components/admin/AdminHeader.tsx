'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Activity, Bell, Search, ShieldCheck, X } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminSearch } from '@/context/AdminSearchContext';

export function AdminHeader() {
  const { admin } = useAdminAuth();
  const { searchQuery, setSearchQuery, clearSearch } = useAdminSearch();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (pathname !== '/admin/users' && val.trim().length > 0) {
      router.push('/admin/users');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pathname !== '/admin/users') {
      e.preventDefault();
      router.push('/admin/users');
    }
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        {/* System Health Status Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Core System Healthy</span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>Biometric AI: Ready</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quick Search */}
        <div className="relative hidden sm:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search users, NID, documents..."
            className="w-72 bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Admin Role Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>{admin?.email}</span>
        </div>
      </div>
    </header>
  );
}
