'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, Download, CreditCard, CheckCircle, ShieldCheck } from 'lucide-react';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id') || '464';

  const [paymentGateway, setPaymentGateway] = useState('bkash_nagad');
  const [status, setStatus] = useState('UNPAID');

  const items = [
    {
      description: 'Standard Cloud VPS - 2 vCPU, 4GB RAM (20/11/2026 - 19/12/2026)',
      amount: 1500.0,
    },
  ];

  const subtotal = 1500.0;
  const credit = 0.0;
  const total = 1500.0;

  const handlePayNow = () => {
    alert(`Redirecting to ${paymentGateway === 'bkash_nagad' ? 'bKash / Nagad' : 'SSLCommerz'} secure payment gateway...`);
  };

  return (
    <div className="max-w-[850px] mx-auto bg-white border border-slate-300 rounded shadow-md p-8 sm:p-12 space-y-6 relative overflow-hidden">
      {/* Status Stamp / Watermark */}
      <div className="absolute top-8 right-8 text-right pointer-events-none select-none">
        {status === 'UNPAID' ? (
          <div className="border-4 border-rose-600 text-rose-600 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 uppercase tracking-widest rotate-[-12deg] opacity-80 inline-block">
            UNPAID
          </div>
        ) : (
          <div className="border-4 border-emerald-600 text-emerald-600 font-extrabold text-2xl sm:text-3xl px-4 py-1.5 uppercase tracking-widest rotate-[-12deg] opacity-80 inline-block">
            PAID
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
            <div>Invoice Date: <strong>20/11/2026</strong></div>
            <div>Due Date: <strong>26/11/2026</strong></div>
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
        <div className="bg-slate-50 border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-slate-800 text-sm">Payment Method</div>
            <p className="text-slate-500">Choose your preferred gateway to complete checkout</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={paymentGateway}
              onChange={(e) => setPaymentGateway(e.target.value)}
              className="p-2 border border-slate-300 rounded bg-white text-xs font-semibold focus:outline-none"
            >
              <option value="bkash_nagad">bKash / Nagad / Rocket (Auto Gateway)</option>
              <option value="sslcommerz">SSLCommerz (VISA / Mastercard / Amex)</option>
              <option value="bank">Bank Transfer (EBL / City Bank)</option>
            </select>
            <button
              onClick={handlePayNow}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2 rounded font-bold transition-colors shadow-sm"
            >
              Pay Now &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Invoiced To / Pay To Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
        <div>
          <div className="font-bold text-slate-900 uppercase tracking-wider mb-1 text-[11px]">
            Invoiced To:
          </div>
          <div className="font-semibold text-slate-800 text-sm">Raju Ahmed</div>
          <div>SoftCents Systems Ltd.</div>
          <div>House 12, Road 4, Sector 3, Uttara</div>
          <div>Dhaka - 1230, Bangladesh</div>
          <div>Phone: +880 1700 000000</div>
        </div>

        <div className="sm:text-right">
          <div className="font-bold text-slate-900 uppercase tracking-wider mb-1 text-[11px]">
            Pay To:
          </div>
          <div className="font-semibold text-slate-800 text-sm">SoftCents Systems</div>
          <div>Billing & Accounts Department</div>
          <div>Dhaka, Bangladesh</div>
          <div>billing@softcents.com</div>
          <div>www.softcents.com</div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-4">Description</th>
              <th className="py-2.5 px-4 text-right w-36">Total (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-800">{item.description}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  ৳{item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/50">
              <td className="py-2 px-4 text-right font-bold text-slate-600">Sub Total:</td>
              <td className="py-2 px-4 text-right font-mono font-bold text-slate-800">
                ৳{subtotal.toFixed(2)} BDT
              </td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="py-2 px-4 text-right font-bold text-slate-600">Credit Applied:</td>
              <td className="py-2 px-4 text-right font-mono text-slate-600">
                ৳{credit.toFixed(2)} BDT
              </td>
            </tr>
            <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
              <td className="py-3 px-4 text-right text-sm text-slate-900">Total Due:</td>
              <td className="py-3 px-4 text-right text-base text-[#1A4D80] font-mono">
                ৳{total.toFixed(2)} BDT
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer info */}
      <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100">
        Invoice generated automatically by SoftCents Billing System • Thank you for your business!
      </div>
    </div>
  );
}

export default function ViewClientInvoicePage() {
  return (
    <div className="min-h-screen bg-[#f2f4f7] py-8 px-4 text-slate-800 font-sans">
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading invoice...</div>}>
        <InvoiceContent />
      </Suspense>
    </div>
  );
}
