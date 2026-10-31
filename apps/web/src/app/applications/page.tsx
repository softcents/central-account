'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Shield,
  Trash2,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Key,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ConnectedApplicationsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadApplications = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/oauth/applications', {}, accessToken);
      if (res.ok && Array.isArray(res.data)) {
        setApps(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleRevoke = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to revoke access for "${clientName}"? Any active sessions using this application will be immediately terminated.`)) {
      return;
    }

    setRevokingId(clientId);
    setFeedback(null);

    try {
      const res = await apiFetch(`/oauth/applications/${clientId}`, { method: 'DELETE' }, accessToken);
      if (res.ok) {
        setFeedback(`Access revoked for "${clientName}".`);
        setApps((prev) => prev.filter((a) => a.clientId !== clientId));
      } else {
        setFeedback(res.data?.message || 'Failed to revoke application access');
      }
    } catch {
      setFeedback('Error revoking access');
    } finally {
      setRevokingId(null);
    }
  };

  if (isLoading || loading) {
    return <div className="p-12 text-center text-slate-400">Loading connected applications...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Connected Applications</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Third-party apps and services with authorized Single Sign-On (SSO) access to your identity credentials.
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors w-fit"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Applications list */}
      {apps.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
          <Key className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Connected Applications</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven&apos;t granted any third-party services or client apps access to your Central Account profile yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {app.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{app.clientName}</h3>
                    <span className="text-[11px] font-mono text-slate-500">ID: {app.clientId}</span>
                  </div>
                </div>

                {app.clientDescription && (
                  <p className="text-xs text-slate-300 pl-13">{app.clientDescription}</p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-13">
                  <span className="text-[11px] text-slate-500 mr-1">Granted Scopes:</span>
                  {app.grantedScopes.map((scope: string) => (
                    <span
                      key={scope}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-indigo-300 border border-slate-700"
                    >
                      {scope}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-1 text-[11px] text-slate-500 pl-13 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>Authorized on {new Date(app.authorizedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 sm:pt-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleRevoke(app.clientId, app.clientName)}
                  disabled={revokingId === app.clientId}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-800/30 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{revokingId === app.clientId ? 'Revoking...' : 'Revoke Access'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
