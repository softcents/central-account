'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  LogOut,
  Boxes,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token) {
      apiFetch<any>('/tenants', {}, token)
        .then((res) => {
          if (res.ok && Array.isArray(res.data)) {
            setOrganizations(res.data);
          }
        })
        .catch((e) => console.error('Failed to load orgs for dashboard', e));
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
        Loading account status...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Status and foundation attributes for your Central Account profile
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/security"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manage Security & Sessions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => logout()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Account Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Account State Card */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Account Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-white capitalize">{user.status.toLowerCase()}</div>
          <div className="mt-2 flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.status === 'ACTIVE'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
              }`}
            >
              {user.status === 'ACTIVE' ? 'Operational' : 'Pending Action'}
            </span>
          </div>
        </div>

        {/* Email Verification Card */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Verification
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            {user.emailVerified ? 'Verified' : 'Unverified'}
          </div>
          <div className="mt-2 flex items-center space-x-2">
            {user.emailVerified ? (
              <span className="inline-flex items-center space-x-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmed via Signed Token</span>
              </span>
            ) : (
              <Link
                href="/verify-email"
                className="inline-flex items-center space-x-1 text-xs text-amber-400 underline hover:text-amber-300"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Verify Now</span>
              </Link>
            )}
          </div>
        </div>

        {/* Multi-Factor Status Card */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Two-Factor Auth (MFA)
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              {user.mfaEnabled ? (
                <ShieldCheck className="w-4 h-4 text-violet-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
          <div className="text-xl font-bold text-white">
            {user.mfaEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.mfaEnabled
                  ? 'bg-violet-950/60 text-violet-400 border border-violet-800/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {user.mfaEnabled ? 'TOTP Protected' : 'Single Factor'}
            </span>
          </div>
        </div>
      </div>

      {/* Organizations & Workspaces */}
      {organizations.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-xl mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Your Organizations & Workspaces</h3>
                <p className="text-xs text-slate-400">
                  Organizations you belong to or have been delegated access to
                </p>
              </div>
            </div>
            <Link
              href="/organizations"
              className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0"
                    style={{ backgroundColor: org.brand_color || '#3b82f6' }}
                  >
                    {org.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs truncate">{org.name}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-[10px] font-semibold uppercase">
                        {org.userRole || 'MEMBER'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {org.status}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/organizations/${org.id}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1 shrink-0"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Details Box */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Identity Identity Profile
        </h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <dt className="text-xs text-slate-400">Account User ID</dt>
            <dd className="font-mono text-xs text-slate-200 mt-1 select-all">{user.id}</dd>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <dt className="text-xs text-slate-400">Primary Email</dt>
            <dd className="text-xs text-slate-200 mt-1 font-medium">{user.email}</dd>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <dt className="text-xs text-slate-400">Registered Country Code</dt>
            <dd className="text-xs text-slate-200 mt-1 font-medium">
              {user.profile?.country_code || 'US'}
            </dd>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <dt className="text-xs text-slate-400">Password Security</dt>
            <dd className="text-xs text-slate-200 mt-1 font-medium">
              Argon2id Hashed (Memory Cost: 64MB)
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
