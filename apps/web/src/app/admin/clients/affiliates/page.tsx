'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';

export default function AffiliatesPage() {
  const [search, setSearch] = useState('');

  const affiliates = [
    {
      id: 1,
      clientName: 'Raju Ahmed',
      clientId: 'c1',
      date: '2024-01-10',
      visitors: 412,
      signups: 18,
      conversion: '4.37%',
      balance: '৳3,450.00',
      withdrawn: '৳12,000.00',
    },
    {
      id: 2,
      clientName: 'SoftCents Host',
      clientId: 'c2',
      date: '2024-05-12',
      visitors: 120,
      signups: 4,
      conversion: '3.33%',
      balance: '৳800.00',
      withdrawn: '৳1,500.00',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/clients" className="text-[#1A4D80] hover:underline font-semibold">
          Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Manage Affiliates</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Affiliates Management
            </h1>
            <p className="text-xs text-slate-500">
              Track referrals, calculate commissions, and process payout withdrawals
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enable New Affiliate</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-[#1A4D80] rounded">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Affiliates</div>
            <div className="text-lg font-bold text-slate-800">2</div>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Current Total Balance Due</div>
            <div className="text-lg font-bold text-emerald-700 font-mono">৳4,250.00</div>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Payouts Withdrawn</div>
            <div className="text-lg font-bold text-purple-700 font-mono">৳13,500.00</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Affiliate ID</th>
              <th className="py-2.5 px-3">Client Name</th>
              <th className="py-2.5 px-3">Date Activated</th>
              <th className="py-2.5 px-3">Visitors Referred</th>
              <th className="py-2.5 px-3">Signups</th>
              <th className="py-2.5 px-3">Conversion Rate</th>
              <th className="py-2.5 px-3">Commission Balance</th>
              <th className="py-2.5 px-3">Total Withdrawn</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {affiliates.map((aff, idx) => (
              <tr
                key={aff.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">#{aff.id}</td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/clients/${aff.clientId}`}
                    className="text-[#1A4D80] hover:underline font-semibold"
                  >
                    {aff.clientName}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{aff.date}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-700">{aff.visitors}</td>
                <td className="py-2.5 px-3 font-semibold text-emerald-700">{aff.signups}</td>
                <td className="py-2.5 px-3 font-medium text-slate-600">{aff.conversion}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{aff.balance}</td>
                <td className="py-2.5 px-3 font-mono text-slate-600">{aff.withdrawn}</td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    type="button"
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                  >
                    Manage / Payout
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
