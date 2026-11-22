'use client';

import React, { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import whmcsData from '@/data/whmcs_sync.json';

function formatEmailDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split(' ');
  const d = parts[0];
  const t = parts[1] ? parts[1].slice(0, 5) : '';
  const dParts = d.split('-');
  if (dParts.length === 3) {
    return `${dParts[2]}/${dParts[1]}/${dParts[0]} ${t}`;
  }
  return dateStr;
}

function EmailsContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate') || searchParams.get('userid');
  const impQuery = impersonate ? `?impersonate=${encodeURIComponent(impersonate)}` : '';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // Filter emails for this client or default client
  const clientEmails = useMemo(() => {
    const list = whmcsData?.emails || [];
    if (impersonate) {
      const matched = list.filter((e: any) => String(e.userid) === String(impersonate));
      if (matched.length > 0) return matched;
    }
    return list;
  }, [impersonate]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return clientEmails;
    const term = searchTerm.toLowerCase();
    return clientEmails.filter(
      (e: any) =>
        (e.subject || '').toLowerCase().includes(term) ||
        (e.recipient || '').toLowerCase().includes(term) ||
        (e.date || '').includes(term)
    );
  }, [clientEmails, searchTerm]);

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
              Email History
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
                {/* My Account Menu Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-user mr-1 text-muted"></i> My Account
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href={`/clientarea/profile${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-user fa-fw mr-2 text-muted"></i> My Details</span>
                    </Link>
                    <Link href={`/clientarea/contacts${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-users fa-fw mr-2 text-muted"></i> Contacts/Sub-Accounts</span>
                    </Link>
                    <Link href={`/clientarea/security${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-lock fa-fw mr-2 text-muted"></i> Security Settings</span>
                    </Link>
                    <Link href={`/clientarea/emails${impQuery}`} className="list-group-item list-group-item-action active">
                      <span><i className="fas fa-envelope fa-fw mr-2"></i> Email History</span>
                    </Link>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-arrow-left mr-1 text-muted"></i> Actions
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href={`/clientarea${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-home fa-fw mr-2 text-muted"></i> Back to Client Area</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>Email History</h1>
              </div>

              {/* Search filter row */}
              <div className="mb-3 d-flex justify-content-between align-items-center" style={{ gap: '10px' }}>
                <div className="text-muted" style={{ fontSize: '13px' }}>
                  Showing {filtered.length} of {clientEmails.length} entries
                </div>
                <div style={{ maxWidth: '280px', width: '100%' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by subject..."
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
                      <th style={{ width: '180px' }}>Date Sent</th>
                      <th>Message Subject</th>
                      <th style={{ width: '130px' }} className="text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted p-4">
                          No Email Records Found
                        </td>
                      </tr>
                    ) : (
                      filtered.slice(0, 100).map((e: any) => (
                        <tr
                          key={e.id}
                          onClick={() => setSelectedEmail(e)}
                          className="cursor-pointer"
                        >
                          <td style={{ verticalAlign: 'middle' }}>
                            {formatEmailDate(e.date)}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            <strong>{e.subject}</strong>
                            {e.recipient && (
                              <div className="text-muted small">{e.recipient}</div>
                            )}
                          </td>
                          <td className="text-center" style={{ verticalAlign: 'middle' }}>
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setSelectedEmail(e);
                              }}
                              className="btn btn-info btn-xs"
                            >
                              <i className="fas fa-eye mr-1"></i> View Message
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIEW EMAIL MESSAGE MODAL */}
      {selectedEmail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '15px',
          }}
        >
          <div className="card max-w-2xl w-100" style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="card-title text-white m-0" style={{ fontSize: '15px' }}>
                <i className="fas fa-envelope mr-1"></i> {selectedEmail.subject}
              </h3>
              <div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-default btn-xs text-white mr-2"
                  style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.4)' }}
                >
                  <i className="fas fa-print mr-1"></i> Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="close text-white"
                  style={{ background: 'none', border: 0, fontSize: '20px', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="bg-light p-3 border-bottom small text-muted" style={{ lineHeight: '1.6' }}>
              <div><strong>Date:</strong> {formatEmailDate(selectedEmail.date)}</div>
              <div><strong>Recipient:</strong> {selectedEmail.recipient || 'Customer'}</div>
              <div><strong>Sender:</strong> SoftCents Systems Ltd. &lt;billing@softcents.com&gt;</div>
            </div>

            <div className="p-4" style={{ overflowY: 'auto', flex: 1, backgroundColor: '#fff', fontSize: '13px', lineHeight: '1.6' }}>
              {selectedEmail.message && selectedEmail.message.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.message }} />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                  {selectedEmail.message || 'No email content available.'}
                </pre>
              )}
            </div>

            <div className="card-footer text-right">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="btn btn-default btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <WhmcsFooter />
    </div>
  );
}

export default function ClientEmailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-muted">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Email History...
        </div>
      }
    >
      <EmailsContent />
    </Suspense>
  );
}
