'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function ServicesListPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Sample/initial data structure matching WHMCS tblhosting
  const dummyServices = [
    {
      id: '1',
      serviceId: 104,
      clientName: 'Raju Ahmed',
      clientId: 'c1',
      product: 'Standard Cloud VPS - 2 vCPU, 4GB RAM',
      domain: 'server1.softcents.com',
      pricing: '৳1,500.00 Monthly',
      nextDueDate: '2026-12-01',
      status: 'Active',
      server: 'KVM Node 01',
    },
    {
      id: '2',
      serviceId: 105,
      clientName: 'SoftCents Host',
      clientId: 'c2',
      product: 'cPanel NVMe Web Hosting - Starter',
      domain: 'mytestsite.com',
      pricing: '৳450.00 Monthly',
      nextDueDate: '2026-11-28',
      status: 'Active',
      server: 'cPanel Cloud 02',
    },
    {
      id: '3',
      serviceId: 106,
      clientName: 'Tanvir Hasan',
      clientId: 'c3',
      product: 'BDIX Dedicated Server E-2276G',
      domain: 'bdix-srv.net',
      pricing: '৳12,000.00 Monthly',
      nextDueDate: '2026-11-21',
      status: 'Suspended',
      server: 'DC-01 BDIX',
    },
    {
      id: '4',
      serviceId: 107,
      clientName: 'Abir Chowdhury',
      clientId: 'c4',
      product: 'Business Email Hosting (50 Mailboxes)',
      domain: 'corporatecorp.bd',
      pricing: '৳1,800.00 Annually',
      nextDueDate: '2026-11-25',
      status: 'Pending',
      server: 'Mail Server 01',
    },
  ];

  useEffect(() => {
    // In production, will fetch from /admin/services
    setServices(dummyServices);
  }, []);

  const filtered = services.filter((s) => {
    if (statusFilter !== 'ALL' && s.status.toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.domain?.toLowerCase().includes(q) ||
        s.clientName?.toLowerCase().includes(q) ||
        s.product?.toLowerCase().includes(q)
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
        <span className="font-bold text-slate-700">Products/Services</span>
      </div>

      {/* WHMCS Header & Filter Bar */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Products/Services List
            </h1>
            <p className="text-xs text-slate-500">
              Manage hosting accounts, VPS, dedicated servers, and licenses
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            href="/admin/orders/add"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Order</span>
          </Link>
        </div>
      </div>

      {/* WHMCS Search Filter Box */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Search Domain / Client</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Domain, Client Name, Product..."
              className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white focus:outline-none focus:border-[#1A4D80]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Server</label>
            <select className="w-full p-2 border border-slate-300 rounded bg-white">
              <option value="">Any Server</option>
              <option value="node1">KVM Node 01</option>
              <option value="cpanel02">cPanel Cloud 02</option>
              <option value="bdix">DC-01 BDIX</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* WHMCS Table (.datatable style) */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Product / Service</th>
              <th className="py-2.5 px-3">Domain</th>
              <th className="py-2.5 px-3">Client Name</th>
              <th className="py-2.5 px-3">Server</th>
              <th className="py-2.5 px-3">Pricing</th>
              <th className="py-2.5 px-3">Next Due Date</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s, idx) => (
              <tr
                key={s.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-semibold text-[#1A4D80]">
                  #{s.serviceId}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{s.product}</td>
                <td className="py-2.5 px-3">
                  <a
                    href={`https://${s.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1A4D80] hover:underline flex items-center space-x-1"
                  >
                    <span>{s.domain}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/clients/${s.clientId}`}
                    className="text-[#1A4D80] hover:underline font-medium"
                  >
                    {s.clientName}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{s.server}</td>
                <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{s.pricing}</td>
                <td className="py-2.5 px-3 text-slate-600">{s.nextDueDate}</td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.status === 'Suspended'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Link
                    href={`/admin/clients/${s.clientId}?tab=services`}
                    className="inline-block bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-semibold"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No products/services match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
