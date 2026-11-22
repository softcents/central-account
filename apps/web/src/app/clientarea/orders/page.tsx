'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { useActiveClient } from '@/hooks/useActiveClient';
import whmcsData from '@/data/whmcs_sync.json';
import {
  ShoppingBag,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  CreditCard,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';

function formatWhmcsDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000')) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function ClientOrdersContent() {
  const searchParams = useSearchParams();
  const { clientId, client, impQuery, orders, invoices, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawOrders = (orders || []) as any[];

  // Helper to find related invoice info
  const getInvoiceInfo = (invoiceId: string | number) => {
    return (invoices || []).find((inv: any) => String(inv.id) === String(invoiceId));
  };

  const filtered = rawOrders
    .filter((o: any) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        String(o.ordernum || '').toLowerCase().includes(q) ||
        String(o.id || '').toLowerCase().includes(q) ||
        (o.date || '').includes(q) ||
        (o.paymentmethod || '').toLowerCase().includes(q) ||
        String(o.amount || '').includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || (o.status || '').toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

  const activeCount = rawOrders.filter((o) => (o.status || '').toLowerCase() === 'active').length;
  const pendingCount = rawOrders.filter((o) => (o.status || '').toLowerCase() === 'pending').length;
  const cancelledCount = rawOrders.filter((o) => (o.status || '').toLowerCase() === 'cancelled').length;

  return (
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href={`/clientarea${impQuery}`} className="hover:text-[#1A4D80]">
              Portal Home
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-700">My Orders</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
            <span>My Orders ({rawOrders.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View order details, status, and associated billing invoices for {client?.name || 'Customer'}.
          </p>
        </div>
        <div>
          <Link
            href={`/cart${impQuery}`}
            className="w-full sm:w-auto text-center bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors inline-flex items-center justify-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Order New Services</span>
          </Link>
        </div>
      </div>

      {/* WHMCS Quick Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#1A4D80] text-white border-[#1A4D80] shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold">All Orders</div>
          <div className="text-xl font-bold mt-1 font-mono">{rawOrders.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-emerald-600">Active / Completed</div>
          <div className="text-xl font-bold mt-1 font-mono">{activeCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-amber-600">Pending Orders</div>
          <div className="text-xl font-bold mt-1 font-mono">{pendingCount}</div>
        </button>

        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`p-3 rounded-lg border text-left transition-all ${
            statusFilter === 'CANCELLED'
              ? 'bg-rose-700 text-white border-rose-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-rose-600">Cancelled</div>
          <div className="text-xl font-bold mt-1 font-mono">{cancelledCount}</div>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by order number, date, amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-slate-200 rounded bg-white text-xs font-semibold focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="ALL">All Orders ({rawOrders.length})</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-bold text-slate-700">No Orders Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No orders matched your filter criteria. Try clearing filters.'
                : 'You have not placed any orders yet. Browse our store to order web hosting, Cloud PBX, or VIP numbers.'}
            </p>
            <div className="mt-4">
              <Link
                href={`/cart${impQuery}`}
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-2 rounded text-xs font-bold inline-block"
              >
                Browse Store & Order Now &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order: any) => {
                  const status = (order.status || 'Pending').toLowerCase();
                  const relatedInv = order.invoiceid ? getInvoiceInfo(order.invoiceid) : null;
                  const amount = Number(order.amount || relatedInv?.total || 0);

                  let statusBadge = (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </span>
                  );
                  if (status === 'active' || status === 'completed') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    );
                  } else if (status === 'cancelled') {
                    statusBadge = (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3 h-3" />
                        <span>Cancelled</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1A4D80]">
                        #{order.ordernum || order.id}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatWhmcsDate(order.date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 capitalize">
                        {order.paymentmethod
                          ? order.paymentmethod.replace(/_/g, ' ')
                          : 'Online Payment (PipraPay)'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ৳{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
                      </td>
                      <td className="py-3 px-4 text-center">{statusBadge}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {order.invoiceid && (
                          <Link
                            href={`/viewinvoice?id=${order.invoiceid}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 rounded text-xs font-semibold transition-colors border border-slate-300"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Invoice #{order.invoiceid}</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ClientOrdersPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-24">
      <ClientHeader />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500">
            Loading Orders...
          </div>
        }
      >
        <ClientOrdersContent />
      </Suspense>
    </div>
  );
}
