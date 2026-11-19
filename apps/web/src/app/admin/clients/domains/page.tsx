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

export default function DomainsListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const dummyDomains = [
    {
      id: 1,
      domain: 'softcents.com',
      clientName: 'Raju Ahmed',
      clientId: 'c1',
      registrar: 'Enom / ResellerClub',
      regDate: '2023-11-15',
      nextDue: '2026-11-15',
      expiry: '2027-11-15',
      firstPayment: '৳1,250.00',
      recurring: '৳1,450.00',
      autoRenew: true,
      status: 'Active',
    },
    {
      id: 2,
      domain: 'bdhost.net',
      clientName: 'SoftCents Host',
      clientId: 'c2',
      registrar: 'Namecheap',
      regDate: '2024-02-10',
      nextDue: '2027-02-10',
      expiry: '2027-02-10',
      firstPayment: '৳1,100.00',
      recurring: '৳1,300.00',
      autoRenew: true,
      status: 'Active',
    },
    {
      id: 3,
      domain: 'techsolution.org',
      clientName: 'Tanvir Hasan',
      clientId: 'c3',
      registrar: 'LogicBoxes',
      regDate: '2025-05-01',
      nextDue: '2026-05-01',
      expiry: '2026-05-01',
      firstPayment: '৳1,500.00',
      recurring: '৳1,500.00',
      autoRenew: false,
      status: 'Grace',
    },
  ];

  const filtered = dummyDomains.filter((d) => {
    if (statusFilter !== 'ALL' && d.status.toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.domain.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q);
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
        <span className="font-bold text-slate-700">Domain Registrations</span>
      </div>

      {/* WHMCS Title & Actions */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Domain Registrations
            </h1>
            <p className="text-xs text-slate-500">
              Manage TLDs, whois contact data, DNS records, and registrar locks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            href="/admin/utilities/whois"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium border border-slate-300 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>WHOIS Lookup</span>
          </Link>
          <Link
            href="/admin/orders/add"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Domain</span>
          </Link>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Domain or Client</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. yourdomain.com, Client Name"
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
              <option value="PENDING">Pending Transfer/Registration</option>
              <option value="EXPIRED">Expired</option>
              <option value="CANCELLED">Cancelled</option>
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

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Domain</th>
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">Registrar</th>
              <th className="py-2.5 px-3">Registration Date</th>
              <th className="py-2.5 px-3">Next Due Date</th>
              <th className="py-2.5 px-3">Expiry Date</th>
              <th className="py-2.5 px-3">Recurring</th>
              <th className="py-2.5 px-3 text-center">Auto Renew</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d, idx) => (
              <tr
                key={d.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3 font-semibold text-[#1A4D80]">
                  <a
                    href={`https://${d.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1"
                  >
                    <span>{d.domain}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/clients/${d.clientId}`}
                    className="text-[#1A4D80] hover:underline"
                  >
                    {d.clientName}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{d.registrar}</td>
                <td className="py-2.5 px-3 text-slate-600">{d.regDate}</td>
                <td className="py-2.5 px-3 text-slate-600">{d.nextDue}</td>
                <td className="py-2.5 px-3 text-slate-600">{d.expiry}</td>
                <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{d.recurring}</td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      d.autoRenew
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {d.autoRenew ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      d.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Link
                    href={`/admin/clients/${d.clientId}?tab=domains`}
                    className="inline-block bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-semibold"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
