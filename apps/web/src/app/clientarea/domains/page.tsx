'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { useActiveClient } from '@/hooks/useActiveClient';

function ClientDomainsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientId, client, impQuery, domains, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawDomains = domains || [];

  const activeCount = rawDomains.filter((d: any) => (d.status || '').toLowerCase() === 'active').length;
  const expiredCount = rawDomains.filter((d: any) => (d.status || '').toLowerCase() === 'expired').length;
  const pendingCount = rawDomains.filter((d: any) => (d.status || '').toLowerCase() === 'pending').length;

  const filtered = rawDomains.filter((d: any) => {
    const matchesSearch =
      !searchTerm.trim() ||
      (d.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.registrar || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || (d.status || '').toUpperCase() === statusFilter.toUpperCase();
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
              My Domains
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
                      <span>All Domains</span>
                      <span className="badge float-right">{rawDomains.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ACTIVE')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                    >
                      <span>Active</span>
                      <span className="badge float-right">{activeCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('EXPIRED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'EXPIRED' ? 'active' : ''}`}
                    >
                      <span>Expired</span>
                      <span className="badge float-right">{expiredCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('PENDING')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'PENDING' ? 'active' : ''}`}
                    >
                      <span>Pending</span>
                      <span className="badge float-right">{pendingCount}</span>
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
                    <Link href={`/cart?a=renew${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-sync fa-fw mr-2 text-muted"></i> Renew Domains</span>
                    </Link>
                    <Link href={`/domainchecker${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-globe fa-fw mr-2 text-muted"></i> Register a New Domain</span>
                    </Link>
                    <Link href={`/cart?a=add&domain=transfer${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-exchange-alt fa-fw mr-2 text-muted"></i> Transfer Domains to Us</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>My Domains</h1>
              </div>

              {/* Bulk Action Buttons matching WHMCS clientareadomains.tpl */}
              <div className="mb-3 d-flex flex-wrap align-items-center justify-content-between" style={{ gap: '10px' }}>
                <div className="btn-group btn-group-sm" role="group">
                  <button type="button" className="btn btn-default btn-sm mr-1">
                    <i className="fas fa-globe fa-fw mr-1"></i> Manage Nameservers
                  </button>
                  <button type="button" className="btn btn-default btn-sm mr-1">
                    <i className="fas fa-user fa-fw mr-1"></i> Contact Info
                  </button>
                  <Link href={`/cart?a=renew${impQuery}`} className="btn btn-default btn-sm">
                    <i className="fas fa-sync fa-fw mr-1"></i> Auto Renew Status
                  </Link>
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
                      <th style={{ width: '30px' }} className="text-center"></th>
                      <th style={{ width: '40px' }} className="text-center"></th>
                      <th>Domain</th>
                      <th className="text-center">Registration Date</th>
                      <th className="text-center">Next Due Date</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted p-4">
                          No Domains Found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((d: any) => {
                        const statusLower = (d.status || 'Active').toLowerCase();

                        return (
                          <tr
                            key={d.id}
                            onClick={() => router.push(`/clientarea/domains/${d.id}${impQuery}`)}
                            className="cursor-pointer"
                          >
                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" name="domids[]" value={d.id} />
                            </td>
                            <td className="text-center py-0" style={{ verticalAlign: 'middle' }}>
                              <i className="fas fa-lock text-success" title="SSL Active" style={{ fontSize: '15px' }}></i>
                            </td>
                            <td>
                              <a
                                href={`http://${d.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="font-weight-bold"
                              >
                                {d.domain}
                              </a>
                              <br />
                              <small className="text-muted">
                                <i className="fas fa-check text-success fa-fw mr-1"></i>
                                Auto Renew Enabled
                              </small>
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              {d.registrationdate || d.regdate || '-'}
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              {d.nextduedate || d.expirydate || '-'}
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              <span className={`label status status-${statusLower}`}>
                                {d.status || 'Active'}
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

export default function ClientDomainsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-slate-500">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Domains...
        </div>
      }
    >
      <ClientDomainsContent />
    </Suspense>
  );
}
