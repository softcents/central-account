'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { Globe, Search, RefreshCw, CheckCircle2, ShieldCheck, PlusCircle } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function ClientDomainsContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate');
  const [searchTerm, setSearchTerm] = useState('');

  let rawDomains = whmcsData?.domains || [];
  if (impersonate) {
    const matched = rawDomains.filter((d: any) => String(d.userid) === String(impersonate));
    if (matched.length > 0) {
      rawDomains = matched;
    }
  }

  const filtered = rawDomains.filter((d: any) =>
    (d.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Globe className="w-6 h-6 text-[#28a745]" />
            <span>My Domains ({rawDomains.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage DNS nameservers, whois contact protection, and automatic renewals.
          </p>
        </div>
        <div>
          <Link
            href="/cart"
            className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
          >
            + Register New Domain
          </Link>
        </div>
      </div>

      <div className="bg-white p-3 rounded border border-slate-200 flex items-center max-w-sm shadow-sm text-xs">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3 px-4">Domain</th>
              <th className="py-3 px-4">Registrar</th>
              <th className="py-3 px-4">Registration Period</th>
              <th className="py-3 px-4 text-center">Expiry Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4 font-bold text-[#1A4D80]">{d.domain}</td>
                <td className="py-3.5 px-4 text-slate-600">{d.registrar || 'Pipra / LogicBoxes'}</td>
                <td className="py-3.5 px-4 text-slate-700">{d.registrationperiod || 1} Year</td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-700">{d.expirydate || '-'}</td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                      d.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {d.status || 'Active'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => alert(`Managing DNS & Nameservers for ${d.domain}`)}
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
  );
}

export default function ClientDomainsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Domains...</div>}>
        <ClientDomainsContent />
      </Suspense>
    </div>
  );
}
