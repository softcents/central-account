'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  ChevronRight,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'daily';
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Reports</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/reports.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Financial & System Reports</h1>
            <p className="text-xs text-slate-500">
              Daily revenue, monthly income forecast, transaction volumes, and ticket response times
            </p>
          </div>
        </div>

        <button className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded font-medium text-xs shadow-sm">
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-300 text-xs font-semibold">
        <button
          onClick={() => setTab('daily')}
          className={`px-4 py-2 rounded-t border-t border-l border-r ${
            tab === 'daily'
              ? 'bg-white border-slate-300 border-b-white -mb-px text-[#1A4D80] font-bold'
              : 'bg-[#eef2f5] border-transparent text-slate-600'
          }`}
        >
          Daily Performance
        </button>
        <button
          onClick={() => setTab('monthly')}
          className={`px-4 py-2 rounded-t border-t border-l border-r ${
            tab === 'monthly'
              ? 'bg-white border-slate-300 border-b-white -mb-px text-[#1A4D80] font-bold'
              : 'bg-[#eef2f5] border-transparent text-slate-600'
          }`}
        >
          Monthly Transactions
        </button>
        <button
          onClick={() => setTab('annual')}
          className={`px-4 py-2 rounded-t border-t border-l border-r ${
            tab === 'annual'
              ? 'bg-white border-slate-300 border-b-white -mb-px text-[#1A4D80] font-bold'
              : 'bg-[#eef2f5] border-transparent text-slate-600'
          }`}
        >
          Annual Summary
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Income Today</div>
          <div className="text-lg font-bold text-emerald-700 font-mono">৳0.00</div>
          <div className="text-[11px] text-slate-400 mt-1">0 Payments collected</div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">This Month (Nov 2026)</div>
          <div className="text-lg font-bold text-[#1A4D80] font-mono">৳13,950.00</div>
          <div className="text-[11px] text-slate-400 mt-1">3 Paid invoices</div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Unpaid / Outstanding</div>
          <div className="text-lg font-bold text-rose-700 font-mono">৳577,247.50</div>
          <div className="text-[11px] text-slate-400 mt-1">142 Due invoices</div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Annual Gross Run-Rate</div>
          <div className="text-lg font-bold text-purple-700 font-mono">৳167,400.00</div>
          <div className="text-[11px] text-slate-400 mt-1">Projected MRR x 12</div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3 text-right">Invoices Generated</th>
              <th className="py-2.5 px-3 text-right">Amount Invoiced</th>
              <th className="py-2.5 px-3 text-right">Amount Received</th>
              <th className="py-2.5 px-3 text-right">Gateway Fees</th>
              <th className="py-2.5 px-3 text-right">Net Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-semibold text-slate-800">19/11/2026 (Yesterday)</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">1</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">৳1,500.00</td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">৳1,500.00</td>
              <td className="py-2.5 px-3 text-right font-mono text-rose-600">৳22.50</td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1A4D80]">৳1,477.50</td>
            </tr>
            <tr className="hover:bg-slate-50 bg-[#fbfcfd]">
              <td className="py-2.5 px-3 font-semibold text-slate-800">18/11/2026</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">2</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">৳450.00</td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">৳450.00</td>
              <td className="py-2.5 px-3 text-right font-mono text-rose-600">৳11.25</td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1A4D80]">৳438.75</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="py-2.5 px-3 font-semibold text-slate-800">15/11/2026</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">1</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-700">৳12,000.00</td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">৳12,000.00</td>
              <td className="py-2.5 px-3 text-right font-mono text-slate-500">৳0.00</td>
              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1A4D80]">৳12,000.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
