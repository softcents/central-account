'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  XCircle,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function CancellationRequestsPage() {
  const [filter, setFilter] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  const dummyRequests = [
    {
      id: 1,
      date: '2026-11-18 14:22',
      serviceId: 88,
      service: 'cPanel NVMe Web Hosting - Starter (mysite.com)',
      client: 'Imran Kabir',
      clientId: 'c5',
      reason: 'Migrated project to a self-hosted VPS server.',
      type: 'Immediate',
      status: 'Pending',
    },
    {
      id: 2,
      date: '2026-11-15 09:10',
      serviceId: 92,
      service: 'Standard Cloud VPS - 2 vCPU (app.dev)',
      client: 'Nahid Hossain',
      clientId: 'c6',
      reason: 'Project contract ended.',
      type: 'End of Billing Period',
      status: 'Pending',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/clients" className="text-[#1A4D80] hover:underline font-semibold">
          Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Cancellation Requests</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Cancellation Requests
            </h1>
            <p className="text-xs text-slate-500">
              Review and process service cancellation requests submitted by clients
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded font-semibold ${
              filter === 'PENDING'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Pending Requests (2)
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded font-semibold ${
              filter === 'COMPLETED'
                ? 'bg-[#1A4D80] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Completed Requests
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded font-semibold ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Service / Domain</th>
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">Cancellation Type</th>
              <th className="py-2.5 px-3">Reason</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dummyRequests.map((req, idx) => (
              <tr
                key={req.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{req.date}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{req.service}</td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/clients/${req.clientId}`}
                    className="text-[#1A4D80] hover:underline font-medium"
                  >
                    {req.client}
                  </Link>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      req.type === 'Immediate'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {req.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600 italic max-w-xs">{req.reason}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    {req.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    type="button"
                    className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-2 py-1 rounded text-[11px] font-semibold"
                  >
                    Complete & Terminate
                  </button>
                  <button
                    type="button"
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[11px] font-medium"
                  >
                    Dismiss
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
