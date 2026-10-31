'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SupportDashboardPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadTickets = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/support/tickets', {}, accessToken);
      if (res.ok && Array.isArray(res.data)) {
        setTickets(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EMAIL_CHANGE':
        return <Mail className="w-4 h-4 text-violet-400" />;
      case 'IDENTITY_VERIFICATION':
        return <ShieldCheck className="w-4 h-4 text-blue-400" />;
      case 'BUSINESS_VERIFICATION':
        return <Building className="w-4 h-4 text-emerald-400" />;
      case 'ACCOUNT_SECURITY':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
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

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ACTIVE') return t.status !== 'CLOSED' && t.status !== 'REJECTED';
    if (statusFilter === 'CLOSED') return t.status === 'CLOSED';
    return true;
  });

  if (isLoading || loading) {
    return <div className="p-12 text-center text-slate-400">Loading support portal...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <LifeBuoy className="w-7 h-7 text-indigo-400" />
            <span>Support & Help Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit inquiries, request credential changes, and track compliance review tickets.
          </p>
        </div>

        <Link
          href="/support/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`pb-3 border-b-2 transition-colors ${
            statusFilter === 'ALL'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          All Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`pb-3 border-b-2 transition-colors ${
            statusFilter === 'ACTIVE'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Active / In Progress ({tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'REJECTED').length})
        </button>
        <button
          onClick={() => setStatusFilter('CLOSED')}
          className={`pb-3 border-b-2 transition-colors ${
            statusFilter === 'CLOSED'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Resolved / Closed ({tickets.filter((t) => t.status === 'CLOSED').length})
        </button>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No tickets found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You do not have any {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} support tickets. Need help or have an inquiry?
          </p>
          <Link
            href="/support/new"
            className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Create your first ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="block p-5 bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all shadow-sm group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getCategoryIcon(ticket.category)}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {ticket.subject}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 pl-8">
                    {ticket.description}
                  </p>
                </div>

                <div className="flex items-center space-x-4 pl-8 sm:pl-0">
                  {getStatusBadge(ticket.status)}

                  <div className="text-right text-[11px] text-slate-500 whitespace-nowrap hidden md:block">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 justify-end mt-0.5">
                      <span className="flex items-center space-x-0.5">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>{ticket.messageCount}</span>
                      </span>
                      {ticket.attachmentCount > 0 && (
                        <span className="flex items-center space-x-0.5 text-indigo-400">
                          <Paperclip className="w-3 h-3" />
                          <span>{ticket.attachmentCount}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
