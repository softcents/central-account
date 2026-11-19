'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { HelpCircle, Search, MessageSquare, PlusCircle } from 'lucide-react';

export default function ClientTicketsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const tickets = [
    {
      id: '814920',
      department: 'Technical Support',
      subject: 'Assistance required for PTR / rDNS setup on Cloud VPS',
      status: 'Customer-Reply',
      lastUpdated: '2026-11-20 02:40',
    },
    {
      id: '812034',
      department: 'Billing & Accounts',
      subject: 'PipraPay bKash Transaction Reference Verification',
      status: 'Answered',
      lastUpdated: '2026-11-18 14:15',
    },
  ];

  const filtered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <HelpCircle className="w-6 h-6 text-[#d9534f]" />
              <span>Support Tickets</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track communication with our 24/7 technical and billing engineers.
            </p>
          </div>
          <div>
            <Link
              href="/support/new"
              className="bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
            >
              + Open New Ticket
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between shadow-sm text-xs">
          <div className="flex items-center space-x-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket ID or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
            />
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{t.department}</td>
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/support/${t.id}`}
                      className="font-bold text-[#1A4D80] hover:underline text-sm block"
                    >
                      #{t.id} - {t.subject}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                    {t.lastUpdated}
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
