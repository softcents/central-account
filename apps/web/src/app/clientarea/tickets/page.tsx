'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { useActiveClient } from '@/hooks/useActiveClient';

function ClientTicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientId, client, impQuery, tickets, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawTickets = tickets || [];

  const openCount = rawTickets.filter((t: any) => (t.status || '').toLowerCase() === 'open').length;
  const answeredCount = rawTickets.filter((t: any) => (t.status || '').toLowerCase() === 'answered').length;
  const customerReplyCount = rawTickets.filter((t: any) => (t.status || '').toLowerCase().includes('customer')).length;
  const closedCount = rawTickets.filter((t: any) => (t.status || '').toLowerCase() === 'closed').length;

  const filtered = rawTickets.filter((t: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      String(t.tid || t.id || '').includes(searchTerm) ||
      (t.title || t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.deptname || t.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (t.status || '').toUpperCase() === statusFilter.toUpperCase();
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
              Support Tickets
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
                      <i className="fas fa-filter mr-1 text-muted"></i> View
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'ALL' ? 'active' : ''}`}
                    >
                      <span>All Tickets</span>
                      <span className="badge float-right">{rawTickets.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('OPEN')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'OPEN' ? 'active' : ''}`}
                    >
                      <span>Open</span>
                      <span className="badge float-right">{openCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ANSWERED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'ANSWERED' ? 'active' : ''}`}
                    >
                      <span>Answered</span>
                      <span className="badge float-right">{answeredCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('CUSTOMER-REPLY')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'CUSTOMER-REPLY' ? 'active' : ''}`}
                    >
                      <span>Customer-Reply</span>
                      <span className="badge float-right">{customerReplyCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('CLOSED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'CLOSED' ? 'active' : ''}`}
                    >
                      <span>Closed</span>
                      <span className="badge float-right">{closedCount}</span>
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
                    <Link href={`/support/new${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-comments fa-fw mr-2 text-muted"></i> Open Ticket</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>Support Tickets</h1>
              </div>

              {/* Search filter row */}
              <div className="mb-3 d-flex justify-content-between align-items-center" style={{ gap: '10px' }}>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  Showing {filtered.length} of {rawTickets.length} entries
                </div>
                <div style={{ maxWidth: '280px', width: '100%' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
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
                      <th>Department</th>
                      <th>Subject</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted p-4">
                          No Tickets Found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t: any) => {
                        const statusLower = (t.status || 'open').toLowerCase().replace(' ', '-');

                        return (
                          <tr
                            key={t.id || t.tid}
                            onClick={() => router.push(`/support/${t.id || t.tid}${impQuery}`)}
                            className="cursor-pointer"
                          >
                            <td>{t.deptname || t.department || 'Technical Support'}</td>
                            <td>
                              <span className="font-weight-bold" style={{ color: '#0d6efd' }}>
                                #{t.tid || t.id}
                              </span>
                              {' - '}
                              <span>{t.title || t.subject}</span>
                            </td>
                            <td className="text-center">
                              <span className={`label status status-${statusLower}`}>
                                {t.status || 'Open'}
                              </span>
                            </td>
                            <td className="text-center text-muted" style={{ fontSize: '12px' }}>
                              {t.lastreply || t.date || '-'}
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

export default function ClientTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-slate-500">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Tickets...
        </div>
      }
    >
      <ClientTicketsContent />
    </Suspense>
  );
}
