'use client';

import React, { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { Mail, Search, Calendar, ChevronRight, Eye, Printer, X, ShieldCheck } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // Filter emails for this client or default client
  const clientEmails = useMemo(() => {
    const list = whmcsData?.emails || [];
    if (impersonate) {
      const matched = list.filter((e: any) => String(e.userid) === String(impersonate));
      if (matched.length > 0) return matched;
    }
    // If not impersonating or no specific match, show recent emails
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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
            <span>Email History ({clientEmails.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse a complete audit trail of all automated notices, invoices, and service emails sent to your account.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/clientarea"
            className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            &larr; Back to Client Area
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center max-w-sm shadow-sm text-xs">
        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search by subject or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        )}
      </div>

      {/* Email List Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Date Sent</th>
                <th className="py-3 px-4">Message Subject</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No email records found.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatEmailDate(e.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {e.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] truncate max-w-xs">
                      {e.recipient || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmail(e)}
                        className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1.5 rounded font-semibold text-xs transition-colors border border-slate-300 inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Message</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW EMAIL MESSAGE MODAL */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#1A4D80] text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <h3 className="font-bold text-sm truncate max-w-md">
                  {selectedEmail.subject}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 text-xs flex items-center space-x-1"
                  title="Print message"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-white/80 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Email Meta Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 text-xs space-y-1 shrink-0 text-slate-600">
              <div>
                <strong className="text-slate-800">Date:</strong> {formatEmailDate(selectedEmail.date)}
              </div>
              <div>
                <strong className="text-slate-800">To:</strong> {selectedEmail.recipient || 'Customer'}
              </div>
              <div>
                <strong className="text-slate-800">From:</strong> SoftCents Systems Ltd. &lt;billing@softcents.com&gt;
              </div>
            </div>

            {/* Email Body Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
              {selectedEmail.message && selectedEmail.message.includes('<') ? (
                <div
                  className="email-body-rendered prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.message }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                  {selectedEmail.message || 'No email body available.'}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ClientEmailsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Email History...</div>}>
        <EmailsContent />
      </Suspense>
    </div>
  );
}
