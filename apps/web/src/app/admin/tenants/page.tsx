'use client';

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Users,
  KeyRound,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminTenantsPage() {
  const { token } = useAdminAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        apiFetch<any>('/admin/tenants', {}, token),
        apiFetch<any>('/billing/plans', {}),
      ]);

      if (tenantsRes.ok) {
        setTenants(tenantsRes.data.tenants || []);
      }
      if (plansRes.ok) {
        setPlans(plansRes.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch tenants', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTenants();
    }
  }, [token]);

  const toggleTenantStatus = async (tenant: any) => {
    const nextStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await apiFetch<any>(
        `/admin/tenants/${tenant.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ status: nextStatus }),
        },
        token,
      );
      if (res.ok) {
        fetchTenants();
      }
    } catch (e) {
      console.error('Failed to toggle tenant status', e);
    }
  };

  const openPlanModal = (tenant: any) => {
    setSelectedTenant(tenant);
    const currentPlanId = tenant.subscriptions?.[0]?.plan?.id || '';
    setSelectedPlanId(currentPlanId);
    setPlanModalOpen(true);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !selectedPlanId) return;
    setSubmittingPlan(true);

    try {
      const res = await apiFetch<any>(
        `/admin/tenants/${selectedTenant.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({
            status: selectedTenant.status,
            planId: selectedPlanId,
          }),
        },
        token,
      );

      if (res.ok) {
        setPlanModalOpen(false);
        fetchTenants();
      }
    } catch (e) {
      console.error('Failed to change tenant plan', e);
    } finally {
      setSubmittingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Multi-Tenant SaaS Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Global management of registered client organizations, active subscription plans, and API keys.
          </p>
        </div>

        <button
          onClick={fetchTenants}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tenants</span>
        </button>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Tenant Organization</th>
                <th className="py-3 px-6">Owner Account</th>
                <th className="py-3 px-6">Active Plan</th>
                <th className="py-3 px-6">Metrics</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading tenants list...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No multi-tenant organizations found.
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const sub = t.subscriptions?.[0];
                  const plan = sub?.plan;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{t.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">slug: {t.slug}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-slate-200 font-medium">{t.owner?.email}</div>
                        <div className="text-[11px] text-slate-400">
                          {t.owner?.profile?.first_name || t.owner?.profile?.last_name
                            ? `${t.owner?.profile?.first_name || ''} ${t.owner?.profile?.last_name || ''}`
                            : 'Owner Profile'}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-violet-950/40 border border-violet-500/30 text-violet-300 text-[11px] font-semibold">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <span>{plan?.name || 'Free Starter'}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-300 text-[11px] space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{t._count?.members || 1} Team Members</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <KeyRound className="w-3 h-3 text-slate-500" />
                          <span>{t._count?.api_keys || 0} API Keys</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {t.status === 'ACTIVE' ? (
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

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openPlanModal(t)}
                          className="px-3 py-1 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40 text-xs font-medium transition-colors"
                        >
                          Change Plan
                        </button>

                        <button
                          onClick={() => toggleTenantStatus(t)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            t.status === 'SUSPENDED'
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:bg-rose-900/40'
                          }`}
                        >
                          {t.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Plan Dialog */}
      {planModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Upgrade or Change SaaS Plan</h3>
            <p className="text-xs text-slate-400 mt-1">
              Organization: <span className="text-violet-400 font-semibold">{selectedTenant.name}</span>
            </p>

            <form onSubmit={handlePlanSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Subscription Plan Tier
                </label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500/60"
                >
                  <option value="">Select Plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.price_monthly}/mo (Max KYC: {p.max_kyc_monthly}, KYB: {p.max_kyb_monthly})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan || !selectedPlanId}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50"
                >
                  {submittingPlan ? 'Updating...' : 'Save Plan Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
