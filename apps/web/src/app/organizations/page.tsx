'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Plus,
  ArrowRight,
  Sparkles,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function OrganizationsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/tenants', {}, token);
      if (res.ok) {
        setOrganizations(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load organizations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrganizations();
    }
  }, [token]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch<any>(
        '/tenants',
        {
          method: 'POST',
          body: JSON.stringify({ name: orgName, slug: orgSlug || undefined }),
        },
        token,
      );

      if (!res.ok) {
        throw new Error(res.data?.message || 'Failed to create organization');
      }

      const newOrgId = res.data?.id;
      setModalOpen(false);
      setOrgName('');
      setOrgSlug('');

      // Redirect immediately to subscription page to select a plan
      // The org starts SUSPENDED — subscribing activates it
      if (newOrgId) {
        router.push(`/subscription?org=${newOrgId}`);
      } else {
        fetchOrganizations();
      }
    } catch (err: any) {
      setError(err.message || 'Error creating organization');
    } finally {
      setSubmitting(false);
    }
  };

  const suspended = organizations.filter((o) => o.status === 'SUSPENDED');
  const active = organizations.filter((o) => o.status !== 'SUSPENDED');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Organizations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your SaaS workspaces, team members, API credentials, and subscriptions.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* ── Pending Activation Banner ── */}
      {suspended.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Awaiting Plan Selection ({suspended.length})</span>
          </div>

          {suspended.map((org) => (
            <div
              key={org.id}
              className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {org.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{org.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    slug: {org.slug}
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400 font-medium">
                      Not yet activated — select a plan to go live
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/subscription?org=${org.id}`}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/30 transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Activate — Select Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Active Organizations Grid ── */}
      {active.length > 0 && (
        <div className="space-y-3">
          {suspended.length > 0 && (
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Organizations ({active.length})</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((org) => {
              const plan = org.subscriptions?.[0]?.plan;

              return (
                <div
                  key={org.id}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {org.name[0]}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-indigo-400 text-[10px] font-semibold uppercase tracking-wider">
                        {org.userRole || 'OWNER'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">{org.name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">slug: {org.slug}</div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Plan:</span>
                        <span className="text-violet-400 font-medium">
                          {plan?.name || 'Free'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">KYC Limit:</span>
                        <span className="text-slate-200">
                          {plan?.max_kyc_monthly ?? 20}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">KYB Limit:</span>
                        <span className="text-slate-200">
                          {plan?.max_kyb_monthly ?? 5}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Team Members:</span>
                        <span className="text-slate-200">{org._count?.members || 1}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">API Keys:</span>
                        <span className="text-slate-200">{org._count?.api_keys || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/organizations/${org.id}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Manage Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/subscription?org=${org.id}`}
                      className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Change Plan</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading your organizations...
        </div>
      ) : organizations.length === 0 ? (
        <div className="py-16 text-center text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Organizations Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create an organization, select your plan, and start running KYC/KYB verifications
            for your company.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Organization</span>
          </button>
        </div>
      ) : null}

      {/* ── Create Organization Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <Boxes className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Organization</h3>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-1">
              After creating your organization, you&apos;ll be taken to the plan selection screen.
              Your organization activates the moment you choose a plan — free or paid.
            </p>

            {/* Onboarding flow hint */}
            <div className="mt-3 mb-4 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-semibold text-indigo-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2-Step Activation</span>
              </div>
              <div className="text-slate-400 space-y-0.5 ml-5">
                <div>① Enter your organization name below</div>
                <div>② Select your subscription plan to go live</div>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Financial Services"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  URL Slug <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="acme-finance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setError(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !orgName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {submitting ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <span>Create & Select Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
