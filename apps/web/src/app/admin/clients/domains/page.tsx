'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Search,
  Filter,
  Plus,
  ChevronRight,
  ExternalLink,
  Shield,
  RefreshCw,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function DomainsListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const domains = whmcsData?.domains || [];

  const filtered = domains.filter((d) => {
    if (statusFilter !== 'ALL' && (d.status || '').toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (d.domain || '').toLowerCase().includes(q) ||
        (d.clientName || '').toLowerCase().includes(q) ||
        (d.registrar || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/clients" className="text-[#1A4D80] hover:underline font-semibold">
          Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Domain Registrations ({domains.length})</span>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domain, registrar, or client..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5f7f8] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Domain</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Registrar</th>
                <th className="py-2.5 px-3">Reg Period</th>
                <th className="py-2.5 px-3">Recurring Price</th>
                <th className="py-2.5 px-3">Payment Gateway</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No domains found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#1A4D80] flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.domain}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/clients/${d.userid}`}
                        className="text-[#1A4D80] hover:underline font-semibold"
                      >
                        {d.clientName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{d.registrar || 'Pipra / LogicBoxes'}</td>
                    <td className="py-2.5 px-3">{d.registrationperiod || 1} Year</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      ৳{parseFloat(d.recurringamount || '0').toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{d.paymentmethod || 'PipraPay'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{d.expirydate || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          d.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {d.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/admin/clients/${d.userid}?tab=domains`}
                        className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-medium"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
