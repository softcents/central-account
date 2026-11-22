'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { useActiveClient } from '@/hooks/useActiveClient';

function ClientAreaHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const {
    clientId,
    client,
    impQuery,
    services,
    activeServices,
    domains,
    invoices,
    unpaidInvoices,
    tickets,
    openTickets,
    quotes,
    isLoaded,
  } = useActiveClient();

  const [domainSearch, setDomainSearch] = useState('');
  const [supportPin, setSupportPin] = useState<string | null>(null);
  const [supportPinLoading, setSupportPinLoading] = useState(false);

  const fetchSupportPin = async () => {
    try {
      setSupportPinLoading(true);
      const res = await fetch(`/api/whmcs/addons/supportpin/get?clientId=${clientId || '177'}`);
      const data = await res.json();
      if (data.pin) setSupportPin(data.pin);
    } catch {} finally {
      setSupportPinLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportPin();
  }, [clientId]);

  // Handle WHMCS legacy query-based actions e.g. /clientarea?action=services
  useEffect(() => {
    if (!action) return;
    if (action === 'services' || action === 'products') {
      router.replace(`/clientarea/services${impQuery}`);
    } else if (action === 'domains') {
      router.replace(`/clientarea/domains${impQuery}`);
    } else if (action === 'invoices') {
      router.replace(`/clientarea/invoices${impQuery}`);
    } else if (action === 'quotes') {
      router.replace(`/clientarea/quotes${impQuery}`);
    } else if (action === 'tickets' || action === 'support') {
      router.replace(`/clientarea/tickets${impQuery}`);
    } else if (action === 'addfunds') {
      router.replace(`/clientarea/addfunds${impQuery}`);
    } else if (action === 'security') {
      router.replace(`/clientarea/security${impQuery}`);
    } else if (action === 'profile' || action === 'details') {
      router.replace(`/clientarea/profile${impQuery}`);
    } else if (action === 'affiliates') {
      router.replace(`/clientarea/affiliates${impQuery}`);
    } else if (action === 'emails') {
      router.replace(`/clientarea/emails${impQuery}`);
    } else if (action === 'contacts') {
      router.replace(`/clientarea/contacts${impQuery}`);
    } else if (action === 'masspay') {
      router.replace(`/clientarea/masspay${impQuery}`);
    } else if (action === 'productdetails') {
      const id = searchParams.get('id');
      router.replace(`/clientarea/services/${id || ''}${impQuery}`);
    } else if (action === 'domaindetails') {
      const id = searchParams.get('id');
      router.replace(`/clientarea/domains/${id || ''}${impQuery}`);
    }
  }, [action, impQuery, router, searchParams]);

  const displayServices = activeServices.length > 0 ? activeServices : services;

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainSearch.trim()) return;
    router.push(`/domainchecker?domain=${encodeURIComponent(domainSearch.trim())}${impQuery ? `&${impQuery.replace('?', '')}` : ''}`);
  };

  const clientName = client?.name || 'Customer';
  const companyName = client?.company || client?.companyname || 'SoftCents Systems Ltd.';

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
            <li className="breadcrumb-item active" aria-current="page">
              Client Area
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
                {/* Your Info Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-user mr-1 text-muted"></i> Your Info
                    </h3>
                  </div>
                  <div className="card-body">
                    <strong>{clientName}</strong><br />
                    {companyName && <>{companyName}<br /></>}
                    {client?.address1 && <>{client.address1}<br /></>}
                    <span>{client?.city || 'Dhaka'}, {client?.country || 'Bangladesh'}</span><br />
                    <span className="text-muted" style={{ wordBreak: 'break-all' }}>
                      {client?.email || 'customer@softcents.com'}
                    </span>
                  </div>
                  <div className="card-footer">
                    <Link href={`/clientarea/profile${impQuery}`} className="btn btn-default btn-sm btn-block">
                      <i className="fas fa-pencil-alt mr-1"></i> Update
                    </Link>
                  </div>
                </div>

                {/* Support PIN Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-key mr-1 text-muted"></i> Support PIN
                    </h3>
                  </div>
                  <div className="card-body text-center">
                    <div style={{ fontSize: '26px', fontWeight: 'bold', fontFamily: 'monospace', color: '#0d6efd', letterSpacing: '3px', marginBottom: '6px' }}>
                      {supportPinLoading ? '...' : (supportPin || '50410')}
                    </div>
                    <small className="text-muted d-block mb-2">
                      Provide this PIN when contacting support
                    </small>
                    <button type="button" onClick={fetchSupportPin} className="btn btn-default btn-xs">
                      <i className={`fas fa-sync mr-1 ${supportPinLoading ? 'fa-spin' : ''}`}></i> Generate New PIN
                    </button>
                  </div>
                </div>

                {/* Shortcuts Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-bookmark mr-1 text-muted"></i> Shortcuts
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href={`/cart${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-shopping-cart fa-fw mr-2 text-muted"></i> Order New Services</span>
                    </Link>
                    <Link href={`/domainchecker${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-globe fa-fw mr-2 text-muted"></i> Register a New Domain</span>
                    </Link>
                    <Link href={`/support/new${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-comments fa-fw mr-2 text-muted"></i> Open New Ticket</span>
                    </Link>
                    <Link href="/login" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-arrow-left fa-fw mr-2 text-muted"></i> Logout</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              {/* Top 4 Twenty-One Tiles */}
              <div className="tiles mb-4">
                <div className="row no-gutters">
                  <div className="col-6 col-xl-3">
                    <Link href={`/clientarea/services${impQuery}`} className="tile">
                      <i className="fas fa-cube"></i>
                      <div className="stat">{activeServices.length > 0 ? activeServices.length : services.length}</div>
                      <div className="title">Services</div>
                      <div className="highlight bg-color-blue"></div>
                    </Link>
                  </div>
                  <div className="col-6 col-xl-3">
                    <Link href={`/clientarea/domains${impQuery}`} className="tile">
                      <i className="fas fa-globe"></i>
                      <div className="stat">{domains.length}</div>
                      <div className="title">Domains</div>
                      <div className="highlight bg-color-green"></div>
                    </Link>
                  </div>
                  <div className="col-6 col-xl-3">
                    <Link href={`/clientarea/tickets${impQuery}`} className="tile">
                      <i className="fas fa-comments"></i>
                      <div className="stat">{openTickets.length}</div>
                      <div className="title">Tickets</div>
                      <div className="highlight bg-color-red"></div>
                    </Link>
                  </div>
                  <div className="col-6 col-xl-3">
                    <Link href={`/clientarea/invoices${impQuery}`} className="tile">
                      <i className="fas fa-credit-card"></i>
                      <div className="stat">{unpaidInvoices.length}</div>
                      <div className="title">Invoices</div>
                      <div className="highlight bg-color-gold"></div>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Overdue / Unpaid Invoices Panel */}
              {unpaidInvoices.length > 0 && (
                <div className="card card-accent-gold mb-3">
                  <div className="card-header">
                    <div className="float-right">
                      <Link href={`/clientarea/invoices${impQuery}`} className="btn btn-default btn-xs bg-color-gold text-white font-weight-bold">
                        View All
                      </Link>
                    </div>
                    <h3 className="card-title m-0">
                      <i className="fas fa-credit-card mr-1 text-warning"></i> Overdue Invoices
                    </h3>
                  </div>
                  <div className="card-body p-0">
                    <table className="table table-list mb-0" style={{ border: 0, margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Invoice Date</th>
                          <th>Due Date</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {unpaidInvoices.slice(0, 3).map((inv: any) => (
                          <tr key={inv.id}>
                            <td><strong>#{inv.invoicenum || inv.id}</strong></td>
                            <td>{inv.date || '-'}</td>
                            <td>{inv.duedate || '-'}</td>
                            <td><strong>৳{parseFloat(inv.total || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT</strong></td>
                            <td><span className="label status status-unpaid">Unpaid</span></td>
                            <td className="text-right">
                              <Link href={`/viewinvoice?id=${inv.id}`} className="btn btn-success btn-xs">
                                Pay Now &raquo;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Active Products/Services Panel */}
              <div className="card card-accent-blue mb-3">
                <div className="card-header">
                  <div className="float-right">
                    <Link href={`/clientarea/services${impQuery}`} className="btn btn-default btn-xs">
                      View All
                    </Link>
                  </div>
                  <h3 className="card-title m-0">
                    <i className="fas fa-cube mr-1 text-info"></i> Active Products/Services
                  </h3>
                </div>
                <div className="card-body p-0">
                  {displayServices.length === 0 ? (
                    <div className="p-3 text-muted text-center">No active services found.</div>
                  ) : (
                    <table className="table table-list mb-0" style={{ border: 0, margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Product/Service</th>
                          <th>Pricing</th>
                          <th>Next Due Date</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayServices.slice(0, 5).map((srv: any) => (
                          <tr key={srv.id}>
                            <td>
                              <strong>{srv.package || srv.product_name || 'Service'}</strong>
                              {srv.domain && <div className="text-muted small"><a href={`http://${srv.domain}`} target="_blank" rel="noreferrer">{srv.domain}</a></div>}
                            </td>
                            <td>
                              ৳{parseFloat(srv.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                              <small className="text-muted ml-1">{srv.billingcycle || 'Monthly'}</small>
                            </td>
                            <td>{srv.nextduedate || '-'}</td>
                            <td>
                              <span className={`label status status-${(srv.domainstatus || 'Active').toLowerCase()}`}>
                                {srv.domainstatus || 'Active'}
                              </span>
                            </td>
                            <td className="text-right">
                              <Link href={`/clientarea/services/${srv.id}${impQuery}`} className="btn btn-default btn-xs">
                                Manage &raquo;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Recent Support Tickets Panel */}
              <div className="card card-accent-red mb-3">
                <div className="card-header">
                  <div className="float-right">
                    <Link href={`/support/new${impQuery}`} className="btn btn-default btn-xs">
                      <i className="fas fa-plus mr-1"></i> Open Ticket
                    </Link>
                  </div>
                  <h3 className="card-title m-0">
                    <i className="fas fa-comments mr-1 text-danger"></i> Recent Support Tickets
                  </h3>
                </div>
                <div className="card-body p-0">
                  {tickets.length === 0 ? (
                    <div className="p-3 text-muted text-center">No recent support tickets found.</div>
                  ) : (
                    <table className="table table-list mb-0" style={{ border: 0, margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Subject</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.slice(0, 4).map((t: any) => (
                          <tr key={t.id || t.tid}>
                            <td>{t.deptname || t.department || 'Support'}</td>
                            <td>
                              <Link href={`/support/${t.id || t.tid}${impQuery}`} className="font-weight-bold">
                                #{t.tid || t.id} - {t.title || t.subject}
                              </Link>
                            </td>
                            <td>
                              <span className={`label status status-${(t.status || 'open').toLowerCase().replace(' ', '-')}`}>
                                {t.status || 'Open'}
                              </span>
                            </td>
                            <td>{t.lastreply || t.date || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Register a New Domain Panel */}
              <div className="card card-accent-green mb-3">
                <div className="card-header">
                  <h3 className="card-title m-0">
                    <i className="fas fa-globe mr-1 text-success"></i> Register a New Domain
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleDomainSubmit}>
                    <div style={{ display: 'flex', gap: '0' }}>
                      <input
                        type="text"
                        value={domainSearch}
                        onChange={(e) => setDomainSearch(e.target.value)}
                        placeholder="Enter a domain name to register (e.g. softcents.com)..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px 0 0 4px',
                          fontSize: '14px',
                        }}
                      />
                      <button
                        type="submit"
                        className="btn btn-success"
                        style={{ borderRadius: '0 4px 4px 0', padding: '8px 20px', fontWeight: 'bold' }}
                      >
                        <i className="fas fa-search mr-1"></i> Search
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhmcsFooter />
    </div>
  );
}

export default function ClientAreaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-slate-500">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Client Area...
        </div>
      }
    >
      <ClientAreaHomeContent />
    </Suspense>
  );
}
