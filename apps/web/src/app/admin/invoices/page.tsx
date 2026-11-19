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
} from 'lucide-react';

export default function InvoicesListPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const [statusFilter, setStatusFilter] = useState(initialStatus.toUpperCase());
  const [search, setSearch] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const invoices = [
    {
      id: '464',
      invoiceNum: '464',
      date: '2026-11-19',
      dueDate: '2026-11-26',
      client: 'Raju Ahmed',
      clientId: 'c1',
      gateway: 'bKash / Nagad Auto Gateway',
      total: '৳1,500.00 BDT',
      status: 'Unpaid',
    },
    {
      id: '463',
      invoiceNum: '463',
      date: '2026-11-18',
      dueDate: '2026-11-25',
      client: 'SoftCents Host',
      clientId: 'c2',
      gateway: 'SSLCommerz',
      total: '৳450.00 BDT',
      status: 'Paid',
    },
    {
      id: '462',
      invoiceNum: '462',
      date: '2026-11-10',
      dueDate: '2026-11-17',
      client: 'Tanvir Hasan',
      clientId: 'c3',
      gateway: 'Bank Transfer (EBL/City)',
      total: '৳12,000.00 BDT',
      status: 'Overdue',
    },
    {
      id: '461',
      invoiceNum: '461',
      date: '2026-11-05',
      dueDate: '2026-11-12',
      client: 'Abir Chowdhury',
      clientId: 'c4',
      gateway: 'bKash / Nagad Auto Gateway',
      total: '৳1,800.00 BDT',
      status: 'Paid',
    },
    {
      id: '460',
      invoiceNum: '460',
      date: '2026-10-28',
      dueDate: '2026-11-04',
      client: 'Imran Kabir',
      clientId: 'c5',
      gateway: 'SSLCommerz',
      total: '৳2,400.00 BDT',
      status: 'Cancelled',
    },
  ];

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status.toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNum.includes(q) ||
        inv.client.toLowerCase().includes(q) ||
        inv.total.includes(q)
      );
    }
    return true;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filtered.map((inv) => inv.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((item) => item !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Invoices</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/invoices.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Invoices</h1>
            <p className="text-xs text-slate-500">
              Manage client billing, due dates, reminder notices, and mark payments
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            href="/admin/invoices/new"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/invoicesedit.png" className="w-3.5 h-3.5" alt="" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* WHMCS Invoices Status Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        {[
          { id: 'ALL', label: 'All Invoices', count: 464, color: 'bg-slate-700 text-white' },
          { id: 'PAID', label: 'Paid', count: 310, color: 'bg-emerald-600 text-white' },
          { id: 'UNPAID', label: 'Unpaid', count: 142, color: 'bg-amber-600 text-white' },
          { id: 'OVERDUE', label: 'Overdue', count: 112, color: 'bg-rose-700 text-white' },
          { id: 'CANCELLED', label: 'Cancelled', count: 10, color: 'bg-slate-500 text-white' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
              statusFilter === tab.id
                ? `${tab.color} shadow-sm font-bold`
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === tab.id ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Batch Actions */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Invoice #, Client Name, Amount..."
            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        {selectedInvoices.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded border border-slate-200">
            <span className="text-slate-600 font-semibold">{selectedInvoices.length} selected:</span>
            <button className="bg-[#5cb85c] text-white px-2.5 py-1 rounded font-bold hover:bg-[#4cae4c]">
              Mark Paid
            </button>
            <button className="bg-[#1A4D80] text-white px-2.5 py-1 rounded font-bold hover:bg-[#143d66]">
              Send Reminder
            </button>
            <button className="bg-rose-600 text-white px-2.5 py-1 rounded font-bold hover:bg-rose-700">
              Cancel Invoices
            </button>
          </div>
        )}
      </div>

      {/* WHMCS Invoices Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selectedInvoices.length === filtered.length
                  }
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th className="py-2.5 px-3">Invoice #</th>
              <th className="py-2.5 px-3">Invoice Date</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3">Client Name</th>
              <th className="py-2.5 px-3">Payment Method</th>
              <th className="py-2.5 px-3">Total</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((inv, idx) => (
              <tr
                key={inv.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(inv.id)}
                    onChange={() => toggleSelect(inv.id)}
                  />
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">
                  <Link href={`/admin/invoices/${inv.id}`} className="hover:underline">
                    #{inv.invoiceNum}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                <td className="py-2.5 px-3 text-slate-600">{inv.dueDate}</td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/clients/${inv.clientId}`}
                    className="text-[#1A4D80] hover:underline font-semibold"
                  >
                    {inv.client}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{inv.gateway}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.total}</td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.status === 'Unpaid'
                        ? 'bg-amber-100 text-amber-800'
                        : inv.status === 'Overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="inline-block bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-semibold"
                  >
                    Manage
                  </Link>
                  {inv.status !== 'Paid' && (
                    <button
                      type="button"
                      className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-2 py-1 rounded text-[11px] font-semibold"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
