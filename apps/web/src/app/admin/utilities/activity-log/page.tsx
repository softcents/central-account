'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Activity, Calendar } from 'lucide-react';

export default function ActivityLogPage() {
  const [search, setSearch] = useState('');

  const logs = [
    {
      id: 1,
      date: '2026-11-20 02:40:15',
      description: 'Admin user raju logged into admin area from 138.252.125.207',
      username: 'raju',
      ip: '138.252.125.207',
    },
    {
      id: 2,
      date: '2026-11-19 19:02:18',
      description: 'Payment successful for Invoice #464 - Amount ৳1,500.00 via bKash',
      username: 'System',
      ip: '103.14.28.10',
    },
    {
      id: 3,
      date: '2026-11-19 18:40:02',
      description: 'Order #164 Placed - Client ID: c1 - Product: Standard Cloud VPS',
      username: 'Raju Ahmed',
      ip: '103.14.28.10',
    },
    {
      id: 4,
      date: '2026-11-19 12:15:40',
      description: 'Client Profile Modified - Client ID: c2',
      username: 'SoftCents Host',
      ip: '118.179.80.2',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Utilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">System Activity Log</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <Activity className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">System Activity Log</h1>
            <p className="text-xs text-slate-500">
              Audit trail of admin events, client logins, invoice changes, order submissions, and API hits
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Date / Time</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">User</th>
              <th className="py-2.5 px-3 text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                  {log.date}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800">{log.description}</td>
                <td className="py-2.5 px-3 font-semibold text-[#1A4D80]">{log.username}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
