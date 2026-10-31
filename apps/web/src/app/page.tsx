'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, LayoutDashboard, KeyRound, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
          <Shield className="w-8 h-8 text-indigo-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Central Account Platform
          </h1>
          <p className="text-base text-slate-600 max-w-lg mx-auto">
            Centralized authentication, identity proofing, and business verification engine.
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/25 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Account Dashboard</span>
              </Link>
              <Link
                href="/identity"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Identity Verification</span>
              </Link>
              <Link
                href="/business"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all"
              >
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Business KYB</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/25 transition-all"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium border border-slate-300 shadow-sm transition-all"
              >
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
