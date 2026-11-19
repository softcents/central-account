'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, Download, CreditCard, CheckCircle, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id') || '464';
  const invoiceId = rawId.replace(/[^0-9]/g, '');

  const [paymentGateway, setPaymentGateway] = useState('piprapay');
  const [loadingPay, setLoadingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Find invoice in synced data
  const invoice = (whmcsData?.invoices || []).find(
    (inv: any) => String(inv.id) === invoiceId || String(inv.invoicenum) === invoiceId
  );

  const client = invoice
    ? (whmcsData?.clients || []).find((c: any) => String(c.id) === String(invoice.userid))
    : null;

  const status = (invoice?.status || 'Unpaid').toUpperCase();
  const amount = parseFloat(invoice?.total || '1500.00');

  const items = invoice?.items && invoice.items.length > 0
    ? invoice.items
    : [
        {
          description: `SoftCents Hosting & PBX Services (Invoice #${invoiceId})`,
          amount: amount,
        },
      ];

  const handlePayNow = async () => {
    try {
      setLoadingPay(true);
      setPayError(null);

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoiceId || '0',
          amount: amount,
          fullName: client?.name || 'SoftCents Valued Client',
          email: client?.email || 'billing@softcents.com',
          phone: client?.phone || '01700000000',
        }),
      });

      const data = await res.json();

      if (data.pp_url) {
        window.location.href = data.pp_url;
      } else {
        setPayError(data.error || 'Failed to initiate PipraPay checkout. Please contact support.');
      }
    } catch (err: any) {
      setPayError(err.message || 'Payment initiation error');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div className="max-w-[850px] mx-auto bg-white border border-slate-300 rounded shadow-md p-8 sm:p-12 space-y-6 relative overflow-hidden">
      {/* Status Stamp / Watermark */}
      <div className="absolute top-8 right-8 text-right pointer-events-none select-none">
        {status === 'UNPAID' ? (
          <div className="border-4 border-rose-600 text-rose-600 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 uppercase tracking-widest rotate-[-12deg] opacity-80 inline-block">
            UNPAID
          </div>
        ) : status === 'PAID' ? (
          <div className="border-4 border-emerald-600 text-emerald-600 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 uppercase tracking-widest rotate-[-12deg] opacity-80 inline-block">
            PAID
          </div>
        ) : (
          <div className="border-4 border-slate-400 text-slate-500 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 uppercase tracking-widest rotate-[-12deg] opacity-80 inline-block">
            {status}
          </div>
        )}
      </div>

      {/* Invoice Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <img
            src="/whmcs/logo.png"
            alt="SoftCents Systems"
            className="h-10 w-auto object-contain mb-2"
          />
          <h1 className="text-xl font-bold text-slate-900">INVOICE #{invoiceId}</h1>
          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
            <div>Invoice Date: <strong>{invoice?.date || '20/11/2025'}</strong></div>
            <div>Due Date: <strong>{invoice?.duedate || '26/11/2025'}</strong></div>
          </div>
        </div>

        <div className="text-right space-y-2 pt-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium text-xs border border-slate-300 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Pay Now Strip (for Unpaid invoices) */}
      {status === 'UNPAID' && (
        <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-800 text-sm">Payment Method</div>
              <p className="text-slate-500">Pay securely via bKash, Nagad, Rocket, or Debit/Credit Cards</p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={paymentGateway}
                onChange={(e) => setPaymentGateway(e.target.value)}
                className="p-2 border border-slate-300 rounded bg-white text-xs font-semibold focus:outline-none"
              >
                <option value="piprapay">PipraPay (bKash / Nagad / Rocket / Cards)</option>
                <option value="bank">Bank Transfer (City Bank / BRAC Bank)</option>
              </select>
              <button
                onClick={handlePayNow}
                disabled={loadingPay}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] disabled:opacity-50 text-white px-5 py-2 rounded font-bold transition-colors shadow-sm flex items-center space-x-1.5"
              >
                {loadingPay ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Pay Now &rarr;</span>
                )}
              </button>
            </div>
          </div>

          {payError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{payError}</span>
            </div>
          )}
        </div>
      )}

      {/* Invoiced To / Pay To Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wider">Invoiced To</h3>
          <div className="font-bold text-slate-900 text-sm">{client?.name || invoice?.clientName || 'Valued Customer'}</div>
          {client?.company && <div>{client.company}</div>}
          <div>{client?.address1 || 'Dhaka, Bangladesh'}</div>
          <div>{client?.city || 'Dhaka'}, Bangladesh</div>
          <div className="text-slate-500 mt-1">{client?.phone || ''}</div>
          <div className="text-[#1A4D80]">{client?.email || ''}</div>
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wider">Pay To</h3>
          <div className="font-bold text-slate-900 text-sm">SoftCents Systems Ltd.</div>
          <div>Suite #502, BDBL Bhaban, Kawran Bazar</div>
          <div>Dhaka - 1215, Bangladesh</div>
          <div className="text-slate-500 mt-1">Hotline: +880 9617 510 510</div>
          <div className="text-[#1A4D80]">billing@softcents.com</div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">Description</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: any, idx: number) => (
              <tr key={idx}>
                <td className="py-3 px-4 text-slate-800">{item.description}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">
                  ৳{parseFloat(item.amount || '0').toFixed(2)} BDT
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end text-xs">
        <div className="w-64 space-y-2 border border-slate-200 rounded p-4 bg-slate-50">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>৳{amount.toFixed(2)} BDT</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Credit Applied:</span>
            <span>৳0.00 BDT</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-300 pt-2">
            <span>Total Balance Due:</span>
            <span className={status === 'UNPAID' ? 'text-rose-600' : 'text-emerald-600'}>
              ৳{amount.toFixed(2)} BDT
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table (if any) */}
      {invoice && status === 'PAID' && (
        <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
          <h4 className="font-bold text-slate-800">Transactions / Payments</h4>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Payment received via <strong>{invoice.paymentmethod || 'PipraPay'}</strong></span>
            </div>
            <span className="font-bold">৳{amount.toFixed(2)} BDT</span>
          </div>
        </div>
      )}

      {/* Footer Notes */}
      <div className="text-center text-[11px] text-slate-400 border-t border-slate-200 pt-4">
        Thank you for choosing SoftCents Systems Ltd. This is a computer-generated invoice and requires no physical signature.
      </div>
    </div>
  );
}

export default function ViewInvoicePage() {
  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans">
      <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading Invoice...</div>}>
        <InvoiceContent />
      </Suspense>
    </div>
  );
}
