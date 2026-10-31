'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Server,
  Lock,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminAuditPage() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ADMIN' | 'SYSTEM'>('ADMIN');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/audit-logs', {}, token);
      if (res.ok) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Central Compliance Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident logs of administrative actions, authentication attempts, and security events.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ADMIN'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Administrative Actions ({data?.adminLogs?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('SYSTEM')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'SYSTEM'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          System & User Security Events ({data?.systemLogs?.length || 0})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Event / Action</th>
                <th className="py-3 px-6">Target / Resource</th>
                <th className="py-3 px-6">Actor / User</th>
                <th className="py-3 px-6">Details / Payload</th>
                <th className="py-3 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">Loading audit logs...</td>
                </tr>
              ) : activeTab === 'ADMIN' ? (
                data?.adminLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">No admin logs recorded.</td>
                  </tr>
                ) : (
                  data?.adminLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-6 font-semibold text-indigo-400">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-6 text-slate-300 font-medium">
                        {log.resource} {log.target_id ? `(${log.target_id.substring(0, 8)}...)` : ''}
                      </td>
                      <td className="py-3.5 px-6 text-slate-200">
                        {log.admin?.email} ({log.admin?.role})
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                data?.systemLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">No system logs recorded.</td>
                  </tr>
                ) : (
                  data?.systemLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-6 font-semibold text-emerald-400">
                        {log.event_type}
                      </td>
                      <td className="py-3.5 px-6 text-slate-300">
                        ip: {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-200">
                        {log.user?.email || 'Anonymous'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 max-w-xs truncate">
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
