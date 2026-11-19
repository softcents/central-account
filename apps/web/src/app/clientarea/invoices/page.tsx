'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { CreditCard, Search, ExternalLink, Printer } from 'lucide-react';

export default function ClientInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const invoices = [
    {
      id: '464',
      date: '2026-11-19',
      dueDate: '2026-11-26',
      total: '৳1,500.00 BDT',
      status: 'Unpaid',
    },
    {
      id: '420',
      date: '2026-10-19',
      dueDate: '2026-10-26',
      total: '৳1,500.00 BDT',
      status: 'Paid',
    },
    {
      id: '388',
      date: '2026-09-19',
      dueDate: '2026-09-26',
      total: '৳1,500.00 BDT',
      status: 'Paid',
    },
  ];

  const filtered = invoices.filter((inv) => {
    const matchesSearch = inv.id.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <CreditCard className="w-6 h-6 text-[#f39c12]" />
              <span>My Invoices</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review billing history, payment receipts, and settle outstanding dues.
            </p>
          </div>
          <div>
            <Link
              href="/clientarea/addfunds"
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
            >
              + Add Funds to Account
            </Link>
          </div>
        </div>

        {/* Filters */}
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
              <option value="ALL">All ({invoices.length})</option>
              <option value="UNPAID">Unpaid (1)</option>
              <option value="PAID">Paid (2)</option>
              <option value="CANCELLED">Cancelled (0)</option>
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
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                    #{inv.id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{inv.date}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{inv.dueDate}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {inv.total}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {inv.status === 'Unpaid' ? (
                      <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Unpaid
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Paid
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/viewinvoice?id=${inv.id}`}
                      className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold transition-colors border border-slate-300"
                    >
                      <span>View Invoice</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
