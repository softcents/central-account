'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { apiFetch, API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import whmcsData from '@/data/whmcs_sync.json';

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { user, accessToken, isLoading } = useAuth();

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Array<{ fileName: string; fileBase64: string; mimeType: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);

    // 1. Check if it's a WHMCS ticket
    const whmcsTicket = (whmcsData?.tickets || []).find(
      (t: any) =>
        String(t.id) === String(ticketId) ||
        String(t.tid) === String(ticketId) ||
        ticketId === `tkt_whmcs_${t.id}`
    );

    if (whmcsTicket) {
      const messages = [
        {
          id: `msg_init_${whmcsTicket.id}`,
          sender_type: 'CUSTOMER',
          message: whmcsTicket.message || whmcsTicket.title,
          created_at: whmcsTicket.date,
          sender_name: whmcsTicket.clientName || 'Customer',
        },
        ...(whmcsTicket.replies || []).map((r: any) => ({
          id: `msg_rep_${r.id}`,
          sender_type: r.admin ? 'ADMIN' : 'CUSTOMER',
          message: r.message,
          created_at: r.date,
          sender_name: r.admin || r.name || 'Support Staff',
        })),
      ];

      setTicket({
        id: whmcsTicket.id,
        ticket_number: whmcsTicket.tid || whmcsTicket.id,
        subject: whmcsTicket.title,
        department: whmcsTicket.dept_name || 'Technical Support',
        status: whmcsTicket.status || 'Open',
        priority: whmcsTicket.urgency || 'Medium',
        created_at: whmcsTicket.date,
        messages,
        isWhmcs: true,
      });
      setLoading(false);
      return;
    }

    // 2. Otherwise load from NestJS API
    if (accessToken) {
      try {
        const res = await apiFetch<any>(`/support/tickets/${ticketId}`, {}, accessToken);
        if (res.ok && res.data) {
          setTicket({
            ...res.data,
            ticket_number: res.data.ticketNumber || res.data.id,
            department: res.data.category || 'Customer Service',
            priority: res.data.priority || 'Medium',
          });
        } else {
          setError('Failed to load support ticket');
        }
      } catch {
        setError('An error occurred loading ticket details');
      }
    } else {
      setError('Please login to view this support ticket');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, ticketId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setReplyAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    setError(null);

    if (ticket?.isWhmcs) {
      const newMsg = {
        id: `msg_local_${Date.now()}`,
        sender_type: 'CUSTOMER',
        message: replyText.trim(),
        created_at: new Date().toLocaleString(),
        sender_name: user?.name || 'Customer',
      };
      setTicket((prev: any) => ({
        ...prev,
        status: 'Customer-Reply',
        messages: [...(prev.messages || []), newMsg],
      }));
      setReplyText('');
      setReplyAttachments([]);
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiFetch<any>(
        `/support/tickets/${ticketId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: replyText.trim(),
            attachments: replyAttachments.length > 0 ? replyAttachments : undefined,
          }),
        },
        accessToken,
      );

      if (res.ok && res.data) {
        setTicket((prev: any) => ({
          ...prev,
          messages: [...(prev?.messages || []), res.data],
        }));
        setReplyText('');
        setReplyAttachments([]);
      } else {
        setError(res.error?.message || 'Failed to submit reply');
      }
    } catch {
      setError('An error occurred submitting reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = () => {
    if (confirm('Are you sure you want to close this ticket?')) {
      setTicket((prev: any) => ({
        ...prev,
        status: 'Closed',
      }));
    }
  };

  if (isLoading || loading) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen">
        <ClientHeader />
        <div className="p-12 text-center text-muted">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading conversation thread...
        </div>
        <WhmcsFooter />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen">
        <ClientHeader />
        <div className="container py-5 text-center">
          <div className="card max-w-lg mx-auto p-4">
            <i className="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
            <h3>Ticket Not Found</h3>
            <p className="text-muted">The requested ticket #{ticketId} could not be located.</p>
            <Link href="/clientarea/tickets" className="btn btn-default mt-2">
              &larr; Return to Tickets List
            </Link>
          </div>
        </div>
        <WhmcsFooter />
      </div>
    );
  }

  const isClosed = (ticket.status || '').toLowerCase() === 'closed';
  const statusLower = (ticket.status || 'open').toLowerCase().replace(' ', '-');

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-800">
      <ClientHeader />

      {/* WHMCS Master Breadcrumb */}
      <nav className="master-breadcrumb" aria-label="breadcrumb">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/clientarea">Portal Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/clientarea/tickets">Support Tickets</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              View Ticket
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
                {/* Ticket Info Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-info-circle mr-1 text-muted"></i> Ticket Information
                    </h3>
                  </div>
                  <div className="card-body">
                    <strong>Department:</strong><br />
                    <span>{ticket.department || 'Technical Support'}</span>
                    <hr className="my-2" />
                    <strong>Submitted:</strong><br />
                    <span>{ticket.created_at || '-'}</span>
                    <hr className="my-2" />
                    <strong>Priority:</strong><br />
                    <span>{ticket.priority || 'Medium'}</span>
                    <hr className="my-2" />
                    <strong>Status:</strong><br />
                    <span className={`label status status-${statusLower}`}>
                      {ticket.status || 'Open'}
                    </span>
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
                    <a href="#reply" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-pencil-alt fa-fw mr-2 text-muted"></i> Reply</span>
                    </a>
                    {!isClosed && (
                      <button
                        type="button"
                        onClick={handleCloseTicket}
                        className="list-group-item list-group-item-action text-left text-danger"
                      >
                        <span><i className="fas fa-times fa-fw mr-2 text-danger"></i> Close Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              {/* Ticket Header & Subject */}
              <div className="card view-ticket mb-4">
                <div className="card-body p-3">
                  <div className="float-right">
                    <span className={`label status status-${statusLower}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h3 className="card-title" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    View Ticket #{ticket.ticket_number}
                  </h3>
                  <p className="mb-0 mt-2">
                    Subject: <strong>{ticket.subject}</strong>
                  </p>
                </div>

                {/* Messages Thread */}
                {(ticket.messages || []).map((msg: any, idx: number) => {
                  const isStaff = msg.sender_type === 'ADMIN' || msg.sender_type === 'STAFF';

                  return (
                    <div
                      key={msg.id || idx}
                      className={`ticket-reply markdown-content ${isStaff ? 'staff' : ''}`}
                    >
                      <div className="posted-by">
                        <span className="font-weight-bold">{msg.sender_name || (isStaff ? 'Softcents Support Staff' : 'Customer')}</span>
                        <span className="text-muted ml-2" style={{ fontSize: '11px' }}>
                          {msg.created_at || ''}
                        </span>
                        <span className={`label requestor-badge float-right ${isStaff ? 'requestor-type-operator' : 'requestor-type-owner'}`}>
                          {isStaff ? 'Operator' : 'Owner'}
                        </span>
                      </div>
                      <div className="message p-3" style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {msg.message || msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form Container */}
              {!isClosed ? (
                <div className="card" id="reply">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-pencil-alt mr-1"></i> Reply
                    </h3>
                  </div>
                  <div className="card-body">
                    {error && (
                      <div className="alert alert-danger mb-3 p-2 text-danger font-weight-bold">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSendReply}>
                      <div className="form-group mb-3">
                        <label htmlFor="message" className="font-weight-bold mb-1">
                          Message
                        </label>
                        <textarea
                          id="message"
                          rows={6}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply here..."
                          className="form-control"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            fontSize: '13px',
                          }}
                          required
                        ></textarea>
                      </div>

                      <div className="form-group mb-3">
                        <label className="font-weight-bold mb-1">
                          Attachments
                        </label>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="form-control-file d-block text-muted"
                          style={{ fontSize: '12px' }}
                        />
                        <small className="text-muted d-block mt-1">
                          Allowed File Extensions: .jpg, .gif, .jpeg, .png, .pdf, .zip, .txt (Max file size: 10MB)
                        </small>

                        {replyAttachments.length > 0 && (
                          <div className="mt-2">
                            {replyAttachments.map((att, idx) => (
                              <span key={idx} className="badge badge-info mr-2 p-1">
                                <i className="fas fa-paperclip mr-1"></i> {att.fileName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary"
                      >
                        {submitting ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-1"></i> Submitting...
                          </>
                        ) : (
                          'Submit Reply'
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning text-center">
                  <i className="fas fa-lock mr-1"></i> This ticket is closed. Please submit a new support ticket if you require further assistance.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <WhmcsFooter />
    </div>
  );
}
