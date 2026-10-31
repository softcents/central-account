'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Building2,
  Boxes,
  CreditCard,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminDashboardPage() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/dashboard/stats', {}, token);
      if (res.ok) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Operational Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time identity verification metrics, SaaS tenants, and platform compliance monitoring.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Users</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.users?.total || 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{stats?.users?.active || 0} Active Accounts</span>
          </div>
        </div>

        {/* KYC Verified */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Verified KYC</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.users?.verified || 0}
          </div>
          <div className="text-[11px] text-amber-400 font-medium mt-1">
            {stats?.users?.pendingKyc || 0} In Review Queue
          </div>
        </div>

        {/* KYB Businesses */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Businesses</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.businesses?.total || 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            {stats?.businesses?.verified || 0} Trade Licenses Verified
          </div>
        </div>

        {/* SaaS Tenants */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">SaaS Tenants</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.saas?.tenants || 0}
          </div>
          <div className="text-[11px] text-violet-400 font-medium mt-1">
            {stats?.saas?.activeSubscriptions || 0} Subscriptions
          </div>
        </div>

        {/* Monthly MRR */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Monthly MRR</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            ${stats?.saas?.estimatedMrr || 0}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Recurring Platform Revenue
          </div>
        </div>

        {/* Support Tickets */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Support Queue</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.support?.openTickets || 0}
          </div>
          <div className="text-[11px] text-rose-400 font-medium mt-1">
            Pending Resolution
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">KYC Verification Desk</h3>
            <p className="text-xs text-slate-400 mt-1">
              Review submitted national IDs, passports, OCR extractions, and biometric face match scores.
            </p>
          </div>
          <Link
            href="/admin/kyc"
            className="mt-5 inline-flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Open KYC Review Queue ({stats?.users?.pendingKyc || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-slate-900/60 border border-cyan-500/20 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Business KYB Compliance</h3>
            <p className="text-xs text-slate-400 mt-1">
              Validate corporate registrations, trade licenses, and owner KYC linkage for enterprise accounts.
            </p>
          </div>
          <Link
            href="/admin/kyb"
            className="mt-5 inline-flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Open KYB Review Queue ({stats?.businesses?.pendingKyb || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-900/60 border border-violet-500/20 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
              <Boxes className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Multi-Tenant SaaS Management</h3>
            <p className="text-xs text-slate-400 mt-1">
              Control tenant organizations, assign subscription tiers, monitor API keys, and enforce quotas.
            </p>
          </div>
          <Link
            href="/admin/tenants"
            className="mt-5 inline-flex items-center space-x-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <span>Manage Tenants & Quotas ({stats?.saas?.tenants || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Health & Infrastructure Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-white">PostgreSQL Database</div>
            <div className="text-[11px] text-emerald-400">Online &bull; Low Latency</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-white">Redis Queue & Cache</div>
            <div className="text-[11px] text-emerald-400">Connected &bull; 0 Queue Backlog</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-white">Python AI Biometrics</div>
            <div className="text-[11px] text-emerald-400">FastAPI Model Service Ready</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Administrative & Compliance Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Live audit trail of administrative events across the cluster.</p>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View All Audit Logs &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {stats?.recentActivity?.length > 0 ? (
            stats.recentActivity.map((log: any) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-900/30">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-slate-400 ml-2">
                      on <span className="font-mono text-slate-300">{log.resource}</span>
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      By {log.admin?.email} ({log.admin?.role})
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">No administrative logs recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
