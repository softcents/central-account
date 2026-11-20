'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { useActiveClient } from '@/hooks/useActiveClient';
import { CreditCard, Search, ExternalLink, Printer } from 'lucide-react';

function ClientInvoicesContent() {
  const searchParams = useSearchParams();
  const { clientId, client, impQuery, invoices, unpaidInvoices, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawInvoices = invoices;

  const filtered = rawInvoices.filter((inv: any) => {
    const matchesSearch =
      String(inv.id).includes(searchTerm) ||
      (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#f39c12]" />
            <span>My Invoices ({rawInvoices.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review billing history, payment receipts, and settle outstanding dues for {client?.name || 'Customer'}.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/clientarea/masspay${impQuery}`}
            className="w-full sm:w-auto text-center bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors inline-block"
          >
            Mass Payment
          </Link>
          <Link
            href={`/clientarea/addfunds${impQuery}`}
            className="w-full sm:w-auto text-center bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors inline-block"
          >
            + Add Funds Deposit
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="ALL">All ({rawInvoices.length})</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Mobile View: Cards (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs px-4">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No invoices found matching your criteria.</p>
            </div>
          ) : (
            filtered.slice(0, 50).map((inv: any) => (
              <div key={inv.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-sm text-[#1A4D80]">
                      Invoice #{inv.id}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Date: {inv.date || '-'} &bull; Due: {inv.duedate || '-'}
                    </div>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                      (inv.status || '').toLowerCase() === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : (inv.status || '').toLowerCase() === 'unpaid'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                  <div className="font-bold font-mono text-slate-900 text-sm">
                    ৳{parseFloat(inv.total || '0').toFixed(2)} BDT
                  </div>
                  <a
                    href={`/viewinvoice?id=${inv.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded font-semibold text-xs transition-colors text-white ${
                      (inv.status || '').toLowerCase() === 'unpaid' ? 'bg-[#5cb85c] hover:bg-[#4cae4c]' : 'bg-[#1A4D80] hover:bg-[#143d66]'
                    }`}
                  >
                    <span>{(inv.status || '').toLowerCase() === 'unpaid' ? 'Pay Now' : 'View'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No invoices found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map((inv: any) => (
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
                          (inv.status || '').toLowerCase() === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (inv.status || '').toLowerCase() === 'unpaid'
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
                        <span>{(inv.status || '').toLowerCase() === 'unpaid' ? 'Pay Now' : 'View'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
