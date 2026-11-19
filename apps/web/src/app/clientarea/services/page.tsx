'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { Box, ExternalLink, ShieldCheck, Search, Filter, Server, CheckCircle2 } from 'lucide-react';

export default function ClientServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const services = [
    {
      id: 1,
      product: 'Standard Cloud VPS - 2 vCPU, 4GB RAM',
      domain: 'server1.softcents.com',
      ip: '103.145.118.42',
      pricing: '৳1,500.00 BDT',
      billingCycle: 'Monthly',
      nextDue: '2026-12-01',
      status: 'Active',
      ssl: true,
    },
    {
      id: 2,
      product: 'cPanel NVMe Web Hosting - Advance 5GB',
      domain: 'mytestsite.com',
      ip: '103.145.118.50',
      pricing: '৳450.00 BDT',
      billingCycle: 'Monthly',
      nextDue: '2026-11-28',
      status: 'Active',
      ssl: true,
    },
    {
      id: 3,
      product: 'Cloud PBX - Standard 6 Extensions',
      domain: 'pbx.softcents.com',
      ip: '103.145.118.66',
      pricing: '৳1,200.00 BDT',
      billingCycle: 'Monthly',
      nextDue: '2026-12-10',
      status: 'Active',
      ssl: true,
    },
  ];

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <Box className="w-6 h-6 text-[#007bff]" />
              <span>My Products & Services</span>
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
              placeholder="Search by product name or domain..."
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
              <option value="ALL">All ({services.length})</option>
              <option value="ACTIVE">Active (3)</option>
              <option value="SUSPENDED">Suspended (0)</option>
              <option value="TERMINATED">Terminated (0)</option>
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
                <th className="py-3 px-4">Server IP</th>
                <th className="py-3 px-4 text-right">Pricing</th>
                <th className="py-3 px-4 text-center">Next Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline-block" title="SSL Active" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{s.product}</div>
                    <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                      <a
                        href={`http://${s.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1A4D80] hover:underline flex items-center"
                      >
                        <span>{s.domain}</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{s.ip}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-slate-900 font-mono">{s.pricing}</span>
                    <div className="text-[11px] text-slate-500">{s.billingCycle}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-700">{s.nextDue}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Opening control panel / credentials for ${s.product}`)}
                      className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded font-semibold transition-colors border border-slate-300"
                    >
                      Manage &rarr;
                    </button>
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
