'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Mail,
  User,
  Building,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function OAuthConsentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken, isLoading } = useAuth();

  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'openid';
  const state = searchParams.get('state') || '';
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') || 'S256';

  const [clientInfo, setClientInfo] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      // Store current return URL and redirect to login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
    }
  }, [user, isLoading, router]);

  const scopesList = scope.split(' ').map((s) => s.trim().toLowerCase()).filter(Boolean);

  const handleDecision = async (granted: boolean) => {
    if (!clientId || !redirectUri || !codeChallenge) {
      setError('Missing required authorization parameters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        '/v1/oauth/consent',
        {
          method: 'POST',
          body: JSON.stringify({
            clientId,
            redirectUri,
            scopes: scopesList,
            codeChallenge,
            codeChallengeMethod,
            state,
            granted,
          }),
        },
        accessToken,
      );

      if (res.ok && res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        setError(res.data?.message || 'Failed to process consent decision.');
      }
    } catch {
      setError('An error occurred submitting authorization.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderScopeItem = (sc: string) => {
    switch (sc) {
      case 'openid':
        return {
          title: 'Basic Identity Proof',
          desc: 'Verify your unique Central Account account identifier',
          icon: <Shield className="w-5 h-5 text-indigo-400" />,
        };
      case 'profile':
        return {
          title: 'Full Name & Country',
          desc: 'Access your profile name and nationality origin',
          icon: <User className="w-5 h-5 text-blue-400" />,
        };
      case 'email':
        return {
          title: 'Primary Email Address',
          desc: 'Read your verified email address for account linkage',
          icon: <Mail className="w-5 h-5 text-violet-400" />,
        };
      case 'identity':
        return {
          title: 'KYC Verification Status',
          desc: 'Verify that your physical identity has been verified (Level 1 - 5)',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
        };
      case 'business':
        return {
          title: 'Business Credentials (KYB)',
          desc: 'Access authorized corporate entity status and role delegation',
          icon: <Building className="w-5 h-5 text-amber-400" />,
        };
      default:
        return {
          title: sc,
          desc: `Custom permission: ${sc}`,
          icon: <KeyRound className="w-5 h-5 text-slate-400" />,
        };
    }
  };

  if (isLoading) {
    return <div className="p-16 text-center text-slate-400">Verifying session...</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16 flex-1 w-full flex flex-col justify-center">
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 backdrop-blur-2xl space-y-6 shadow-2xl">
        {/* App Title & Identity Provider Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 mb-3 shadow-lg shadow-indigo-600/10">
            <KeyRound className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">Authorization Request</h1>

          <p className="text-xs text-slate-300">
            An external application (<code className="text-indigo-300 font-mono">{clientId}</code>) is requesting access to your Central Account profile.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Current logged-in user summary */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">Signing in as:</span>
          <span className="font-semibold text-white truncate max-w-[200px]">{user?.email}</span>
        </div>

        {/* Requested Scopes */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Permissions Requested:
          </h3>

          <div className="space-y-2">
            {scopesList.map((sc) => {
              const info = renderScopeItem(sc);
              return (
                <div
                  key={sc}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start space-x-3 text-xs"
                >
                  <div className="mt-0.5 shrink-0">{info.icon}</div>
                  <div>
                    <h4 className="font-bold text-white">{info.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy reassurance */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          Biometric images and raw identity documents are strictly protected and never shared with third-party applications.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleDecision(false)}
            disabled={submitting}
            className="py-3 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel / Deny
          </button>

          <button
            type="button"
            onClick={() => handleDecision(true)}
            disabled={submitting}
            className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Authorizing...' : 'Allow Access'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 flex-1 w-full flex flex-col justify-center items-center text-slate-400">
          <Shield className="w-8 h-8 animate-pulse text-indigo-400 mb-2" />
          <p className="text-xs">Loading authorization details...</p>
        </div>
      }
    >
      <OAuthConsentContent />
    </Suspense>
  );
}

