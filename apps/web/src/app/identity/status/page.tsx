'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Award,
  FileText,
  UserCheck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function IdentityStatusPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadStatus = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<any>('/identity/status', {}, accessToken);
      if (res.ok) {
        setData(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Auto-poll if currently processing
    let interval: any;
    if (data?.status === 'PROCESSING') {
      interval = setInterval(() => {
        loadStatus();
      }, 2500);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, data?.status]);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const res = await apiFetch<any>('/identity/retry', { method: 'POST' }, accessToken);
      if (res.ok) {
        router.push('/identity/document');
      } else {
        setError((res.data as any)?.message || 'Failed to initialize retry session');
      }
    } catch {
      setError('Connection to identity server failed');
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading || loading) {
    return <div className="p-8 text-center text-slate-400">Loading verification telemetry...</div>;
  }

  const status = data?.status || 'NOT_STARTED';
  const level = data?.verificationLevel || 'LEVEL_0';
  const scores = data?.scores;
  const currentStep = data?.currentStep;
  const isDocumentDeclined = status === 'REJECTED' && currentStep === 'DECLINED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Identity Status & Results</h1>
        <p className="text-sm text-slate-400 mt-1">
          Detailed decision telemetry and official verification tier
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Status Display Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40 space-y-6">
        <div className="text-center py-4 space-y-3">
          {status === 'VERIFIED' && (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Identity Verified</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your government document and facial biometrics have been confirmed by the AI decision
                engine.
              </p>
            </>
          )}

          {status === 'PROCESSING' && (
            <>
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-lg shadow-indigo-500/10">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white">Analysis in Progress</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Running OCR, anti-spoofing heuristics, and cosine face matching in background queue...
              </p>
            </>
          )}

          {status === 'REVIEW_REQUIRED' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Compliance Review Required</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your verification has been routed to our internal compliance reviewer for secondary manual
                inspection.
              </p>
            </>
          )}

          {status === 'REJECTED' && isDocumentDeclined && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Document Verification Declined</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Our automated scanning system determined that the uploaded document does not appear to be
                a genuine government-issued identity document. Your submission has been recorded and
                forwarded for administrative review.
              </p>
            </>
          )}

          {status === 'REJECTED' && !isDocumentDeclined && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Verification Unsuccessful</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                One or more security checks did not meet the required threshold.
              </p>
            </>
          )}
        </div>

        {/* Verification Tier & Attributes */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Assigned Level</span>
            <span className="font-bold text-white text-sm">{level}</span>
          </div>
          <div>
            <span className="text-slate-500 block mb-0.5">Decision Policy</span>
            <span className="font-bold text-indigo-300 text-sm">
              {data?.decision || status}
            </span>
          </div>
        </div>

        {/* Rejection / Review Reasons if present */}
        {data?.rejectionReasons && data.rejectionReasons.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <span className="font-semibold text-slate-300 block mb-1">Notes & Reasons:</span>
            {data.rejectionReasons.map((r: string, idx: number) => (
              <p key={idx} className="text-slate-400">
                &bull; {r}
              </p>
            ))}
          </div>
        )}

        {/* Telemetry Scores */}
        {scores && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Signal Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 text-center">
                <span className="text-slate-500 block text-[10px]">Authenticity</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round(scores.authenticityScore * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 text-center">
                <span className="text-slate-500 block text-[10px]">OCR Match</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round(scores.ocrScore * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 text-center">
                <span className="text-slate-500 block text-[10px]">Face Match</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round(scores.faceMatchScore * 100)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 text-center">
                <span className="text-slate-500 block text-[10px]">Liveness</span>
                <span className="font-mono font-bold text-slate-200">
                  {Math.round(scores.livenessScore * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {status === 'REJECTED' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>Retry Verification</span>
            </button>
          )}

          <Link
            href="/dashboard"
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs text-center transition-all"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/business"
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs text-center transition-all"
          >
            Business KYB &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
