'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Trash2,
  DollarSign,
  CreditCard,
} from 'lucide-react';

export default function OrdersListPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const [statusFilter, setStatusFilter] = useState(initialStatus.toUpperCase());
  const [search, setSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const orders = [
    {
      id: '164',
      orderNum: 'ORD-100164',
      date: '2026-11-19 18:40',
      client: 'Raju Ahmed',
      clientId: 'c1',
      items: 'Standard Cloud VPS - 2 vCPU, 4GB RAM (server1.softcents.com)',
      gateway: 'bKash / Nagad Auto Gateway',
      amount: '৳1,500.00 BDT',
      status: 'Pending',
    },
    {
      id: '163',
      orderNum: 'ORD-100163',
      date: '2026-11-19 12:15',
      client: 'SoftCents Host',
      clientId: 'c2',
      items: 'cPanel NVMe Web Hosting - Starter (mytestsite.com)',
      gateway: 'SSLCommerz',
      amount: '৳450.00 BDT',
      status: 'Pending',
    },
    {
      id: '162',
      orderNum: 'ORD-100162',
      date: '2026-11-18 20:05',
      client: 'Tanvir Hasan',
      clientId: 'c3',
      items: 'BDIX Dedicated Server E-2276G (bdix-srv.net)',
      gateway: 'Bank Transfer (EBL/City)',
      amount: '৳12,000.00 BDT',
      status: 'Pending',
    },
    {
      id: '161',
      orderNum: 'ORD-100161',
      date: '2026-11-18 10:30',
      client: 'Abir Chowdhury',
      clientId: 'c4',
      items: 'Domain Registration: corporatecorp.bd',
      gateway: 'bKash / Nagad Auto Gateway',
      amount: '৳1,800.00 BDT',
      status: 'Pending',
    },
    {
      id: '160',
      orderNum: 'ORD-100160',
      date: '2026-11-17 15:20',
      client: 'Imran Kabir',
      clientId: 'c5',
      items: 'Business Email Hosting (50 Mailboxes)',
      gateway: 'SSLCommerz',
      amount: '৳2,400.00 BDT',
      status: 'Active',
    },
  ];

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status.toUpperCase() !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.orderNum.toLowerCase().includes(q) ||
        o.client.toLowerCase().includes(q) ||
        o.items.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(filtered.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((item) => item !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Manage Orders</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/orders.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Manage Orders</h1>
            <p className="text-xs text-slate-500">
              Review, accept, provision, cancel, or flag orders as fraud
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            href="/admin/orders/add"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/ordersadd.png" className="w-3.5 h-3.5" alt="" />
            <span>Add New Order</span>
          </Link>
        </div>
      </div>

      {/* WHMCS Orders Status Tab Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        {[
          { id: 'ALL', label: 'All Orders', count: 164, color: 'bg-slate-700 text-white' },
          { id: 'PENDING', label: 'Pending Orders', count: 4, color: 'bg-amber-600 text-white' },
          { id: 'ACTIVE', label: 'Active', count: 155, color: 'bg-emerald-600 text-white' },
          { id: 'FRAUD', label: 'Fraud', count: 2, color: 'bg-rose-700 text-white' },
          { id: 'CANCELLED', label: 'Cancelled', count: 3, color: 'bg-slate-500 text-white' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
              statusFilter === tab.id
                ? `${tab.color} shadow-sm font-bold`
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === tab.id ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order #, Client, Package..."
            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        {selectedOrders.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded border border-slate-200">
            <span className="text-slate-600 font-semibold">{selectedOrders.length} selected:</span>
            <button className="bg-[#5cb85c] text-white px-2.5 py-1 rounded font-bold hover:bg-[#4cae4c]">
              Accept Selected
            </button>
            <button className="bg-rose-600 text-white px-2.5 py-1 rounded font-bold hover:bg-rose-700">
              Cancel Selected
            </button>
            <button className="bg-slate-600 text-white px-2.5 py-1 rounded font-bold hover:bg-slate-700">
              Set Fraud
            </button>
          </div>
        )}
      </div>

      {/* WHMCS Orders Table (.datatable) */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selectedOrders.length === filtered.length
                  }
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th className="py-2.5 px-3">Order #</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">Product / Service</th>
              <th className="py-2.5 px-3">Payment Method</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((o, idx) => (
              <tr
                key={o.id}
                className={`hover:bg-[#f0f4f8] transition-colors ${
                  idx % 2 === 1 ? 'bg-[#fbfcfd]' : 'bg-white'
                }`}
              >
                <td className="py-2.5 px-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(o.id)}
                    onChange={() => toggleSelect(o.id)}
                  />
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">
                  #{o.id}
                </td>
                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{o.date}</td>
                <td className="py-2.5 px-3">
                  <Link
                    href={`/admin/clients/${o.clientId}`}
                    className="text-[#1A4D80] hover:underline font-semibold"
                  >
                    {o.client}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-800 font-medium">{o.items}</td>
                <td className="py-2.5 px-3 text-slate-600">{o.gateway}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.amount}</td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      o.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : o.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                  {o.status === 'Pending' && (
                    <button
                      type="button"
                      className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-2 py-1 rounded text-[11px] font-semibold"
                    >
                      Accept
                    </button>
                  )}
                  <button
                    type="button"
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2 py-1 rounded text-[11px] font-semibold"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 px-2 py-1 rounded text-[11px]"
                  >
                    Cancel
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
