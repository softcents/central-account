'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Plus,
  ChevronRight,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function TransactionsListPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const transactions = whmcsData?.transactions || [];

  const filtered = transactions.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        String(t.transid || '').toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        (t.gateway || '').toLowerCase().includes(q) ||
        String(t.invoiceid || '').includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalIncome = transactions.reduce((acc, t) => acc + (parseFloat(t.amountin) || 0), 0);
  const totalFees = transactions.reduce((acc, t) => acc + (parseFloat(t.fees) || 0), 0);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Transactions List ({transactions.length})</span>
      </div>

      {/* Income / Fees Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-slate-500 font-semibold">Total Transactions</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{transactions.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-emerald-600 font-semibold">Total Revenue In</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            ৳{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm">
          <div className="text-slate-500 font-semibold">Payment Gateway Fees</div>
          <div className="text-xl font-bold text-slate-600 mt-1">
            ৳{totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by transaction ID, invoice #, or client..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5f7f8] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Gateway</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Amount In</th>
                <th className="py-2.5 px-3">Fees</th>
                <th className="py-2.5 px-3">Invoice #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginated.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600">{t.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">
                      {t.transid || `TXN-${t.id}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/clients/${t.userid}`}
                        className="text-[#1A4D80] hover:underline font-semibold"
                      >
                        {t.clientName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{t.gateway || 'PipraPay'}</td>
                    <td className="py-2.5 px-3 text-slate-800">{t.description || 'Invoice Payment'}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      ৳{parseFloat(t.amountin || '0').toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      ৳{parseFloat(t.fees || '0').toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1A4D80]">
                      <a href={`/viewinvoice?id=${t.invoiceid}`} target="_blank" rel="noreferrer" className="hover:underline">
                        #{t.invoiceid}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-[#f9fafb]">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-200"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-[#1A4D80]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
