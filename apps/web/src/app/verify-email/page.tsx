'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');
  const { setAuthData } = useAuth();

  const [token, setToken] = useState(tokenParam || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const performVerification = async (verifyToken: string) => {
    if (!verifyToken.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: verifyToken.trim() }),
      });

      if (res.ok) {
        setVerifySuccess(res.data.message || 'Your email address has been successfully verified.');
        if ((res.data as any)?.accessToken && (res.data as any)?.user) {
          setAuthData((res.data as any).accessToken, (res.data as any).user);
        }
      } else {
        const msg = (res.data as any)?.message || 'Verification token is invalid or has expired.';
        setVerifyError(msg);
      }
    } catch {
      setVerifyError('Failed to contact authentication server. Please check your connection.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
      performVerification(tokenParam);
    }
  }, [tokenParam]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || resendCooldown > 0) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const res = await apiFetch<{ success: boolean; message: string; retryAfter?: number }>(
        '/auth/resend-verification',
        {
          method: 'POST',
          body: JSON.stringify({ email: resendEmail.trim() }),
        },
      );

      if (res.status === 429) {
        const retry = (res.data as any)?.retryAfter || 60;
        setResendCooldown(retry);
        setResendMessage(`Rate limit active. Please wait ${retry}s.`);
      } else {
        setResendMessage(res.data.message || 'Verification email sent if account exists.');
        setResendCooldown(60);
      }
    } catch {
      setResendMessage('Failed to trigger verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Email Verification</h1>
          <p className="text-sm text-slate-400 mt-1">
            Confirm your identity to activate full platform access
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40 space-y-6">
          {/* Verification Status */}
          {isVerifying && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center space-x-3 text-indigo-300 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Verifying token with security provider...</span>
            </div>
          )}

          {verifySuccess && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 space-y-4 text-sm">
              <div className="flex items-start space-x-3 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-emerald-200 text-base">Email Verified!</h4>
                  <p className="mt-1 text-slate-300 text-xs leading-relaxed">{verifySuccess}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Mandatory Next Step: Customer Registration</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  To complete your onboarding into Central Account, you must now fill out your mandatory personal and KYC registration details.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/customer-registration"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Proceed to KYC & Customer Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {verifyError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <h4 className="font-semibold text-rose-200">Verification Failed</h4>
                <p className="mt-1">{verifyError}</p>
              </div>
            </div>
          )}

          {/* Manual Token Form */}
          {!verifySuccess && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Verification Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste token if not automatically verified"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => performVerification(token)}
                  disabled={isVerifying || !token.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* Resend Section */}
          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Need a new link?
            </h3>
            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isResending || resendCooldown > 0}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-slate-700/50"
              >
                {resendCooldown > 0 ? (
                  <span>Resend available in {resendCooldown}s</span>
                ) : (
                  <span>{isResending ? 'Sending...' : 'Resend Verification Link'}</span>
                )}
              </button>

              {resendMessage && (
                <p className="text-[11px] text-slate-400 text-center">{resendMessage}</p>
              )}
            </form>
          </div>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Loading verification module...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
