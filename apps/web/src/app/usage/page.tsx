'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  UserCheck,
  Building2,
  KeyRound,
  HardDrive,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function UsagePage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [usage, setUsage] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      const res = await apiFetch<any>('/tenants', {}, token);
      if (res.ok && res.data?.length > 0) {
        setTenants(res.data);
        setSelectedTenantId(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load tenants', e);
    }
  };

  const fetchUsage = async (tenantId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/tenants/${tenantId}/usage`, {}, token);
      if (res.ok) {
        setUsage(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch usage metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTenants();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedTenantId) {
      fetchUsage(selectedTenantId);
    }
  }, [token, selectedTenantId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Usage Quotas & Metering</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of verification volume, API requests, and storage allocation against your plan.
          </p>
        </div>

        {tenants.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Organization:</span>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500/60"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Plan Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-violet-950/20 to-slate-900/60 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Current Tier Allocation
          </span>
          <div className="text-2xl font-bold text-white tracking-tight mt-0.5">
            {usage?.planName || 'Free Starter'} Plan
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Cycle resets on the 1st of every month.
          </div>
        </div>

        <Link
          href="/subscription"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Upgrade Tier for More Volume</span>
        </Link>
      </div>

      {/* Metering Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Metric 1: Personal KYC Checks */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">KYC Verifications</h3>
                <span className="text-[11px] text-slate-500">Document + Face similarity checks</span>
              </div>
            </div>
            <span className="text-sm font-bold text-white">
              {usage?.metrics?.kycChecks?.used || 0} / {usage?.metrics?.kycChecks?.limit || 10}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usage?.metrics?.kycChecks?.percentage || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>{usage?.metrics?.kycChecks?.percentage || 0}% utilized</span>
              <span>
                {Math.max(
                  0,
                  (usage?.metrics?.kycChecks?.limit || 10) - (usage?.metrics?.kycChecks?.used || 0),
                )}{' '}
                remaining
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Corporate KYB Checks */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Business KYB Checks</h3>
                <span className="text-[11px] text-slate-500">Trade license OCR & validation</span>
              </div>
            </div>
            <span className="text-sm font-bold text-white">
              {usage?.metrics?.kybChecks?.used || 0} / {usage?.metrics?.kybChecks?.limit || 2}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usage?.metrics?.kybChecks?.percentage || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>{usage?.metrics?.kybChecks?.percentage || 0}% utilized</span>
              <span>
                {Math.max(
                  0,
                  (usage?.metrics?.kybChecks?.limit || 2) - (usage?.metrics?.kybChecks?.used || 0),
                )}{' '}
                remaining
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: API Calls */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">API Call Volume</h3>
                <span className="text-[11px] text-slate-500">Client authentication & endpoints</span>
              </div>
            </div>
            <span className="text-sm font-bold text-white">
              {usage?.metrics?.apiCalls?.used || 0} / {usage?.metrics?.apiCalls?.limit || 1000}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usage?.metrics?.apiCalls?.percentage || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>{usage?.metrics?.apiCalls?.percentage || 0}% utilized</span>
              <span>
                {Math.max(
                  0,
                  (usage?.metrics?.apiCalls?.limit || 1000) - (usage?.metrics?.apiCalls?.used || 0),
                )}{' '}
                remaining
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Storage */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Document Storage</h3>
                <span className="text-[11px] text-slate-500">Encrypted image vault</span>
              </div>
            </div>
            <span className="text-sm font-bold text-white">
              {usage?.metrics?.storageMb?.used || 12} MB / {usage?.metrics?.storageMb?.limit || 250} MB
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${usage?.metrics?.storageMb?.percentage || 5}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>{usage?.metrics?.storageMb?.percentage || 5}% utilized</span>
              <span>
                {Math.max(
                  0,
                  (usage?.metrics?.storageMb?.limit || 250) - (usage?.metrics?.storageMb?.used || 12),
                )}{' '}
                MB remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
