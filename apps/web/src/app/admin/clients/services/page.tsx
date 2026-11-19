'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  User,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function ServicesListPage() {
  const [services] = useState<any[]>(whmcsData?.services || []);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serverFilter, setServerFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const servers = whmcsData?.servers || [];

  const filtered = services.filter((s) => {
    if (statusFilter !== 'ALL' && (s.domainstatus || '').toUpperCase() !== statusFilter) return false;
    if (serverFilter !== 'ALL' && s.server_name !== serverFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (s.domain || '').toLowerCase().includes(q) ||
        (s.clientName || '').toLowerCase().includes(q) ||
        (s.package || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeCount = services.filter((s) => s.domainstatus === 'Active').length;
  const suspendedCount = services.filter((s) => s.domainstatus === 'Suspended').length;
  const pendingCount = services.filter((s) => s.domainstatus === 'Pending').length;
  const terminatedCount = services.filter((s) => s.domainstatus === 'Terminated').length;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/clients" className="text-[#1A4D80] hover:underline font-semibold">
          Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Products / Services ({services.length})</span>
      </div>

      {/* WHMCS Quick Status Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#1A4D80] text-white border-[#1A4D80] shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold">All Services</div>
          <div className="text-xl font-bold mt-1">{services.length}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-emerald-600">Active</div>
          <div className="text-xl font-bold mt-1">{activeCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('SUSPENDED'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'SUSPENDED'
              ? 'bg-rose-700 text-white border-rose-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-rose-600">Suspended</div>
          <div className="text-xl font-bold mt-1">{suspendedCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-amber-600">Pending / Other</div>
          <div className="text-xl font-bold mt-1">{pendingCount + terminatedCount}</div>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by domain, package, client, or service ID..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
            />
          </div>

          <select
            value={serverFilter}
            onChange={(e) => { setServerFilter(e.target.value); setCurrentPage(1); }}
            className="p-1.5 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="ALL">All Server Nodes</option>
            {servers.map((srv) => (
              <option key={srv.id} value={srv.name}>{srv.name} ({srv.ipaddress})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/servers"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium border border-slate-300 transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Server Nodes ({servers.length})</span>
          </Link>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5f7f8] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Product / Service</th>
                <th className="py-2.5 px-3">Domain / IP / User</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Server</th>
                <th className="py-2.5 px-3">Billing Cycle</th>
                <th className="py-2.5 px-3">Pricing</th>
                <th className="py-2.5 px-3">Next Due Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No services found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">#{s.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{s.package || 'Custom Plan'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-700">{s.domain || s.username || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/clients/${s.userid}`}
                        className="text-[#1A4D80] hover:underline font-semibold"
                      >
                        {s.clientName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {s.server_name ? (
                        <span className="font-medium">{s.server_name}</span>
                      ) : (
                        <span className="text-slate-400">srv8 cPanel</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.billingcycle || 'Monthly'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">৳{parseFloat(s.amount || '0').toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.nextduedate || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.domainstatus === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.domainstatus === 'Suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.domainstatus || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/admin/clients/${s.userid}?tab=services`}
                          className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-medium"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-[#f9fafb]">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-200"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-[#1A4D80]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
