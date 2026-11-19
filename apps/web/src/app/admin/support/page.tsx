'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  Plus,
  ChevronRight,
  Send,
  MessageSquare,
  Clock,
  User,
  Tag,
  Paperclip,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function SupportTicketsPage() {
  const [tickets] = useState<any[]>(whmcsData?.tickets || []);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && (t.status || '').toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        String(t.tid || '').toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.clientName || '').toLowerCase().includes(q) ||
        (t.dept_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'In Progress' || t.status === 'Customer-Reply').length;
  const closedCount = tickets.filter((t) => t.status === 'Closed').length;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Support Tickets ({tickets.length})</span>
      </div>

      {/* WHMCS Quick Status Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#1A4D80] text-white border-[#1A4D80] shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold">All Tickets</div>
          <div className="text-xl font-bold mt-1">{tickets.length}</div>
        </button>
        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'OPEN'
              ? 'bg-rose-700 text-white border-rose-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-rose-600">Open Tickets</div>
          <div className="text-xl font-bold mt-1">{openCount}</div>
        </button>
        <button
          onClick={() => setStatusFilter('IN PROGRESS')}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'IN PROGRESS'
              ? 'bg-amber-600 text-white border-amber-600 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-amber-600">In Progress / Reply</div>
          <div className="text-xl font-bold mt-1">{inProgressCount}</div>
        </button>
        <button
          onClick={() => setStatusFilter('CLOSED')}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'CLOSED'
              ? 'bg-slate-700 text-white border-slate-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-slate-600">Closed Tickets</div>
          <div className="text-xl font-bold mt-1">{closedCount}</div>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket ID, subject, or client name..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5f7f8] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Ticket ID</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Created Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No tickets found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">
                      #{t.tid || t.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.dept_name || 'Technical Support'}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{t.title}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/clients/${t.userid}`}
                        className="text-[#1A4D80] hover:underline font-semibold"
                      >
                        {t.clientName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          t.status === 'Open'
                            ? 'bg-rose-100 text-rose-800'
                            : t.status === 'Closed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          t.urgency === 'High' ? 'text-rose-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {t.urgency || 'Medium'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.date}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-medium"
                      >
                        View Ticket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-[#1A4D80] font-bold">#{selectedTicket.tid || selectedTicket.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedTicket.title}</h3>
                <div className="text-slate-500 mt-0.5">
                  Client: <strong>{selectedTicket.clientName}</strong> • Dept: <strong>{selectedTicket.dept_name || 'Technical'}</strong>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded border text-slate-800 whitespace-pre-wrap leading-relaxed">
              {selectedTicket.message || 'No additional message body provided.'}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded font-semibold"
              >
                Close
              </button>
              <Link
                href={`/admin/clients/${selectedTicket.userid}?tab=tickets`}
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-2 rounded font-semibold"
              >
                Open in Client Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
