'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { CreditCard, Search, ExternalLink, Printer } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function ClientInvoicesContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  let rawInvoices = whmcsData?.invoices || [];
  if (impersonate) {
    const matched = rawInvoices.filter((inv: any) => String(inv.userid) === String(impersonate));
    if (matched.length > 0) {
      rawInvoices = matched;
    }
  }

  const filtered = rawInvoices.filter((inv: any) => {
    const matchesSearch =
      String(inv.id).includes(searchTerm) ||
      (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-[#f39c12]" />
            <span>My Invoices ({rawInvoices.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review billing history, payment receipts, and settle outstanding dues via PipraPay.
          </p>
        </div>
        <div>
          <Link
            href="/clientarea/addfunds"
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
          >
            + Add Funds Deposit
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All ({rawInvoices.length})</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Invoice Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.slice(0, 50).map((inv: any) => (
              <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-[#1A4D80]">
                  #{inv.id}
                </td>
                <td className="py-3.5 px-4 text-slate-600">{inv.date}</td>
                <td className="py-3.5 px-4 text-slate-600">{inv.duedate}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                  ৳{parseFloat(inv.total || '0').toFixed(2)} BDT
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.status === 'Unpaid'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <a
                    href={`/viewinvoice?id=${inv.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded font-semibold transition-colors"
                  >
                    <span>{inv.status === 'Unpaid' ? 'Pay Now' : 'View'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function ClientInvoicesPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Invoices...</div>}>
        <ClientInvoicesContent />
      </Suspense>
    </div>
  );
}
