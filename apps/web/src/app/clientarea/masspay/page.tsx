'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function MassPayContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate') || searchParams.get('userid');

  // Filter unpaid invoices for this client
  const allInvoices = (whmcsData?.invoices || []) as any[];
  const clientInvoices = useMemo(() => {
    if (impersonate) {
      const matched = allInvoices.filter((i: any) => String(i.userid) === String(impersonate));
      if (matched.length > 0) return matched;
    }
    return allInvoices;
  }, [allInvoices, impersonate]);

  const unpaidInvoices = useMemo(() => {
    return clientInvoices.filter((inv: any) => (inv.status || '').toLowerCase() === 'unpaid');
  }, [clientInvoices]);

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(
    unpaidInvoices.map((inv) => String(inv.id))
  );

  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    if (selectedInvoiceIds.includes(id)) {
      setSelectedInvoiceIds(selectedInvoiceIds.filter((item) => item !== id));
    } else {
      setSelectedInvoiceIds([...selectedInvoiceIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === unpaidInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(unpaidInvoices.map((inv) => String(inv.id)));
    }
  };

  const totalAmount = useMemo(() => {
    return unpaidInvoices
      .filter((inv) => selectedInvoiceIds.includes(String(inv.id)))
      .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
  }, [unpaidInvoices, selectedInvoiceIds]);

  const handlePayNow = async () => {
    if (selectedInvoiceIds.length === 0 || totalAmount <= 0) {
      alert('Please select at least one unpaid invoice to pay.');
      return;
    }

    try {
      setLoadingPay(true);
      setPayError(null);

      const client = (whmcsData?.clients || []).find(
        (c: any) => String(c.id) === String(unpaidInvoices[0]?.userid || impersonate || '177')
      );

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: `MASS-${selectedInvoiceIds.join('-').slice(0, 20)}`,
          amount: totalAmount,
          fullName: client?.name || 'SoftCents Valued Customer',
          email: client?.email || 'billing@softcents.com',
          phone: client?.phone || '01700000000',
        }),
      });

      const data = await res.json();
      if (data.pp_url) {
        window.location.href = data.pp_url;
      } else {
        setPayError(data.error || 'Failed to initiate mass payment checkout.');
      }
    } catch (err: any) {
      setPayError(err.message || 'Payment initiation error');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <main className="max-w-[1000px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
            <span>Mass Payment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pay multiple unpaid invoices in a single instant transaction via PipraPay.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/clientarea/invoices"
            className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            &larr; Back to Invoices
          </Link>
        </div>
      </div>

      {payError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{payError}</span>
        </div>
      )}

      {unpaidInvoices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Unpaid Invoices</h2>
          <p className="text-xs text-slate-500">
            Great! Your account has zero outstanding invoices due for payment.
          </p>
          <Link
            href="/clientarea"
            className="inline-block bg-[#1A4D80] text-white px-5 py-2 rounded text-xs font-bold"
          >
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInvoiceIds.length === unpaidInvoices.length}
                onChange={handleSelectAll}
              />
              <span>Select All Invoices ({unpaidInvoices.length})</span>
            </label>

            <span className="text-slate-500">
              Selected: <strong>{selectedInvoiceIds.length}</strong> of {unpaidInvoices.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {unpaidInvoices.map((inv: any) => {
              const isChecked = selectedInvoiceIds.includes(String(inv.id));
              return (
                <div
                  key={inv.id}
                  onClick={() => handleToggle(String(inv.id))}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                    isChecked ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by div onClick
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        Invoice #{inv.id}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Invoice Date: {inv.date || '-'} &bull; Due Date: <span className="text-rose-600 font-semibold">{inv.duedate || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ৳{parseFloat(inv.total || '0').toFixed(2)} BDT
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                      Unpaid
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Summary Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Amount Due for Selected Invoices:</div>
              <div className="text-2xl font-bold font-mono text-[#1A4D80]">
                ৳{totalAmount.toFixed(2)} BDT
              </div>
            </div>

            <button
              onClick={handlePayNow}
              disabled={selectedInvoiceIds.length === 0 || loadingPay}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              {loadingPay ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting to PipraPay...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay All Selected Invoices (৳{totalAmount.toFixed(2)} BDT) &rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ClientMassPayPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Mass Payment...</div>}>
        <MassPayContent />
      </Suspense>
    </div>
  );
}
