'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { useActiveClient } from '@/hooks/useActiveClient';
import {
  FileText,
  Search,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';

function formatWhmcsDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000')) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function QuotesContent() {
  const { clientId, client, impQuery, quotes, isLoaded } = useActiveClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [acceptedQuotes, setAcceptedQuotes] = useState<Record<string, boolean>>({});

  const filteredQuotes = quotes.filter((q: any) => {
    const matchesSearch =
      String(q.id).includes(searchTerm) ||
      (q.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage =
      stageFilter === 'ALL' || (q.stage || '').toUpperCase() === stageFilter.toUpperCase();
    return matchesSearch && matchesStage;
  });

  const handleAcceptQuote = (quoteId: string) => {
    setAcceptedQuotes((prev) => ({ ...prev, [quoteId]: true }));
    if (selectedQuote && String(selectedQuote.id) === String(quoteId)) {
      setSelectedQuote({ ...selectedQuote, stage: 'Accepted' });
    }
  };

  const getStageBadge = (stage: string, quoteId: string) => {
    const isNowAccepted = acceptedQuotes[quoteId];
    const displayStage = isNowAccepted ? 'Accepted' : stage || 'Draft';

    switch (displayStage.toLowerCase()) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
            Accepted
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 mr-1 text-blue-600" />
            Delivered
          </span>
        );
      case 'lost':
      case 'dead':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3 h-3 mr-1 text-red-600" />
            {displayStage}
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3 h-3 mr-1 text-slate-500" />
            {displayStage || 'Draft'}
          </span>
        );
    }
  };

  return (
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
            <span>My Quotes ({quotes.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official proposals and cost estimates tailored for your enterprise services.
          </p>
        </div>
        <div>
          <Link
            href={`/submitticket${impQuery}`}
            className="w-full sm:w-auto text-center bg-[#1A4D80] hover:bg-[#153e66] text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors inline-block"
          >
            Request New Quote
          </Link>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-xs">
        <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by quote # or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-slate-500 font-medium">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1A4D80]"
          >
            <option value="ALL">All Stages</option>
            <option value="DELIVERED">Delivered</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="DRAFT">Draft</option>
            <option value="LOST">Lost</option>
            <option value="DEAD">Dead</option>
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date Created</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-center">Stage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm text-slate-600">No quotes found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      There are currently no proposals or quotations matching your query.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#1A4D80]">
                      <button
                        onClick={() => setSelectedQuote(q)}
                        className="hover:underline flex items-center space-x-1"
                      >
                        <span>#{q.id}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-[260px] truncate">
                      {q.subject || 'Enterprise Quotation'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatWhmcsDate(q.datecreated)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatWhmcsDate(q.validuntil)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ৳{parseFloat(q.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStageBadge(q.stage, q.id)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedQuote(q)}
                        className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1.5 rounded text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-[#f8fafc] sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <div className="bg-[#1A4D80] text-white p-2 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Quote #{selectedQuote.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedQuote.subject || 'Enterprise Quotation'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Print / Save PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Quote Details</h4>
                  <div className="space-y-1 text-slate-600">
                    <p><span className="font-medium text-slate-700">Quote Date:</span> {formatWhmcsDate(selectedQuote.datecreated)}</p>
                    <p><span className="font-medium text-slate-700">Valid Until:</span> {formatWhmcsDate(selectedQuote.validuntil)}</p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Stage:</span>
                      {getStageBadge(selectedQuote.stage, selectedQuote.id)}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Quotation Recipient</h4>
                  <div className="space-y-1 text-slate-600">
                    <p className="font-bold text-slate-900">{selectedQuote.clientName || client?.name || 'Customer'}</p>
                    {selectedQuote.companyname && (
                      <p className="text-slate-700">{selectedQuote.companyname}</p>
                    )}
                    <p>{selectedQuote.email || client?.email || ''}</p>
                    <p>{selectedQuote.phonenumber || client?.phonenumber || ''}</p>
                    <p>{selectedQuote.address1 || client?.address1 || ''}, {selectedQuote.city || client?.city || ''}</p>
                  </div>
                </div>
              </div>

              {/* Proposal text if any */}
              {selectedQuote.proposal && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <span className="font-bold">Proposal Summary: </span>
                  {selectedQuote.proposal}
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Quoted Items</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Discount</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedQuote.items || []).length === 0 ? (
                        <tr>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {selectedQuote.subject || 'Enterprise Service Solution'}
                          </td>
                          <td className="py-3 px-3 text-center">1</td>
                          <td className="py-3 px-3 text-right">
                            ৳{parseFloat(selectedQuote.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right">0.00%</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            ৳{parseFloat(selectedQuote.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ) : (
                        (selectedQuote.items || []).map((item: any, idx: number) => {
                          const qty = parseFloat(item.quantity || 1);
                          const unitPrice = parseFloat(item.unitprice || 0);
                          const discount = parseFloat(item.discount || 0);
                          const lineTotal = (qty * unitPrice) * (1 - discount / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-medium text-slate-800">{item.description}</td>
                              <td className="py-3 px-3 text-center">{item.quantity}</td>
                              <td className="py-3 px-3 text-right">
                                ৳{unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {discount > 0 ? `${discount}%` : '-'}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-slate-900">
                                ৳{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>৳{parseFloat(selectedQuote.subtotal || selectedQuote.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (0%):</span>
                    <span>৳0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                    <span>Total Due:</span>
                    <span className="text-[#1A4D80]">
                      ৳{parseFloat(selectedQuote.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-[#f8fafc] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                This quote is binding according to SoftCents Systems terms of service.
              </span>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
                {((selectedQuote.stage || '').toLowerCase() === 'delivered' || (selectedQuote.stage || '').toLowerCase() === 'draft') && !acceptedQuotes[selectedQuote.id] && (
                  <button
                    onClick={() => handleAcceptQuote(selectedQuote.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-[#28a745] hover:bg-[#218838] text-white rounded text-xs font-bold transition-colors inline-flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Accept Quote</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ClientQuotesPage() {
  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Quotes...</div>}>
        <QuotesContent />
      </Suspense>
    </div>
  );
}
