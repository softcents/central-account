'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  LifeBuoy,
  Send,
  Paperclip,
  User,
  Shield,
  Clock,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Upload,
} from 'lucide-react';
import { apiFetch, API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadTicket = async () => {
    if (!accessToken || !ticketId) return;
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/support/tickets/${ticketId}`, {}, accessToken);
      if (res.ok && res.data) {
        setTicket(res.data);
      } else {
        setError('Failed to load support ticket');
      }
    } catch {
      setError('An error occurred loading ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, ticketId]);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (ticket?.messages?.length > 0) {
      scrollToBottom();
    }
  }, [ticket?.messages]);

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

      if (res.ok) {
        setReplyText('');
        setReplyAttachments([]);
        await loadTicket();
      } else {
        setError(res.data?.message || 'Failed to send reply');
      }
    } catch {
      setError('Error posting reply');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800">Open</span>;
      case 'IN_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">In Review</span>;
      case 'WAITING_FOR_USER':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-950 text-violet-400 border border-violet-800">Waiting for You</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">Approved</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">Rejected</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const downloadAttachment = async (attachmentId: string, fileName: string) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_URL}/support/tickets/${ticketId}/attachments/${attachmentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Could not download private attachment.');
    }
  };

  if (isLoading || loading) {
    return <div className="p-12 text-center text-slate-400">Loading conversation thread...</div>;
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Ticket not found</h2>
        <Link href="/support" className="inline-block text-xs font-semibold text-indigo-400 hover:underline">
          Return to support dashboard
        </Link>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/support"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </Link>

        <button
          onClick={loadTicket}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh thread"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Ticket Overview Card */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-500">#{ticket.id.slice(0, 8)}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                {ticket.category}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white mt-1">{ticket.subject}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">
              Priority: <strong className="text-white">{ticket.priority}</strong>
            </span>
            {getStatusBadge(ticket.status)}
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{ticket.description}</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Thread Messages */}
      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Conversation History ({ticket.messages?.length || 0})
        </h3>

        <div className="space-y-4">
          {ticket.messages?.map((msg: any) => {
            const isAdmin = msg.sender_type === 'ADMIN';
            const isSystem = msg.sender_type === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={msg.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 text-center text-xs text-amber-300/90 font-mono">
                  {msg.message}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isAdmin
                    ? 'bg-slate-900/90 border-indigo-900/50 shadow-md shadow-indigo-950/20 mr-4 sm:mr-12'
                    : 'bg-slate-950/80 border-slate-800 ml-4 sm:ml-12'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5 mb-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isAdmin ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-bold text-white">
                      {isAdmin ? 'Central Compliance Support' : 'You'}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-semibold border border-indigo-800">
                        Staff
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                {/* Attachments inside this message */}
                {msg.attachments?.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-slate-800/60 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block">Attached files:</span>
                    <div className="flex flex-wrap gap-2">
                      {msg.attachments.map((att: any) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => downloadAttachment(att.id, att.file_name)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-indigo-300 transition-colors cursor-pointer"
                        >
                          <Paperclip className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[150px]">{att.file_name}</span>
                          <Download className="w-3 h-3 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>
      </div>

      {/* Reply Box */}
      {isClosed ? (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-semibold text-white">This ticket has been resolved and closed</h4>
          <p className="text-xs text-slate-400">
            If you need further assistance with a different matter, please open a new support ticket.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendReply} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Post Reply
          </label>
          <textarea
            rows={3}
            placeholder="Type your reply here..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
          />

          {/* Pending attachments for reply */}
          {replyAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {replyAttachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-300"
                >
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span className="truncate max-w-[140px]">{att.fileName}</span>
                  <button
                    type="button"
                    onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-rose-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Attach files"
              />
              <button
                type="button"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach Files</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending...' : 'Send Reply'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
