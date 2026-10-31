'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminBillingPage() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/billing/overview', {}, token);
      if (res.ok) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load billing overview', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBilling();
    }
  }, [token]);

  const markInvoicePaid = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    try {
      const res = await apiFetch<any>(
        `/admin/billing/invoices/${invoiceId}/pay`,
        { method: 'POST' },
        token,
      );
      if (res.ok) {
        fetchBilling();
      }
    } catch (e) {
      console.error('Failed to mark invoice paid', e);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Subscriptions Control</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track platform recurring revenue, manage tenant subscriptions, and reconcile invoices.
          </p>
        </div>

        <button
          onClick={fetchBilling}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400 mb-2">Total Platform Revenue Collected</div>
          <div className="text-3xl font-bold text-emerald-400">
            ${data?.totalCollected?.toFixed(2) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Settled payments to date</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400 mb-2">Active Subscriptions</div>
          <div className="text-3xl font-bold text-white">
            {data?.subscriptions?.filter((s: any) => s.status === 'ACTIVE').length || 0}
          </div>
          <div className="text-[11px] text-indigo-400 mt-1">Across all tenant tiers</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
          <div className="text-xs font-medium text-slate-400 mb-2">Generated Invoices</div>
          <div className="text-3xl font-bold text-white">
            {data?.invoices?.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Invoices issued</div>
        </div>
      </div>

      {/* Subscriptions Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80">
          <h2 className="text-sm font-semibold text-white">All Tenant Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5">Active and trialing subscription plans.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Tenant Organization</th>
                <th className="py-3 px-6">Assigned Plan</th>
                <th className="py-3 px-6">Billing Cycle</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading subscriptions...</td>
                </tr>
              ) : data?.subscriptions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No subscriptions found.</td>
                </tr>
              ) : (
                data?.subscriptions?.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-6 font-medium text-white">{sub.tenant?.name}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-indigo-400">{sub.plan?.name}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">
                        (${sub.plan?.price_monthly}/mo)
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">{sub.billing_cycle}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{sub.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px]">
                      {new Date(sub.current_period_end).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80">
          <h2 className="text-sm font-semibold text-white">Invoices & Reconciliation</h2>
          <p className="text-xs text-slate-400 mt-0.5">Audit log of system generated invoices and settlement state.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Organization</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Created Date</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading invoices...</td>
                </tr>
              ) : data?.invoices?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No invoices issued yet.</td>
                </tr>
              ) : (
                data?.invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-300">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-6 text-slate-200">{inv.tenant?.name}</td>
                    <td className="py-3.5 px-6 font-mono font-bold text-white">
                      ${inv.amount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-3.5 px-6">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[11px] font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Open</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => markInvoicePaid(inv.id)}
                          disabled={payingInvoiceId === inv.id}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          {payingInvoiceId === inv.id ? 'Recording...' : 'Mark Paid (Manual)'}
                        </button>
                      )}
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
