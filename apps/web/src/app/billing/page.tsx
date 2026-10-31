'use client';

import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function BillingPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [subscription, setSubscription] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInv, setPayingInv] = useState<any | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const fetchTenants = async () => {
    try {
      const res = await apiFetch<any>('/tenants', {}, token);
      if (res.ok && res.data?.length > 0) {
        setTenants(res.data);
        setSelectedTenantId(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load user tenants', e);
    }
  };

  const fetchBillingDetails = async (tenantId: string) => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        apiFetch<any>(`/billing/subscription/${tenantId}`, {}, token),
        apiFetch<any>(`/billing/invoices/${tenantId}`, {}, token),
      ]);

      if (subRes.ok) setSubscription(subRes.data);
      if (invRes.ok) setInvoices(invRes.data || []);
    } catch (e) {
      console.error('Failed to load billing details', e);
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
      fetchBillingDetails(selectedTenantId);
    }
  }, [token, selectedTenantId]);

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInv) return;
    setPaymentSubmitting(true);

    try {
      const res = await apiFetch<any>(
        `/billing/invoices/${payingInv.id}/pay`,
        {
          method: 'POST',
          body: JSON.stringify({ paymentMethod: 'CARD' }),
        },
        token,
      );

      if (res.ok) {
        setPayingInv(null);
        fetchBillingDetails(selectedTenantId);
      }
    } catch (e) {
      console.error('Failed to settle invoice', e);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review active SaaS subscription, trial status, and payment history.
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

      {/* Subscription Status Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Current Active Subscription
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {subscription?.plan?.name || 'Free Starter Plan'}
            </div>
            <div className="text-xs text-slate-400">
              ${subscription?.plan?.price_monthly || 0} / month &bull; Billed {subscription?.billing_cycle || 'MONTHLY'}
            </div>
          </div>

          {/* Trial / Status Badge */}
          <div>
            {subscription?.isTrial ? (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                <div className="font-semibold flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Free Trial Active</span>
                </div>
                <div className="text-[11px] text-amber-400/80 mt-0.5">
                  {subscription.daysLeftInTrial} days remaining before billing begins.
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Subscription Status: Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80">
          <h2 className="text-sm font-semibold text-white">Invoice History</h2>
          <p className="text-xs text-slate-400 mt-0.5">View and settle past statements.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No invoices on file.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-6 font-mono font-semibold text-indigo-300">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-6 text-slate-200">
                      {inv.billing_reason || 'Monthly Subscription'}
                    </td>
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
                          <span>Pending Payment</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px]">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => setPayingInv(inv)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          Pay Now
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

      {/* Pay Invoice Dialog */}
      {payingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">Settle Statement</h3>
            <p className="text-xs text-slate-400 mt-1">
              Invoice #{payingInv.invoice_number} &bull; Total: ${payingInv.amount.toFixed(2)} USD
            </p>

            <form onSubmit={handlePayInvoice} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Statement Total:</span>
                  <span className="font-bold text-white font-mono">${payingInv.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Payment Gateway:</span>
                  <span className="text-emerald-400">Mock Direct Clearing</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    defaultValue="4242 •••• •••• 4242"
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingInv(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {paymentSubmitting ? 'Clearing...' : 'Pay $' + payingInv.amount.toFixed(2)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
