'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { useActiveClient } from '@/hooks/useActiveClient';

function ClientServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientId, client, impQuery, services, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawServices = services || [];

  const activeCount = rawServices.filter((s: any) => (s.domainstatus || '').toLowerCase() === 'active').length;
  const pendingCount = rawServices.filter((s: any) => (s.domainstatus || '').toLowerCase() === 'pending').length;
  const suspendedCount = rawServices.filter((s: any) => (s.domainstatus || '').toLowerCase() === 'suspended').length;
  const terminatedCount = rawServices.filter((s: any) => (s.domainstatus || '').toLowerCase() === 'terminated').length;
  const cancelledCount = rawServices.filter((s: any) => (s.domainstatus || '').toLowerCase() === 'cancelled').length;

  const filtered = rawServices
    .filter((s: any) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (s.package || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.regdate || '').includes(searchTerm);
      const matchesStatus =
        statusFilter === 'ALL' || (s.domainstatus || '').toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      const dateA = a.regdate ? new Date(a.regdate).getTime() : 0;
      const dateB = b.regdate ? new Date(b.regdate).getTime() : 0;
      return dateB - dateA;
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
              My Products &amp; Services
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
                {/* View Filter Card */}
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
                      <span>All Products</span>
                      <span className="badge float-right">{rawServices.length}</span>
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
                      onClick={() => setStatusFilter('PENDING')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'PENDING' ? 'active' : ''}`}
                    >
                      <span>Pending</span>
                      <span className="badge float-right">{pendingCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('SUSPENDED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'SUSPENDED' ? 'active' : ''}`}
                    >
                      <span>Suspended</span>
                      <span className="badge float-right">{suspendedCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('TERMINATED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'TERMINATED' ? 'active' : ''}`}
                    >
                      <span>Terminated</span>
                      <span className="badge float-right">{terminatedCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('CANCELLED')}
                      className={`list-group-item list-group-item-action text-left ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
                    >
                      <span>Cancelled</span>
                      <span className="badge float-right">{cancelledCount}</span>
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
                    <Link href={`/cart${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-shopping-cart fa-fw mr-2 text-muted"></i> Order New Services</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>My Products &amp; Services</h1>
              </div>

              {/* Search filter row matching WHMCS table filter */}
              <div className="mb-3 d-flex justify-content-between align-items-center" style={{ gap: '10px' }}>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  Showing {filtered.length} of {rawServices.length} entries
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
                      <th style={{ width: '40px' }} className="text-center"></th>
                      <th>Product/Service</th>
                      <th className="text-center">Pricing</th>
                      <th className="text-center">Next Due Date</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted p-4">
                          No Records Found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((service: any) => {
                        const statusLower = (service.domainstatus || 'Active').toLowerCase();
                        const isServiceActive = statusLower === 'active';

                        return (
                          <tr
                            key={service.id}
                            onClick={() => router.push(`/clientarea/services/${service.id}${impQuery}`)}
                            className="cursor-pointer"
                          >
                            <td className="text-center py-0" style={{ verticalAlign: 'middle' }}>
                              {isServiceActive ? (
                                <i className="fas fa-lock text-success" title="SSL Active" style={{ fontSize: '16px' }}></i>
                              ) : (
                                <i className="fas fa-exclamation-triangle text-muted" title="Inactive" style={{ fontSize: '16px' }}></i>
                              )}
                            </td>
                            <td>
                              <strong>{service.package || service.product_name || 'Service'}</strong>
                              {service.domain ? (
                                <>
                                  <br />
                                  <a
                                    href={`http://${service.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted small"
                                  >
                                    {service.domain}
                                  </a>
                                </>
                              ) : (
                                <>
                                  <br />
                                  <span className="text-muted">-</span>
                                </>
                              )}
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              ৳{parseFloat(service.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              <br />
                              <small className="text-muted">{service.billingcycle || 'Monthly'}</small>
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              {service.nextduedate || '-'}
                            </td>
                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                              <span className={`label status status-${statusLower}`}>
                                {service.domainstatus || 'Active'}
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

export default function ClientServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-slate-500">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Products &amp; Services...
        </div>
      }
    >
      <ClientServicesContent />
    </Suspense>
  );
}
