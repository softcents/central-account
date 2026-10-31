'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  User,
  FileText,
  Shield,
  RefreshCw,
  LifeBuoy,
  Mail,
  Layers,
  Send,
  Plus,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function InternalReviewPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'TICKETS' | 'EMAIL_CHANGE' | 'OAUTH'>('IDENTITY');

  // KYC States
  const [pendingCases, setPendingCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Support Tickets States
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState('IN_REVIEW');

  // OAuth Clients States
  const [clients, setClients] = useState<any[]>([]);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDesc, setNewClientDesc] = useState('');
  const [newClientRedirects, setNewClientRedirects] = useState('http://localhost:3000/callback');
  const [newClientScopes, setNewClientScopes] = useState('openid profile email identity');
  const [createdClientSecret, setCreatedClientSecret] = useState<{ clientId: string; clientSecret: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Loaders
  const loadKyc = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<any[]>('/internal/review/pending', {}, accessToken);
      if (res.ok && Array.isArray(res.data)) {
        setPendingCases(res.data);
        if (res.data.length > 0 && !selectedCase) setSelectedCase(res.data[0]);
      }
    } catch {}
  };

  const loadTickets = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<any[]>('/internal/support/tickets', {}, accessToken);
      if (res.ok && Array.isArray(res.data)) {
        setTickets(res.data);
        if (res.data.length > 0 && !selectedTicket) {
          const detailRes = await apiFetch<any>(`/internal/support/tickets/${res.data[0].id}`, {}, accessToken);
          if (detailRes.ok) setSelectedTicket(detailRes.data);
        }
      }
    } catch {}
  };

  const loadClients = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<any[]>('/internal/oauth/clients', {}, accessToken);
      if (res.ok && Array.isArray(res.data)) {
        setClients(res.data);
      }
    } catch {}
  };

  const refreshCurrentTab = async () => {
    setLoading(true);
    setFeedback(null);
    if (activeTab === 'IDENTITY') await loadKyc();
    if (activeTab === 'TICKETS' || activeTab === 'EMAIL_CHANGE') await loadTickets();
    if (activeTab === 'OAUTH') await loadClients();
    setLoading(false);
  };

  useEffect(() => {
    refreshCurrentTab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, activeTab]);

  // Handlers
  const handleSelectTicket = async (ticket: any) => {
    try {
      const res = await apiFetch<any>(`/internal/support/tickets/${ticket.id}`, {}, accessToken);
      if (res.ok) setSelectedTicket(res.data);
    } catch {}
  };

  const handleAdminTicketReply = async () => {
    if (!selectedTicket || !adminReplyText.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch<any>(
        `/internal/support/tickets/${selectedTicket.id}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ message: adminReplyText.trim() }),
        },
        accessToken,
      );
      if (res.ok) {
        setFeedback('Admin response posted to ticket thread.');
        setAdminReplyText('');
        const refreshed = await apiFetch<any>(`/internal/support/tickets/${selectedTicket.id}`, {}, accessToken);
        if (refreshed.ok) setSelectedTicket(refreshed.data);
      }
    } catch {
      setFeedback('Error posting reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<any>(
        `/internal/support/tickets/${selectedTicket.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, notes: actionNotes.trim() || undefined }),
        },
        accessToken,
      );
      if (res.ok) {
        setFeedback(`Ticket status updated to ${status}`);
        setActionNotes('');
        await loadTickets();
        const refreshed = await apiFetch<any>(`/internal/support/tickets/${selectedTicket.id}`, {}, accessToken);
        if (refreshed.ok) setSelectedTicket(refreshed.data);
      }
    } catch {
      setFeedback('Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailChangeDecision = async (ticketId: string, action: 'APPROVE' | 'REJECT') => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch<any>(
        `/internal/email-change/${ticketId}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({ action, notes: actionNotes.trim() || undefined }),
        },
        accessToken,
      );
      if (res.ok) {
        setFeedback(`Email change request ${action === 'APPROVE' ? 'APPROVED (verification dispatched)' : 'REJECTED'}`);
        setActionNotes('');
        await loadTickets();
        if (selectedTicket?.id === ticketId) {
          const refreshed = await apiFetch<any>(`/internal/support/tickets/${ticketId}`, {}, accessToken);
          if (refreshed.ok) setSelectedTicket(refreshed.data);
        }
      } else {
        setFeedback(res.data?.message || 'Action failed');
      }
    } catch {
      setFeedback('Error recording decision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<any>(
        '/internal/oauth/clients',
        {
          method: 'POST',
          body: JSON.stringify({
            name: newClientName.trim(),
            description: newClientDesc.trim() || undefined,
            redirectUris: newClientRedirects.split(',').map((u) => u.trim()),
            allowedScopes: newClientScopes.split(' ').map((s) => s.trim().toLowerCase()),
          }),
        },
        accessToken,
      );

      if (res.ok && res.data) {
        setCreatedClientSecret({
          clientId: res.data.clientId,
          clientSecret: res.data.clientSecret,
        });
        setNewClientName('');
        setNewClientDesc('');
        await loadClients();
      } else {
        setFeedback(res.data?.message || 'Failed to register client');
      }
    } catch {
      setFeedback('Error creating client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotateSecret = async (clientId: string) => {
    if (!confirm('Rotate client secret? Existing secret will stop functioning immediately.')) return;
    try {
      const res = await apiFetch<any>(`/internal/oauth/clients/${clientId}/rotate-secret`, { method: 'POST' }, accessToken);
      if (res.ok) {
        setCreatedClientSecret({
          clientId,
          clientSecret: res.data.newClientSecret,
        });
      }
    } catch {
      setFeedback('Failed to rotate secret');
    }
  };

  const handleKycDecision = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_REVERIFICATION') => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<any>(
        `/internal/review/${selectedCase.id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({ action, notes: actionNotes.trim() || undefined }),
        },
        accessToken,
      );
      if (res.ok) {
        setFeedback(`Identity record updated: ${action}`);
        setActionNotes('');
        const remaining = pendingCases.filter((c) => c.id !== selectedCase.id);
        setPendingCases(remaining);
        setSelectedCase(remaining[0] || null);
      }
    } catch {
      setFeedback('Error recording decision');
    } finally {
      setSubmitting(false);
    }
  };

  const emailChangeTickets = tickets.filter((t) => t.category === 'EMAIL_CHANGE');

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <ClipboardCheck className="w-7 h-7 text-indigo-400" />
            <span>Compliance & Operations Console</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Central review hub for Identity KYC, Support Tickets, Email Changes, and OAuth Connected Apps
          </p>
        </div>

        <button
          onClick={refreshCurrentTab}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh Current View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('IDENTITY')}
          className={`pb-3 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === 'IDENTITY' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Identity KYC Reviews ({pendingCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`pb-3 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === 'TICKETS' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EMAIL_CHANGE')}
          className={`pb-3 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === 'EMAIL_CHANGE' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Change Reviews ({emailChangeTickets.filter((t) => t.status === 'IN_REVIEW' || t.status === 'OPEN').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OAUTH')}
          className={`pb-3 border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === 'OAUTH' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>OAuth Applications ({clients.length})</span>
        </button>
      </div>

      {/* TAB 1: IDENTITY KYC REVIEWS */}
      {activeTab === 'IDENTITY' && (
        pendingCases.length === 0 ? (
          <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No pending KYC identity cases. All verifications are up to date!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending Queue ({pendingCases.length})
              </h3>
              <div className="space-y-2">
                {pendingCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedCase?.id === c.id
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-[160px]">{c.userEmail}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-400 border border-amber-800">
                        {c.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Submitted: {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCase && (
              <div className="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedCase.userEmail}</h2>
                    <span className="text-xs font-mono text-slate-500 select-all">ID: {selectedCase.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Current Step</span>
                    <span className="text-xs font-semibold text-indigo-300">{selectedCase.currentStep}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider block">Document Extraction (OCR)</span>
                  {selectedCase.documents?.map((doc: any) => {
                    const ocr = doc.ocr_results?.[0];
                    return (
                      <div key={doc.id} className="grid grid-cols-2 gap-2 text-slate-300">
                        <div><span className="text-slate-500 block">Type:</span><span>{doc.document_type?.name}</span></div>
                        <div><span className="text-slate-500 block">Extracted Name:</span><span>{ocr?.full_name || 'N/A'}</span></div>
                        <div><span className="text-slate-500 block">Doc Number:</span><span className="font-mono">{ocr?.document_number || 'N/A'}</span></div>
                        <div><span className="text-slate-500 block">Confidence:</span><span className="font-bold text-emerald-400">{Math.round((ocr?.confidence_score || 0) * 100)}%</span></div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <textarea
                    rows={2}
                    placeholder="Enter compliance decision rationale..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white outline-none resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleKycDecision('APPROVE')}
                      disabled={submitting}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all"
                    >
                      Approve (Level 5)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKycDecision('REQUEST_REVERIFICATION')}
                      disabled={submitting}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all"
                    >
                      Request Re-verification
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKycDecision('REJECT')}
                      disabled={submitting}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* TAB 2: SUPPORT TICKETS */}
      {activeTab === 'TICKETS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tickets Queue ({tickets.length})
            </h3>
            <div className="space-y-2">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTicket?.id === t.id
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white truncate max-w-[150px]">{t.subject}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{t.userEmail}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                    <span className="text-indigo-400 font-medium">{t.category}</span>
                    <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTicket && (
            <div className="md:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-6">
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-semibold">
                      {selectedTicket.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">#{selectedTicket.id.slice(0, 8)}</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h2>
                  <p className="text-xs text-slate-400">User: {selectedTicket.userEmail}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={ticketStatusUpdate}
                    onChange={(e) => setTicketStatusUpdate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="IN_REVIEW">In Review</option>
                    <option value="WAITING_FOR_USER">Waiting for User</option>
                    <option value="APPROVED">Approved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketStatus(ticketStatusUpdate)}
                    disabled={submitting}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Thread History */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedTicket.messages?.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      msg.sender_type === 'ADMIN'
                        ? 'bg-slate-800/80 border-indigo-900/50'
                        : msg.sender_type === 'SYSTEM'
                        ? 'bg-slate-950 border-slate-800 text-amber-300'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-white">
                        {msg.sender_type === 'ADMIN' ? 'Staff Response' : msg.sender_type === 'SYSTEM' ? 'System Notification' : 'User'}
                      </span>
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <div className="space-y-3 pt-2">
                <textarea
                  rows={3}
                  placeholder="Type official admin reply..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleAdminTicketReply}
                  disabled={submitting || !adminReplyText.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Staff Response</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMAIL CHANGE REVIEWS */}
      {activeTab === 'EMAIL_CHANGE' && (
        <div className="space-y-4">
          {emailChangeTickets.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-xs">
              No email change requests on record.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {emailChangeTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-white">Ticket #{t.id.slice(0, 8)}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
                      {t.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Current Registered Email:</span>
                      <span className="font-mono text-white font-medium">{t.userEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Description / Target:</span>
                      <span className="text-slate-300">{t.description}</span>
                    </div>
                  </div>

                  {t.status === 'IN_REVIEW' || t.status === 'OPEN' ? (
                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        placeholder="Compliance verification notes..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEmailChangeDecision(t.id, 'APPROVE')}
                          disabled={submitting}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                        >
                          Approve & Send Signed Link
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEmailChangeDecision(t.id, 'REJECT')}
                          disabled={submitting}
                          className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                        >
                          Reject Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-950 text-slate-400 text-xs font-mono">
                      Request already processed ({t.status}).
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OAUTH CONNECTED APPLICATIONS */}
      {activeTab === 'OAUTH' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registered OAuth / OIDC Clients</h3>
            <button
              onClick={() => {
                setShowNewClientModal(true);
                setCreatedClientSecret(null);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Client</span>
            </button>
          </div>

          {/* Secret Disclosure Banner */}
          {createdClientSecret && (
            <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-3 text-xs">
              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                <Key className="w-4 h-4" />
                <span>Client Secret Generated (Store Securely — Shown Once Only)</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-white flex items-center justify-between select-all border border-slate-800">
                <span>{createdClientSecret.clientSecret}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdClientSecret.clientSecret);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="p-1 hover:text-indigo-400 transition-colors"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Client ID: <code className="font-mono font-bold text-white">{createdClientSecret.clientId}</code>. Central Account stores only an Argon2id hash of this secret.
              </p>
            </div>
          )}

          {/* New Client Form Modal */}
          {showNewClientModal && (
            <form onSubmit={handleRegisterClient} className="p-6 bg-slate-900 border border-indigo-900/50 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white">Register Third-Party Application</h4>
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Application Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme CRM Portal"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Customer Relationship Management SSO"
                    value={newClientDesc}
                    onChange={(e) => setNewClientDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-400">Redirect URIs (comma-separated, exact match)</label>
                <input
                  type="text"
                  placeholder="https://app.example.com/oauth/callback, http://localhost:3000/callback"
                  value={newClientRedirects}
                  onChange={(e) => setNewClientRedirects(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-slate-400">Allowed Scopes (space-separated)</label>
                <input
                  type="text"
                  placeholder="openid profile email identity business"
                  value={newClientScopes}
                  onChange={(e) => setNewClientScopes(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  {submitting ? 'Registering...' : 'Register Application'}
                </button>
              </div>
            </form>
          )}

          {/* Clients List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((c) => (
              <div
                key={c.id}
                className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{c.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500">ID: {c.clientId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {c.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <p className="text-[11px] text-slate-400 line-clamp-1">{c.description || 'No description'}</p>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Redirect URIs:</span>
                    <span className="font-mono text-[10px] text-slate-400 block truncate">
                      {c.redirectUris?.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Allowed Scopes:</span>
                    <span className="font-mono text-[10px] text-indigo-300">
                      {c.allowedScopes?.join(' ')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {c.activeUsersCount} user(s) authorized
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRotateSecret(c.clientId)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Rotate Secret
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
