'use client';

import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  RefreshCw,
  User,
  Shield,
  Tag,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminSupportPage() {
  const { token, admin } = useAdminAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/support/tickets', {}, token);
      if (res.ok) {
        setTickets(res.data.tickets || []);
      }
    } catch (e) {
      console.error('Failed to load support tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
    }
  }, [token]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch<any>(`/admin/support/tickets/${ticketId}`, {}, token);
      if (res.ok) {
        setSelectedTicket(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch ticket detail', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;
    setSendingReply(true);

    try {
      const res = await apiFetch<any>(
        `/admin/support/tickets/${selectedTicket.id}/reply`,
        {
          method: 'POST',
          body: JSON.stringify({ content: replyContent }),
        },
        token,
      );

      if (res.ok) {
        setReplyContent('');
        openTicketDetail(selectedTicket.id);
        fetchTickets();
      }
    } catch (e) {
      console.error('Failed to send admin reply', e);
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Support Ticket Management Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Resolve user identity verification tickets, email change disputes, and platform inquiries.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tickets List */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 font-semibold text-xs text-white">
            Open Tickets ({tickets.length})
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[650px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading support tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No support tickets found.</div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => openTicketDetail(t.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/30 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-xs text-white truncate">{t.subject}</div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 truncate">{t.user?.email}</div>

                    <div className="flex items-center space-x-2 mt-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-indigo-400 font-medium">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{t.category}</span>
                      </span>

                      <span className="text-[10px] text-slate-500 font-medium">
                        {t._count?.messages || 0} messages
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Ticket Detail & Chat View */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
          {detailLoading ? (
            <div className="m-auto text-center text-slate-500 text-xs py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading ticket conversation...
            </div>
          ) : selectedTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{selectedTicket.subject}</h2>
                    <div className="text-xs text-slate-400 mt-0.5">
                      From: <span className="text-indigo-400 font-medium">{selectedTicket.user?.email}</span> &bull; Category: {selectedTicket.category}
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shrink-0">
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[380px]">
                {selectedTicket.messages?.map((m: any) => {
                  const isAdmin = m.sender_type === 'ADMIN';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1">
                        {isAdmin ? (
                          <>
                            <Shield className="w-3 h-3 text-indigo-400" />
                            <span className="font-semibold text-indigo-400">Admin Agent</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{selectedTicket.user?.email}</span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none'
                            : 'bg-slate-800/90 border border-slate-700/60 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Admin Reply Form */}
              <form onSubmit={handleReplySubmit} className="p-4 border-t border-slate-800/80 bg-slate-950/60">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type administrative reply to user..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyContent.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="m-auto text-center text-slate-500 text-xs py-16">
              <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              Select a support ticket from the list to view and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
