'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  Plus,
  ChevronRight,
  Send,
  MessageSquare,
  Clock,
  User,
  Tag,
  Paperclip,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function SupportTicketsPage() {
  const { token, admin } = useAdminAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'reply' | 'note'>('reply');
  const [replyMessage, setReplyMessage] = useState('');

  const sampleTickets = [
    {
      id: '29',
      tid: 'TID-492104',
      dept: 'Technical Support',
      subject: 'rDNS and PTR record setup request for VPS IP 138.252.125.207',
      client: 'Raju Ahmed',
      clientId: 'c1',
      status: 'Open',
      priority: 'High',
      lastReply: '2026-11-19 22:15',
    },
    {
      id: '28',
      tid: 'TID-492103',
      dept: 'Billing & Accounts',
      subject: 'Bank transfer payment receipt attached for invoice #462',
      client: 'Tanvir Hasan',
      clientId: 'c3',
      status: 'Customer-Reply',
      priority: 'Medium',
      lastReply: '2026-11-19 18:30',
    },
    {
      id: '27',
      tid: 'TID-492102',
      dept: 'Domain Registrations',
      subject: 'EPP Auth Code for outbound transfer confirmation',
      client: 'SoftCents Host',
      clientId: 'c2',
      status: 'Answered',
      priority: 'Low',
      lastReply: '2026-11-18 14:10',
    },
    {
      id: '26',
      tid: 'TID-492101',
      dept: 'Technical Support',
      subject: 'SSL Certificate issuance verification delay',
      client: 'Abir Chowdhury',
      clientId: 'c4',
      status: 'Closed',
      priority: 'Medium',
      lastReply: '2026-11-17 09:20',
    },
  ];

  useEffect(() => {
    setTickets(sampleTickets);
  }, []);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status.toUpperCase() !== statusFilter) return false;
    return true;
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    alert(`Reply sent to client on ${selectedTicket.tid}!`);
    setReplyMessage('');
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Support Tickets</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/tickets.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Support Tickets</h1>
            <p className="text-xs text-slate-500">
              Manage client inquiries, technical investigations, predefined canned replies, and escalations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            href="/admin/support/predefined-replies"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium border border-slate-300 shadow-sm"
          >
            <img src="/whmcs/icons/ticketspredefined.png" className="w-3.5 h-3.5" alt="" />
            <span>Predefined Replies</span>
          </Link>
          <Link
            href="/admin/support/open"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm"
          >
            <img src="/whmcs/icons/ticketsopen.png" className="w-3.5 h-3.5" alt="" />
            <span>Open New Ticket</span>
          </Link>
        </div>
      </div>

      {/* WHMCS Ticket Status Filter Strip */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        {[
          { id: 'ALL', label: 'All Tickets', count: 29, color: 'bg-slate-700 text-white' },
          { id: 'OPEN', label: 'Open', count: 1, color: 'bg-rose-600 text-white' },
          { id: 'CUSTOMER-REPLY', label: 'Customer-Reply', count: 1, color: 'bg-amber-600 text-white' },
          { id: 'ANSWERED', label: 'Answered', count: 8, color: 'bg-emerald-600 text-white' },
          { id: 'CLOSED', label: 'Closed', count: 19, color: 'bg-slate-500 text-white' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded transition-all flex items-center space-x-1.5 ${
              statusFilter === tab.id
                ? `${tab.color} shadow-sm font-bold`
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === tab.id ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main View: Table + Ticket Conversation Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tickets Table (Left 7 or 12 cols) */}
        <div className={selectedTicket ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Submitter</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3 text-right">Last Reply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t, idx) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`cursor-pointer hover:bg-[#f0f4f8] transition-colors ${
                      selectedTicket?.id === t.id
                        ? 'bg-blue-50/70 border-l-4 border-l-[#1A4D80]'
                        : idx % 2 === 1
                        ? 'bg-[#fbfcfd]'
                        : 'bg-white'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">
                      #{t.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.dept}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{t.subject}</td>
                    <td className="py-2.5 px-3 text-slate-700">{t.client}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'Open'
                            ? 'bg-rose-100 text-rose-800'
                            : t.status === 'Customer-Reply'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'Answered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          t.priority === 'High'
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : t.priority === 'Medium'
                            ? 'text-blue-700 bg-blue-50 border border-blue-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 whitespace-nowrap">
                      {t.lastReply}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Ticket Thread & Reply Box (Right 6 cols) */}
        {selectedTicket && (
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded shadow-sm flex flex-col h-[750px] overflow-hidden">
            {/* Header */}
            <div className="bg-[#1A4D80] text-white p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">
                  #{selectedTicket.id} - {selectedTicket.subject}
                </div>
                <div className="text-[11px] text-white/80">
                  Client: {selectedTicket.client} | Dept: {selectedTicket.dept}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 bg-white/10 rounded"
              >
                &times; Close
              </button>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f6f6f6] text-xs">
              {/* Client initial message */}
              <div className="bg-white p-3 rounded border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 pb-1 border-b">
                  <span className="font-bold text-[#1A4D80]">{selectedTicket.client} (Client)</span>
                  <span>{selectedTicket.lastReply}</span>
                </div>
                <p className="text-slate-800 leading-relaxed pt-1">
                  Hello, please update the reverse DNS (PTR) for our primary mail server IP. The desired hostname is mail.domain.com. Thank you!
                </p>
              </div>

              {/* Staff response placeholder */}
              <div className="bg-blue-50/70 p-3 rounded border border-blue-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-blue-200">
                  <span className="font-bold text-slate-900">Support Staff (raju)</span>
                  <span>2026-11-19 22:20</span>
                </div>
                <p className="text-slate-800 leading-relaxed pt-1">
                  Dear Client, we have submitted the PTR delegation to our network uplink. It typically propagates within 1 to 2 hours.
                </p>
              </div>
            </div>

            {/* Reply / Note Tabs */}
            <div className="border-t border-slate-200 bg-white p-3">
              <div className="flex items-center space-x-2 text-xs mb-2">
                <button
                  onClick={() => setActiveTab('reply')}
                  className={`px-3 py-1 rounded font-bold ${
                    activeTab === 'reply'
                      ? 'bg-[#1A4D80] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Reply to Client
                </button>
                <button
                  onClick={() => setActiveTab('note')}
                  className={`px-3 py-1 rounded font-bold ${
                    activeTab === 'note'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Add Internal Staff Note
                </button>
              </div>

              <form onSubmit={handleReply} className="space-y-2">
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={
                    activeTab === 'reply'
                      ? 'Type response to client...'
                      : 'Type internal staff note (never visible to client)...'
                  }
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
                />
                <div className="flex items-center justify-between">
                  <select className="p-1 border border-slate-300 rounded text-xs bg-white">
                    <option value="keep">Keep Current Status</option>
                    <option value="answered">Set Answered</option>
                    <option value="closed">Close Ticket</option>
                  </select>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1.5 rounded font-bold text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send {activeTab === 'reply' ? 'Reply' : 'Note'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
