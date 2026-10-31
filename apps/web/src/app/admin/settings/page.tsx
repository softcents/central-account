'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminSettingsPage() {
  const { token, admin } = useAdminAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('KYC_REVIEWER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/team', {}, token);
      if (res.ok) {
        setTeam(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load admin team', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTeam();
    }
  }, [token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch<any>(
        '/admin/team',
        {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, email, password, role }),
        },
        token,
      );

      if (!res.ok) {
        throw new Error(res.data?.message || 'Failed to create administrative user');
      }

      setCreateModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      fetchTeam();
    } catch (err: any) {
      setError(err.message || 'Error creating admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Team & Granular RBAC</h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision compliance reviewers, SaaS managers, security officers, and support agents.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision New Admin</span>
        </button>
      </div>

      {/* Team Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Administrator</th>
                <th className="py-3 px-6">Assigned Role</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Last Login</th>
                <th className="py-3 px-6 text-right">Provisioned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading admin roster...</td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No admin users found.</td>
                </tr>
              ) : (
                team.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">
                        {a.first_name} {a.last_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{a.email}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 font-semibold text-[10px] uppercase tracking-wider">
                        <Shield className="w-3 h-3 text-indigo-400" />
                        <span>{a.role.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                      {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : 'Never'}
                    </td>

                    <td className="py-4 px-6 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Admin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Provision Administrative User</h3>
            <p className="text-xs text-slate-400 mt-1">
              Grant operations, verification, or compliance access to the Central Account platform.
            </p>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@softcents.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="KYC_REVIEWER">KYC Reviewer (Documents & Biometrics)</option>
                  <option value="KYB_REVIEWER">KYB Reviewer (Trade Licenses)</option>
                  <option value="SAAS_ADMIN">SaaS Admin (Tenants & Plans)</option>
                  <option value="BILLING_ADMIN">Billing Admin (Invoices & Payments)</option>
                  <option value="SUPPORT_AGENT">Support Agent (Tickets & Assistance)</option>
                  <option value="SECURITY_ADMIN">Security Admin (OAuth & Locks)</option>
                  <option value="AUDITOR">Compliance Auditor (Read-Only Logs)</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full System Control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Provisioning...' : 'Provision Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
