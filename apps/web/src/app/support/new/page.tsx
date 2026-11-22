'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useActiveClient } from '@/hooks/useActiveClient';

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();
  const { clientId, client, impQuery, services } = useActiveClient();

  const [department, setDepartment] = useState('Technical Support');
  const [priority, setPriority] = useState('Medium');
  const [relatedService, setRelatedService] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileBase64: string; mimeType: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = client?.name || user?.name || 'Customer';
  const clientEmail = client?.email || user?.email || 'customer@softcents.com';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments((prev) => [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please provide both a subject and a message');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (accessToken) {
        const res = await apiFetch<any>(
          '/support/tickets',
          {
            method: 'POST',
            body: JSON.stringify({
              category: department,
              priority: priority.toUpperCase(),
              subject: subject.trim(),
              description: message.trim(),
              relatedService: relatedService || undefined,
              attachments: attachments.length > 0 ? attachments : undefined,
            }),
          },
          accessToken,
        );

        if (res.ok && res.data?.id) {
          router.push(`/support/${res.data.id}`);
          return;
        }
      }

      // If client area simulated or WHMCS local fallback
      router.push(`/clientarea/tickets${impQuery}`);
    } catch {
      setError('An unexpected error occurred while submitting ticket');
    } finally {
      setSubmitting(false);
    }
  };

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
              <Link href={`/clientarea/tickets${impQuery}`}>Support Tickets</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Submit Ticket
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
                {/* Support Departments Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-life-ring mr-1 text-muted"></i> Support
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <button
                      type="button"
                      onClick={() => setDepartment('Technical Support')}
                      className={`list-group-item list-group-item-action text-left ${department === 'Technical Support' ? 'active' : ''}`}
                    >
                      <span>Technical Support</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepartment('Billing & Accounts')}
                      className={`list-group-item list-group-item-action text-left ${department === 'Billing & Accounts' ? 'active' : ''}`}
                    >
                      <span>Billing &amp; Accounts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepartment('Sales & Inquiries')}
                      className={`list-group-item list-group-item-action text-left ${department === 'Sales & Inquiries' ? 'active' : ''}`}
                    >
                      <span>Sales &amp; Inquiries</span>
                    </button>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-list mr-1 text-muted"></i> Actions
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href={`/clientarea/tickets${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-ticket-alt fa-fw mr-2 text-muted"></i> View My Tickets</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="card">
                <div className="card-body" style={{ padding: '25px' }}>
                  <h3 className="card-title mb-4" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    Open Ticket
                  </h3>

                  {error && (
                    <div className="alert alert-danger mb-3 p-3 bg-red-100 text-red-800 rounded">
                      <i className="fas fa-exclamation-triangle mr-2"></i> {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Name & Email Row */}
                    <div className="row mb-3">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Name
                        </label>
                        <input
                          type="text"
                          value={clientName}
                          disabled
                          className="form-control"
                          style={{
                            backgroundColor: '#e9ecef',
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={clientEmail}
                          disabled
                          className="form-control"
                          style={{
                            backgroundColor: '#e9ecef',
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="form-group mb-3">
                      <label htmlFor="subject" className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Ticket Subject"
                        className="form-control"
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                        required
                      />
                    </div>

                    {/* Department, Related Service & Priority */}
                    <div className="row mb-3">
                      <div className="col-md-4 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Department
                        </label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          <option value="Technical Support">Technical Support</option>
                          <option value="Billing & Accounts">Billing &amp; Accounts</option>
                          <option value="Sales & Inquiries">Sales &amp; Inquiries</option>
                        </select>
                      </div>

                      <div className="col-md-4 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Related Service
                        </label>
                        <select
                          value={relatedService}
                          onChange={(e) => setRelatedService(e.target.value)}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          <option value="">None</option>
                          {(services || []).map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.package || s.product_name} ({s.domain || `Service #${s.id}`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Priority
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    {/* Message Textarea */}
                    <div className="form-group mb-3">
                      <label htmlFor="message" className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={10}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please provide detailed information about your inquiry..."
                        className="form-control"
                        style={{
                          padding: '10px 12px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                        required
                      ></textarea>
                    </div>

                    {/* Attachments */}
                    <div className="form-group mb-4">
                      <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
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

                      {attachments.length > 0 && (
                        <div className="mt-2">
                          {attachments.map((att, idx) => (
                            <span key={idx} className="badge badge-info mr-2 p-1">
                              <i className="fas fa-paperclip mr-1"></i> {att.fileName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit & Cancel Buttons */}
                    <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary"
                        style={{ padding: '8px 24px', fontWeight: 'bold' }}
                      >
                        {submitting ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-1"></i> Submitting...
                          </>
                        ) : (
                          'Submit Ticket'
                        )}
                      </button>
                      <Link
                        href={`/clientarea/tickets${impQuery}`}
                        className="btn btn-default"
                        style={{ padding: '8px 20px' }}
                      >
                        Cancel
                      </Link>
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
