'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

function VerifyEmailChangeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ oldEmail?: string; newEmail?: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setErrorMessage('No confirmation token provided in link.');
      return;
    }

    const confirmChange = async () => {
      try {
        const res = await apiFetch<any>('/auth/email-change/confirm', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setSuccess(true);
          setResultData({
            oldEmail: res.data?.oldEmail,
            newEmail: res.data?.newEmail,
          });
        } else {
          setErrorMessage(res.data?.message || 'Invalid or expired confirmation link.');
        }
      } catch {
        setErrorMessage('An error occurred during email confirmation.');
      } finally {
        setVerifying(false);
      }
    };

    confirmChange();
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 flex-1 w-full flex flex-col justify-center">
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl text-center space-y-6 shadow-2xl">
        {verifying ? (
          <div className="space-y-4">
            <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
            <h2 className="text-lg font-bold text-white">Confirming Email Change</h2>
            <p className="text-xs text-slate-400">
              Validating compliance cryptographic token and updating primary address...
            </p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight">Primary Email Updated!</h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your Central Account account has been successfully updated to{' '}
              <strong className="text-white">{resultData?.newEmail}</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-left text-xs space-y-1 text-slate-400">
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Security Notice</span>
              </div>
              <p>• All other active sessions across external devices have been invalidated.</p>
              <p>• Future sign-ins require your new email address.</p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/25"
              >
                <span>Sign in with New Email</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h1 className="text-lg font-bold text-white tracking-tight">Email Confirmation Failed</h1>

            <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>

            <p className="text-[11px] text-slate-500">
              Links expire after 24 hours. If your link expired, please request a new email change from your security dashboard.
            </p>

            <div className="pt-2">
              <Link
                href="/security"
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Go to Security Settings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-20 flex-1 w-full flex flex-col justify-center items-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
          <p className="text-xs">Loading verification session...</p>
        </div>
      }
    >
      <VerifyEmailChangeContent />
    </Suspense>
  );
}

