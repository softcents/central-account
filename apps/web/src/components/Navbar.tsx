'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, KeyRound, LayoutDashboard, LogOut, LogIn, UserPlus, UserCheck, Building2, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // The Admin Portal has its own dedicated shell and navigation. Hide consumer navbar completely.
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const isImpersonating = !!localStorage.getItem('ci_impersonator_backup');
      if (isImpersonating) {
        localStorage.removeItem('ci_impersonator_backup');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/admin/users';
        return;
      }
    } catch {
      // ignore
    }
    logout();
  };

  const isActive = (path: string) => pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Central Account
            </span>
          </div>
        </Link>

        <nav className="flex items-center space-x-1 sm:space-x-2">
          {user ? (
            user.customerRegistrationCompleted === false ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href="/customer-registration"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Complete Customer Registration (Required)</span>
                </Link>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <span className="text-xs text-slate-400 hidden sm:inline-block max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 transition-all"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dashboard</span>
                </Link>

              <Link
                href="/identity"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/identity')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>KYC</span>
              </Link>

              <Link
                href="/business"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/business')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>KYB</span>
              </Link>

              <Link
                href="/organizations"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/organizations')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Organizations</span>
              </Link>

              <Link
                href="/subscription"
                className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/subscription')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Plans</span>
              </Link>

              <Link
                href="/billing"
                className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/billing')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Billing</span>
              </Link>

              <Link
                href="/profile"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Profile</span>
              </Link>

              <Link
                href="/security"
                className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/security'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Security</span>
              </Link>

              <Link
                href="/settings"
                className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/settings'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>Settings</span>
              </Link>

              <Link
                href="/admin/login"
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-400 bg-violet-950/40 border border-violet-500/30 hover:bg-violet-900/40 transition-colors"
              >
                <Shield className="w-3 h-3 text-violet-400" />
                <span>Admin Portal</span>
              </Link>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 hidden lg:inline-block max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 transition-all"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
            )
          ) : (
            <>
              <Link
                href="/login"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  pathname === '/login'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
