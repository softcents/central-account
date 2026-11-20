'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { HelpCircle, Search, MessageSquare, PlusCircle } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function ClientTicketsContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate') || searchParams.get('userid');
  const [searchTerm, setSearchTerm] = useState('');

  let rawTickets = whmcsData?.tickets || [];
  if (impersonate) {
    const matched = rawTickets.filter((t: any) => String(t.userid) === String(impersonate));
    if (matched.length > 0) {
      rawTickets = matched;
    }
  }

  const filtered = rawTickets.filter(
    (t: any) =>
      (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.tid || t.id).includes(searchTerm)
  );

  return (
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#d9534f]" />
            <span>Support Tickets ({rawTickets.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track communication with our 24/7 technical and billing engineers.
          </p>
        </div>
        <div>
          <Link
            href="/support/new"
            className="w-full sm:w-auto text-center bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors inline-block"
          >
            + Open New Ticket
          </Link>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center max-w-sm shadow-sm text-xs">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search ticket..."
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
              No support tickets found.
            </div>
          ) : (
            filtered.map((t: any) => (
              <div key={t.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      #{t.tid || t.id} &bull; {t.dept_name || 'Technical Support'}
                    </div>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                      t.status === 'Open'
                        ? 'bg-rose-100 text-rose-800'
                        : t.status === 'Closed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50 text-slate-600">
                  <div className="text-[11px] text-slate-500 font-mono">
                    {t.date || '-'}
                  </div>
                  <Link
                    href={`/support/${t.id}${impersonate ? `?impersonate=${encodeURIComponent(impersonate)}` : ''}`}
                    className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold text-xs transition-colors border border-slate-300"
                  >
                    View &rarr;
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
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                filtered.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1A4D80]">
                      #{t.tid || t.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{t.dept_name || 'Technical Support'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{t.title}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          t.status === 'Open'
                            ? 'bg-rose-100 text-rose-800'
                            : t.status === 'Closed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                      {t.date}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/support/${t.id}${impersonate ? `?impersonate=${encodeURIComponent(impersonate)}` : ''}`}
                        className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold transition-colors border border-slate-300 inline-block"
                      >
                        View &rarr;
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

export default function ClientTicketsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Tickets...</div>}>
        <ClientTicketsContent />
      </Suspense>
    </div>
  );
}
