'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { useActiveClient } from '@/hooks/useActiveClient';

function ClientInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientId, client, impQuery, invoices, unpaidInvoices, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawInvoices = invoices || [];

  const paidCount = rawInvoices.filter((inv: any) => (inv.status || '').toLowerCase() === 'paid').length;
  const unpaidCount = rawInvoices.filter((inv: any) => (inv.status || '').toLowerCase() === 'unpaid').length;
  const cancelledCount = rawInvoices.filter((inv: any) => (inv.status || '').toLowerCase() === 'cancelled').length;
  const refundedCount = rawInvoices.filter((inv: any) => (inv.status || '').toLowerCase() === 'refunded').length;

  const filtered = rawInvoices.filter((inv: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      String(inv.id || '').includes(searchTerm) ||
      String(inv.invoicenum || '').includes(searchTerm) ||
      (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (inv.status || '').toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-800">
      <ClientHeader />

      {/* WHMCS Master Breadcrumb */}
      <nav className="master-breadcrumb" aria-label="breadcrumb">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href={`/clientarea${impQuery}`}>Portal Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href={`/clientarea${impQuery}`}>Client Area</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              My Invoices
            </li>
          </ol>
        </div>
      </nav>

      {/* WHMCS Main Body Section */}
      <section id="main-body">
        <div className="container">
          <div className="row">
            {/* Left Sidebar (col-lg-4 col-xl-3) */}
            <div className="col-lg-4 col-xl-3">
              <div className="sidebar">
                {/* Status Filter Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-filter mr-1 text-muted"></i> Invoices
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'ALL' ? 'active' : ''}`}
                    >
                      <span>All Invoices</span>
                      <span className="badge float-right">{rawInvoices.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('PAID')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'PAID' ? 'active' : ''}`}
                    >
                      <span>Paid</span>
                      <span className="badge float-right">{paidCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('UNPAID')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'UNPAID' ? 'active' : ''}`}
                    >
                      <span>Unpaid</span>
                      <span className="badge float-right">{unpaidCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('CANCELLED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
                    >
                      <span>Cancelled</span>
                      <span className="badge float-right">{cancelledCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('REFUNDED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'REFUNDED' ? 'active' : ''}`}
                    >
                      <span>Refunded</span>
                      <span className="badge float-right">{refundedCount}</span>
                    </button>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-plus mr-1 text-muted"></i> Actions
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href={`/clientarea/masspay${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-credit-card fa-fw mr-2 text-muted"></i> Mass Payment</span>
                    </Link>
                    <Link href={`/clientarea/addfunds${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-wallet fa-fw mr-2 text-muted"></i> Add Funds</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>My Invoices</h1>
              </div>

              {/* Search filter row */}
              <div className="mb-3 d-flex justify-content-between align-items-center" style={{ gap: '10px' }}>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  Showing {filtered.length} of {rawInvoices.length} entries
                </div>
                <div style={{ maxWidth: '280px', width: '100%' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by invoice number..."
                    className="form-control"
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      width: '100%',
                    }}
                  />
                </div>
              </div>

              {/* WHMCS table.table-list */}
              <div className="table-container clearfix">
                <table className="table table-list">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th className="text-right">Total</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted p-4">
                          No Invoices Found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((inv: any) => {
                        const statusLower = (inv.status || 'unpaid').toLowerCase();

                        return (
                          <tr
                            key={inv.id}
                            onClick={() => router.push(`/viewinvoice?id=${inv.id}`)}
                            className="cursor-pointer"
                          >
                            <td>
                              <strong>#{inv.invoicenum || inv.id}</strong>
                            </td>
                            <td>{inv.date || '-'}</td>
                            <td>{inv.duedate || '-'}</td>
                            <td className="text-right font-weight-bold">
                              ৳{parseFloat(inv.total || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                            </td>
                            <td className="text-center">
                              <span className={`label status status-${statusLower}`}>
                                {inv.status || 'Unpaid'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhmcsFooter />
    </div>
  );
}

export default function ClientInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-slate-500">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Invoices...
        </div>
      }
    >
      <ClientInvoicesContent />
    </Suspense>
  );
}
