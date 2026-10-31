'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  User,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminKybPage() {
  const { token } = useAdminAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBiz, setSelectedBiz] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/kyb/queue', {}, token);
      if (res.ok) {
        setBusinesses(res.data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch KYB queue', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQueue();
    }
  }, [token]);

  const openDecisionModal = (biz: any, type: 'APPROVE' | 'REJECT') => {
    setSelectedBiz(biz);
    setDecision(type);
    setReason('');
    setModalOpen(true);
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    setSubmitting(true);

    try {
      const res = await apiFetch<any>(
        `/admin/kyb/${selectedBiz.id}/review`,
        {
          method: 'POST',
          body: JSON.stringify({ decision, reason: reason || undefined }),
        },
        token,
      );

      if (res.ok) {
        setModalOpen(false);
        fetchQueue();
      }
    } catch (e) {
      console.error('Failed to submit KYB decision', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Business KYB Compliance Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Validate corporate trade licenses, business registrations, and linked owner KYC credentials.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({businesses.length})</span>
        </button>
      </div>

      {/* KYB Applications List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading business verification queue...
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Building2 className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">KYB Queue is Clear</h3>
            <p className="text-xs text-slate-500 mt-1">No pending corporate KYB applications requiring review.</p>
          </div>
        ) : (
          businesses.map((b) => {
            const owner = b.members?.[0]?.user;

            return (
              <div
                key={b.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all backdrop-blur-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Company Details */}
                  <div className="space-y-3 max-w-sm">
                    <div>
                      <div className="text-sm font-bold text-white">{b.legal_name}</div>
                      {b.trade_name && (
                        <div className="text-xs text-slate-400">Trade: {b.trade_name}</div>
                      )}
                      <div className="text-[11px] text-slate-500 mt-1">
                        Type: <span className="text-slate-300 font-medium">{b.business_type}</span> &bull; Country:{' '}
                        <span className="text-slate-300 font-medium">{b.country_code}</span>
                      </div>
                    </div>

                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-medium">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Status: {b.status}</span>
                    </div>

                    {/* Owner linkage info */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                      <div className="text-[10px] uppercase font-semibold text-slate-500 flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Business Owner Contact</span>
                      </div>
                      <div className="text-slate-200 font-medium truncate">{owner?.email || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">
                        {owner?.profile?.first_name || owner?.profile?.last_name
                          ? `${owner?.profile?.first_name || ''} ${owner?.profile?.last_name || ''}`
                          : 'Profile unconfigured'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Trade License Information */}
                  <div className="flex-1 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-3">
                    <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Trade License Credentials</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">License Number</span>
                        <span className="text-slate-200 font-mono font-semibold">
                          {b.trade_license_number || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Issuing Authority</span>
                        <span className="text-slate-200">{b.issuing_authority || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Issue Date</span>
                        <span className="text-slate-200">
                          {b.license_issue_date
                            ? new Date(b.license_issue_date).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Expiry Date</span>
                        <span className="text-slate-200">
                          {b.license_expiry_date
                            ? new Date(b.license_expiry_date).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase">Registered Address</span>
                      <span className="text-slate-300 text-[11px]">{b.address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => openDecisionModal(b, 'APPROVE')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve KYB</span>
                    </button>

                    <button
                      onClick={() => openDecisionModal(b, 'REJECT')}
                      className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject KYB</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Decision Dialog */}
      {modalOpen && selectedBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {decision === 'APPROVE' ? 'Approve Trade License KYB' : 'Reject Business KYB'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Company: <span className="text-cyan-400 font-semibold">{selectedBiz.legal_name}</span>
            </p>

            <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {decision === 'APPROVE' ? 'Compliance Verification Notes' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  rows={3}
                  required={decision !== 'APPROVE'}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    decision === 'APPROVE'
                      ? 'Government registrar database verification complete...'
                      : 'Expired trade license / invalid registration authority...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
                    decision === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Confirm ${decision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
