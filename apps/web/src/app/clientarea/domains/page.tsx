'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { Globe, Search, RefreshCw, CheckCircle2, ShieldCheck, PlusCircle } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function ClientDomainsContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate') || searchParams.get('userid');
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
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#28a745]" />
            <span>My Domains ({rawDomains.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage DNS nameservers, whois contact protection, and automatic renewals.
          </p>
        </div>
        <div>
          <Link
            href="/cart?a=add&domain=register"
            className="w-full sm:w-auto text-center bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors inline-block"
          >
            + Register New Domain
          </Link>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center max-w-sm shadow-sm text-xs">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full focus:outline-none"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {/* Mobile View: Cards (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs px-4">
              No domains found.
            </div>
          ) : (
            filtered.map((d: any) => (
              <div key={d.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-[#1A4D80]">
                      {d.domain}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Registrar: {d.registrar || 'Softcents Registrar'}
                    </div>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                      d.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {d.status || 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50 text-slate-600">
                  <div className="text-[11px]">
                    Expires: <span className="font-mono font-medium text-slate-800">{d.expirydate || '-'}</span>
                  </div>
                  <Link
                    href={`/clientarea/domains/${d.id}${impersonate ? `?impersonate=${encodeURIComponent(impersonate)}` : ''}`}
                    className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold text-xs transition-colors border border-slate-300"
                  >
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table (>= sm) */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[550px]">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No domains found.
                  </td>
                </tr>
              ) : (
                filtered.map((d: any) => (
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
                      <Link
                        href={`/clientarea/domains/${d.id}${impersonate ? `?impersonate=${encodeURIComponent(impersonate)}` : ''}`}
                        className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold transition-colors border border-slate-300 inline-block"
                      >
                        Manage &rarr;
                      </Link>
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
