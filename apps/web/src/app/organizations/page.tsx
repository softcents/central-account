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

      // Redirect immediately to organization workspace
      if (newOrgId) {
        router.push(`/organizations/${newOrgId}`);
      } else {
        fetchOrganizations();
      }
    } catch (err: any) {
      setError(err.message || 'Error creating organization');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* ── Organizations Grid ── */}
      {organizations.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => {
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
                        <span className="text-slate-400">Multi-Domain:</span>
                        <span className="text-emerald-400 font-medium">
                          Active (Unlimited)
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
