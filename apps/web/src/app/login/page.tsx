'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { setAuthData } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [notVerified, setNotVerified] = useState(false);

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState<{
    mfaRequired: boolean;
    mfaToken: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLocked(false);
    setNotVerified(false);
    setIsLoading(true);

    try {
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        if (res.status === 423) {
          setIsLocked(true);
          setError(res.data?.message || 'Account temporarily locked due to multiple failed login attempts.');
        } else if (res.status === 403 && res.data?.emailNotVerified) {
          setNotVerified(true);
          setError(res.data?.message || 'Please verify your email before logging in.');
        } else {
          setError(res.data?.message || 'Invalid email or password.');
        }
      } else {
        if (res.data?.mfaRequired) {
          setMfaChallenge({
            mfaRequired: true,
            mfaToken: res.data.mfaToken,
          });
        } else if (res.data?.accessToken) {
          setAuthData(res.data.accessToken, res.data.user);
          if (res.data.user?.customerRegistrationCompleted === false) {
            router.push('/customer-registration');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch {
      setError('Connection to identity server failed. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await apiFetch<any>('/auth/mfa-challenge', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: mfaChallenge.mfaToken,
          code: mfaCode.trim(),
        }),
      });

      if (!res.ok) {
        setError(res.data?.message || 'Invalid MFA code or recovery code');
      } else if (res.data?.accessToken) {
        setAuthData(res.data.accessToken, res.data.user);
        if (res.data.user?.customerRegistrationCompleted === false) {
          router.push('/customer-registration');
        } else {
          router.push('/dashboard');
        }
      }
    } catch {
      setError('Failed to verify MFA challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {mfaChallenge ? 'Two-Factor Authentication' : 'Sign in to Central ID'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mfaChallenge
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Enter your credentials to manage your account'}
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40">
          {error && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start space-x-3 text-sm ${
                isLocked
                  ? 'bg-amber-950/40 border border-amber-800/40 text-amber-300'
                  : 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
              }`}
            >
              {isLocked ? (
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div>
                <span>{error}</span>
                {notVerified && (
                  <div className="mt-2">
                    <Link
                      href="/verify-email"
                      className="text-xs font-semibold text-rose-200 underline hover:text-white"
                    >
                      Go to Verification Page &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {mfaChallenge ? (
            /* MFA Step */
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Verification Code or Recovery Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="000000 or ABCDE-12345"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all tracking-wider"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  You can also paste one of your emergency recovery codes.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !mfaCode.trim()}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setMfaChallenge(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                &larr; Back to login
              </button>
            </form>
          ) : (
            /* Standard Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
