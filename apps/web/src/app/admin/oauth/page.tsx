'use client';

import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  Shield,
  RefreshCw,
  Globe,
  Lock,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminOAuthPage() {
  const { token } = useAdminAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/oauth/clients', {}, token);
      if (res.ok) {
        setClients(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load OAuth clients', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClients();
    }
  }, [token]);

  const toggleClientStatus = async (client: any) => {
    const nextStatus = client.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await apiFetch<any>(
        `/admin/oauth/clients/${client.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ status: nextStatus }),
        },
        token,
      );
      if (res.ok) {
        fetchClients();
      }
    } catch (e) {
      console.error('Failed to update OAuth client status', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">OAuth 2.0 & OIDC SSO Clients</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered connected platforms, authorization scopes, and client token revocation.
          </p>
        </div>

        <button
          onClick={fetchClients}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Clients</span>
        </button>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Application Name</th>
                <th className="py-3 px-6">Client ID</th>
                <th className="py-3 px-6">Allowed Scopes</th>
                <th className="py-3 px-6">Required KYC</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading OAuth clients...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No OAuth clients registered yet.</td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.description || 'No description'}</div>
                    </td>

                    <td className="py-4 px-6 font-mono text-indigo-300 font-semibold text-[11px]">
                      {c.client_id}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.allowed_scopes?.map((s: string) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300">
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span>{c.required_verification_level}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {c.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[11px] font-medium">
                          <XCircle className="w-3 h-3" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleClientStatus(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          c.status === 'SUSPENDED'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:bg-rose-900/40'
                        }`}
                      >
                        {c.status === 'SUSPENDED' ? 'Activate Client' : 'Suspend Client'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
