'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { Globe, Search, RefreshCw, CheckCircle2, ShieldCheck, PlusCircle } from 'lucide-react';

export default function ClientDomainsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const domains = [
    {
      id: 1,
      domain: 'softcents.com',
      regDate: '2024-05-12',
      nextDue: '2027-05-12',
      autoRenew: true,
      status: 'Active',
      nameservers: 'ns1.softcents.com, ns2.softcents.com',
    },
    {
      id: 2,
      domain: 'mytestsite.com',
      regDate: '2025-11-20',
      nextDue: '2026-11-20',
      autoRenew: true,
      status: 'Active',
      nameservers: 'ns1.softcents.com, ns2.softcents.com',
    },
  ];

  const filtered = domains.filter((d) =>
    d.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Globe className="w-6 h-6 text-[#28a745]" />
              <span>My Domains</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage DNS nameservers, whois contact protection, and automatic renewals.
            </p>
          </div>
          <div>
            <Link
              href="/cart?a=add&domain=register"
              className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
            >
              + Register New Domain
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between shadow-sm text-xs">
          <div className="flex items-center space-x-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
            />
          </div>
        </div>

        {/* Domains Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Domain Name</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Next Due Date</th>
                <th className="py-3 px-4 text-center">Auto-Renew</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                    {d.domain}
                    <div className="text-[11px] text-slate-500 font-normal font-mono">
                      NS: {d.nameservers}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{d.regDate}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{d.nextDue}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                      Enabled
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Managing DNS / Nameservers for ${d.domain}`)}
                      className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold transition-colors border border-slate-300"
                    >
                      Manage &rarr;
                    </button>
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
