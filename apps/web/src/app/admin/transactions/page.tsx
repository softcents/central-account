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

export default function TransactionsListPage() {
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);

  const transactions = [
    {
      id: 1,
      transId: 'TXN-984124',
      date: '2026-11-19 19:02',
      gateway: 'bKash Auto Gateway',
      description: 'Invoice #464 Payment',
      amountIn: '৳1,500.00',
      fees: '৳22.50',
      amountOut: '৳0.00',
      invoiceId: '464',
    },
    {
      id: 2,
      transId: 'SSL-281903',
      date: '2026-11-18 12:45',
      gateway: 'SSLCommerz',
      description: 'Invoice #463 Payment',
      amountIn: '৳450.00',
      fees: '৳11.25',
      amountOut: '৳0.00',
      invoiceId: '463',
    },
    {
      id: 3,
      transId: 'BANK-004128',
      date: '2026-11-15 14:10',
      gateway: 'Bank Transfer (EBL)',
      description: 'Invoice #458 Payment',
      amountIn: '৳12,000.00',
      fees: '৳0.00',
      amountOut: '৳0.00',
      invoiceId: '458',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Transactions List</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/income.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Transactions List</h1>
            <p className="text-xs text-slate-500">
              View all payment gateway inflows, merchant processing fees, refunds, and withdrawals
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Amount In (Gross)</div>
            <div className="text-lg font-bold text-emerald-700 font-mono">৳13,950.00</div>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Payment Gateway Fees</div>
            <div className="text-lg font-bold text-rose-700 font-mono">৳33.75</div>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-[#1A4D80] rounded">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Net Settled Balance</div>
            <div className="text-lg font-bold text-[#1A4D80] font-mono">৳13,916.25</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Gateway</th>
              <th className="py-2.5 px-3">Transaction ID</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">Invoice #</th>
              <th className="py-2.5 px-3 text-right">Amount In</th>
              <th className="py-2.5 px-3 text-right">Fees</th>
              <th className="py-2.5 px-3 text-right">Amount Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t, idx) => (
              <tr
                key={t.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{t.date}</td>
                <td className="py-2.5 px-3 font-medium text-slate-800">{t.gateway}</td>
                <td className="py-2.5 px-3 font-mono font-semibold text-[#1A4D80]">{t.transId}</td>
                <td className="py-2.5 px-3 text-slate-700">{t.description}</td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/invoices/${t.invoiceId}`}
                    className="text-[#1A4D80] hover:underline font-bold"
                  >
                    #{t.invoiceId}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                  {t.amountIn}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-600">{t.fees}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-500">{t.amountOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
