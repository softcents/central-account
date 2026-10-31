'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  Building,
  CreditCard,
  X,
  FileCheck2,
  User,
  KeyRound,
  ShieldAlert,
  Loader2,
  LogIn,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminSearch } from '@/context/AdminSearchContext';
import { apiFetch } from '@/lib/api';

export default function AdminUsersPage() {
  const { token, admin } = useAdminAuth();
  const { searchQuery, setSearchQuery, clearSearch } = useAdminSearch();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Impersonation state
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);
  const [selectedUserForImpersonate, setSelectedUserForImpersonate] = useState<any | null>(null);
  const [submittingImpersonate, setSubmittingImpersonate] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async (searchVal = searchQuery, statusVal = statusFilter) => {
    if (!token) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchVal && searchVal.trim()) queryParams.set('search', searchVal.trim());
      if (statusVal) queryParams.set('status', statusVal);

      const res = await apiFetch<any>(`/admin/users?${queryParams.toString()}`, {}, token);
      if (res.ok) {
        setUsers(res.data.users || []);
      }
    } catch (e) {
      console.error('Error fetching users', e);
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, statusFilter]);

  // Realtime search with 300ms debounce
  useEffect(() => {
    if (!token) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchUsers(searchQuery, statusFilter);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, statusFilter, token, fetchUsers]);

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const openStatusModal = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setSelectedUser(user);
    setNewStatus(user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED');
    setStatusReason('');
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmittingStatus(true);

    try {
      const res = await apiFetch<any>(
        `/admin/users/${selectedUser.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ status: newStatus, reason: statusReason }),
        },
        token,
      );

      if (res.ok) {
        setStatusModalOpen(false);
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to update user status', e);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const openImpersonateModal = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setSelectedUserForImpersonate(user);
    setImpersonateError(null);
    setImpersonateModalOpen(true);
  };

  const handleConfirmImpersonate = async () => {
    if (!selectedUserForImpersonate || !token) return;
    setSubmittingImpersonate(true);
    setImpersonateError(null);

    try {
      const res = await apiFetch<any>(
        `/admin/users/${selectedUserForImpersonate.id}/impersonate`,
        { method: 'POST' },
        token,
      );

      if (res.ok && res.data?.accessToken) {
        // Save impersonation session state so top banner displays and admin can leave
        const impersonationData = {
          isImpersonating: true,
          adminToken: token,
          adminUser: admin,
          impersonator: res.data.impersonator || admin,
          targetUser: res.data.user || selectedUserForImpersonate,
          impersonatedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem('ci_impersonator_backup', JSON.stringify(impersonationData));
          localStorage.setItem('auth_token', res.data.accessToken);
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          window.dispatchEvent(new Event('ci_impersonation_updated'));
        } catch (e) {
          console.error('Failed to set localStorage tokens', e);
        }

        // Navigate directly to user panel as that user
        const targetUrl = res.data.redirectUrl || '/dashboard';
        window.location.href = targetUrl;
      } else {
        setImpersonateError(res.data?.message || 'Failed to initialize impersonation session');
      }
    } catch (err: any) {
      setImpersonateError(err?.message || 'Error occurred during impersonation');
    } finally {
      setSubmittingImpersonate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Central User Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global account inspection, verified customer registration dossiers, KYC biometric photos, and administrative controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, NID number, phone, company..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {searchQuery && (
            <span className="text-[11px] text-indigo-300 font-mono bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-500/30">
              Query: &quot;{searchQuery}&quot;
            </span>
          )}

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3.5 px-6">User Account & Registration</th>
                <th className="py-3.5 px-6">Account Status</th>
                <th className="py-3.5 px-6">KYC & Biometrics</th>
                <th className="py-3.5 px-6">Organization / KYB</th>
                <th className="py-3.5 px-6">Registered</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <span className="text-xs text-slate-400">Loading user directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-400">No registered users match your criteria.</p>
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-900/50 transition-colors"
                      >
                        Clear Search Query
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const kyc = u.identity_verifications?.[0];
                  const biz = u.business_memberships?.[0];
                  const reg = u.customer_registration;
                  const profileName = u.profile?.first_name || u.profile?.last_name
                    ? `${u.profile?.first_name || ''} ${u.profile?.last_name || ''}`.trim()
                    : null;
                  const displayName = reg?.full_name || profileName || 'Name not configured';

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleRowClick(u.id)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-all group"
                      title="Click user area to view complete dossier and records"
                    >
                      {/* USER ACCOUNT & REGISTRATION (Clickable to dynamic user details page) */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-indigo-500/50 group-hover:bg-slate-800 transition-colors">
                            <User className="w-4 h-4 text-slate-300 group-hover:text-indigo-300 transition-colors" />
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center space-x-2">
                              <span className="group-hover:underline underline-offset-2">{u.email}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5 font-medium group-hover:text-slate-200 transition-colors">
                              {displayName}
                            </div>
                            {/* Badges for NID and registration type */}
                            <div className="flex items-center space-x-2 mt-1">
                              {reg?.nid_passport_number ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  <span>NID: {reg.nid_passport_number}</span>
                                </span>
                              ) : null}
                              {reg?.customer_type ? (
                                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-semibold tracking-wider ${
                                  reg.customer_type === 'COMPANY'
                                    ? 'bg-violet-950/60 text-violet-300 border border-violet-500/30'
                                    : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                                }`}>
                                  {reg.customer_type}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ACCOUNT STATUS */}
                      <td className="py-3.5 px-6">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : u.status === 'SUSPENDED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 text-[11px] font-medium">
                            <XCircle className="w-3 h-3" />
                            <span>Suspended</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          {u.email_verified ? 'Email verified' : 'Email unverified'}
                        </div>
                      </td>

                      {/* KYC LEVEL & STATUS */}
                      <td className="py-3.5 px-6">
                        {kyc?.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                            <ShieldCheck className="w-3 h-3 text-indigo-400" />
                            <span>{kyc.verification_level || 'LEVEL_2'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-400 text-[11px]">
                            <span>Unverified</span>
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1">
                          {u.customer_registration_completed ? (
                            <span className="text-emerald-400 font-medium">Registration Completed</span>
                          ) : (
                            <span className="text-amber-400/80">Reg. Pending</span>
                          )}
                        </div>
                      </td>

                      {/* ORGANIZATION / KYB (Clickable to user details page) */}
                      <td className="py-3.5 px-6">
                        {biz?.business ? (
                          <div className="flex items-center space-x-1.5 text-slate-300 group-hover:text-indigo-200 transition-colors">
                            <Building className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="truncate max-w-[140px] font-medium">{biz.business.legal_name}</span>
                          </div>
                        ) : reg?.company_name ? (
                          <div className="flex items-center space-x-1.5 text-slate-300 group-hover:text-indigo-200 transition-colors">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span className="truncate max-w-[140px]">{reg.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">&mdash;</span>
                        )}
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px]">
                        <div>{new Date(u.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">{new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>

                      {/* ACTIONS: Impersonate Button replaces View Details */}
                      <td className="py-3.5 px-6 text-right space-x-2">
                        <button
                          onClick={(e) => openImpersonateModal(e, u)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200 transition-all inline-flex items-center space-x-1.5 shadow-sm group/imp"
                          title={`Impersonate and login as ${u.email} without password`}
                        >
                          <KeyRound className="w-3 h-3 text-amber-400 group-hover/imp:scale-110 transition-transform" />
                          <span>Impersonate</span>
                        </button>

                        <button
                          onClick={(e) => openStatusModal(e, u)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                            u.status === 'SUSPENDED'
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
                              : 'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:bg-rose-900/40'
                          }`}
                        >
                          {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
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

      {/* Impersonate Confirmation Modal (Mirrors filament-impersonate from sms.whiteinfobd.com) */}
      {impersonateModalOpen && selectedUserForImpersonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-950/30">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>Impersonate User Account</span>
                  </h3>
                  <p className="text-xs text-amber-300/80 font-medium mt-0.5">
                    Administrative &quot;Login As&quot; Access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImpersonateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Box (Identical authorization notice to sms.whiteinfobd.com) */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Administrative Authorization Notice</p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  This action grants full access to another user account and is intended strictly for authorized debugging or support purposes. Never use it to impersonate a user without explicit permission.
                </p>
              </div>
            </div>

            {/* Target User Details Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Target User:</span>
                <span className="font-semibold text-white font-mono">{selectedUserForImpersonate.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Full Name:</span>
                <span className="text-slate-200 font-medium">
                  {selectedUserForImpersonate.customer_registration?.full_name ||
                    (selectedUserForImpersonate.profile?.first_name
                      ? `${selectedUserForImpersonate.profile.first_name} ${selectedUserForImpersonate.profile.last_name || ''}`.trim()
                      : 'Not configured')}
                </span>
              </div>
              {selectedUserForImpersonate.customer_registration?.nid_passport_number && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">NID / Passport:</span>
                  <span className="font-mono text-indigo-400">
                    {selectedUserForImpersonate.customer_registration.nid_passport_number}
                  </span>
                </div>
              )}
              {selectedUserForImpersonate.customer_registration?.company_name && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Company:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedUserForImpersonate.customer_registration.company_name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Account Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  selectedUserForImpersonate.status === 'ACTIVE'
                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                }`}>
                  {selectedUserForImpersonate.status}
                </span>
              </div>
            </div>

            {/* Impersonation Persistence Notice */}
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Your administrative session will remain preserved in the background. A fixed top banner will allow you to return to the Admin Portal at any time with one click.
            </p>

            {impersonateError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {impersonateError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setImpersonateModalOpen(false)}
                disabled={submittingImpersonate}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImpersonate}
                disabled={submittingImpersonate}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {submittingImpersonate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Session...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Login As User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Change Modal */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {newStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Updating account status for <span className="text-indigo-400 font-semibold">{selectedUser.email}</span>.
            </p>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrative Reason / Note
                </label>
                <textarea
                  required
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="State reason for suspension or reactivation for compliance audit logs..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
                    newStatus === 'SUSPENDED'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {submittingStatus ? 'Updating...' : `Confirm ${newStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

