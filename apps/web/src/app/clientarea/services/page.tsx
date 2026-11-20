'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { Box, ExternalLink, ShieldCheck, Search, Filter, Server, CheckCircle2, Calendar } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function formatWhmcsDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000')) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function ClientServicesContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  let rawServices = (whmcsData?.services || []) as any[];
  if (impersonate) {
    const matched = rawServices.filter((s: any) => String(s.userid) === String(impersonate));
    if (matched.length > 0) {
      rawServices = matched;
    }
  }

  const filtered = rawServices
    .filter((s: any) => {
      const matchesSearch =
        (s.package || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.group_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.regdate || '').includes(searchTerm);
      const matchesStatus =
        statusFilter === 'ALL' || (s.domainstatus || '').toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      const dateA = a.regdate ? new Date(a.regdate).getTime() : 0;
      const dateB = b.regdate ? new Date(b.regdate).getTime() : 0;
      return dateB - dateA;
    });

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Box className="w-6 h-6 text-[#007bff]" />
            <span>My Products & Services ({rawServices.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View and manage active web hosting, cloud VPS, PBX, and provisioned services.
          </p>
        </div>
        <div>
          <Link
            href="/cart"
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors"
          >
            + Order New Services
          </Link>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product, domain, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All ({rawServices.length})</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Services Table in WHMCS Style */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3 px-4 w-10 text-center">SSL</th>
              <th className="py-3 px-4">Product / Service</th>
              <th className="py-3 px-4 text-center">Activation Date</th>
              <th className="py-3 px-4 text-right">Pricing</th>
              <th className="py-3 px-4 text-center">Next Due Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No services found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 50).map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline-block" title="Active" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {s.product_name || s.package || 'SoftCents Cloud PBX'}
                    </div>
                    {s.group_name && (
                      <div className="text-[10px] text-slate-500 font-medium">
                        {s.group_name}
                      </div>
                    )}
                    <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                      <span className="font-mono text-[#1A4D80]">{s.domain || s.username || `Service #${s.id}`}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-[#1A4D80] bg-slate-50/50">
                    {s.regdate_display || formatWhmcsDate(s.regdate)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-slate-900 font-mono">৳{parseFloat(s.amount || '0').toFixed(2)}</span>
                    <div className="text-[11px] text-slate-500">{s.billingcycle || 'Monthly'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">
                    {s.nextduedate_display || formatWhmcsDate(s.nextduedate)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                        s.domainstatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.domainstatus === 'Suspended'
                          ? 'bg-rose-100 text-rose-800'
                          : s.domainstatus === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.domainstatus || 'Active'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href="https://srv8.softcents.com:2083"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold transition-colors border border-slate-300"
                    >
                      Manage &rarr;
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function ClientServicesPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading services...</div>}>
        <ClientServicesContent />
      </Suspense>
    </div>
  );
}
