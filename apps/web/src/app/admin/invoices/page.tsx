'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Send,
  Trash2,
  Printer,
  ExternalLink,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function InvoicesListPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const [statusFilter, setStatusFilter] = useState(initialStatus.toUpperCase());
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const invoices = whmcsData?.invoices || [];

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && (inv.status || '').toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(inv.id).includes(q) ||
        String(inv.invoicenum || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.paymentmethod || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const unpaidCount = invoices.filter((i) => i.status === 'Unpaid').length;
  const cancelledCount = invoices.filter((i) => i.status === 'Cancelled').length;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Invoices ({invoices.length})</span>
      </div>

      {/* WHMCS Quick Status Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#1A4D80] text-white border-[#1A4D80] shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold">All Invoices</div>
          <div className="text-xl font-bold mt-1">{invoices.length}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('PAID'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'PAID'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-emerald-600">Paid</div>
          <div className="text-xl font-bold mt-1">{paidCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('UNPAID'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'UNPAID'
              ? 'bg-rose-700 text-white border-rose-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-rose-600">Unpaid / Due</div>
          <div className="text-xl font-bold mt-1">{unpaidCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('CANCELLED'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'CANCELLED'
              ? 'bg-slate-700 text-white border-slate-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-slate-600">Cancelled</div>
          <div className="text-xl font-bold mt-1">{cancelledCount}</div>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by invoice #, client, or gateway..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5f7f8] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Invoice Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Total Amount</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">#{inv.id}</td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/clients/${inv.userid}`}
                        className="text-[#1A4D80] hover:underline font-semibold"
                      >
                        {inv.clientName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                    <td className="py-2.5 px-3 text-slate-600">{inv.duedate}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      ৳{parseFloat(inv.total || '0').toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{inv.paymentmethod || 'PipraPay'}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Unpaid'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <a
                          href={`/viewinvoice?id=${inv.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-medium"
                        >
                          View / Print
                        </a>
                      </div>
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
