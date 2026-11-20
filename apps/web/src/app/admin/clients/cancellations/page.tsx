'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  XCircle,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function CancellationRequestsPage() {
  const [filter, setFilter] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Load real cancellation requests from sync
  const initialRequests = useMemo(() => {
    return (whmcsData?.cancellationRequests || []).map((c: any) => ({
      id: c.id,
      date: c.date,
      serviceId: c.relid,
      service: `${c.product_name || 'Service'} ${c.domain ? `(${c.domain})` : `#${c.relid}`}`,
      client: c.client_name || `Client #${c.userid}`,
      clientId: c.userid,
      reason: c.reason || 'No reason provided',
      type: c.type || 'Immediate',
      status: 'Pending',
    }));
  }, []);

  const [requestsList, setRequestsList] = useState<any[]>(initialRequests);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requestsList.filter((req) => {
      const matchSearch =
        (req.service || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter =
        filter === 'ALL'
          ? true
          : filter === 'PENDING'
          ? req.status === 'Pending'
          : req.status === 'Completed';
      return matchSearch && matchFilter;
    });
  }, [requestsList, filter, searchTerm]);

  const handleComplete = (id: string | number) => {
    setRequestsList((prev) =>
      prev.map((r) => (String(r.id) === String(id) ? { ...r, status: 'Completed' } : r))
    );
    setActionNotice(`Cancellation request #${id} marked as Completed & Terminated.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDismiss = (id: string | number) => {
    setRequestsList((prev) => prev.filter((r) => String(r.id) !== String(id)));
    setActionNotice(`Cancellation request #${id} dismissed.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const pendingCount = requestsList.filter((r) => r.status === 'Pending').length;
  const completedCount = requestsList.filter((r) => r.status === 'Completed').length;

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
              Cancellation Requests ({requestsList.length})
            </h1>
            <p className="text-xs text-slate-500">
              Review and process service cancellation requests submitted by clients via WHMCS
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
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded font-semibold ${
              filter === 'COMPLETED'
                ? 'bg-[#1A4D80] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded font-semibold ${
              filter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All ({requestsList.length})
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="bg-white p-3 rounded border border-slate-200 flex items-center max-w-sm text-xs">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search by client, service, or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full focus:outline-none"
        />
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No cancellation requests found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map((req, idx) => (
                <tr
                  key={req.id}
                  className={`hover:bg-[#f0f4f8] transition-colors ${
                    idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                  }`}
                >
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono">
                    {req.date}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    <Link
                      href={`/clientarea/services/${req.serviceId}`}
                      className="text-[#1A4D80] hover:underline"
                    >
                      {req.service}
                    </Link>
                  </td>
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
                  <td className="py-2.5 px-3 text-slate-600 italic max-w-xs">
                    {req.reason}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                    {req.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleComplete(req.id)}
                        className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-2 py-1 rounded text-[11px] font-semibold"
                      >
                        Complete &amp; Terminate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(req.id)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[11px] font-medium"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
