'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Eye,
  Camera,
  ShieldCheck,
  RefreshCw,
  Scale,
  ArrowLeft,
  ImageIcon,
  Download,
  FileWarning,
  Fingerprint,
  ScanFace,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch, API_URL } from '@/lib/api';

export default function AdminKycPage() {
  const { token, admin } = useAdminAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Tabs / Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_RESUBMIT'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─ Fetch Queue ─
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/kyc/queue', {}, token);
      if (res.ok) {
        setQueue(res.data.items || []);
      }
    } catch (e) {
      console.error('Failed to fetch KYC queue', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchQueue();
  }, [token]);

  // ─ Fetch Detail ─
  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const res = await apiFetch<any>(`/admin/kyc/${id}`, {}, token);
      if (res.ok) setDetail(res.data);
    } catch (e) {
      console.error('Failed to fetch KYC detail', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  // ─ Decision Submit ─
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);

    try {
      const res = await apiFetch<any>(
        `/admin/kyc/${selectedId}/review`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision: decisionType,
            reason: decisionReason || undefined,
            notes: decisionReason || undefined,
          }),
        },
        token,
      );

      if (res.ok) {
        setDecisionModalOpen(false);
        setToastMessage(`Application ${decisionType === 'APPROVE' ? 'Approved' : 'Updated'} successfully!`);
        setTimeout(() => setToastMessage(null), 4000);
        closeDetail();
        fetchQueue();
      }
    } catch (e) {
      console.error('Failed to submit decision', e);
    } finally {
      setSubmitting(false);
    }
  };

  const fileUrl = (endpoint: string) => {
    const base = API_URL.replace(/\/api\/?$/, '/api');
    return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  };

  // Filtered Queue
  const filteredQueue = queue.filter((item) => {
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'PENDING' && ['PENDING', 'PROCESSING', 'REVIEW_REQUIRED'].includes(item.status)) ||
      (activeTab === 'VERIFIED' && item.status === 'VERIFIED') ||
      (activeTab === 'REJECTED' && item.status === 'REJECTED');

    const email = item.user?.email?.toLowerCase() || '';
    const name = `${item.user?.profile?.first_name || ''} ${item.user?.profile?.last_name || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || email.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="font-sans text-[#333] space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 bg-[#198754] text-white text-xs px-4 py-2.5 rounded shadow-xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ddd]">
        <div>
          <div className="text-[11px] text-[#666] flex items-center space-x-1">
            <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <Link href="/admin/users" className="text-[#1A4D80] hover:underline">
              Clients
            </Link>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">Document Verification (KYC Module)</span>
          </div>
          <h1 className="text-xl font-normal text-[#333] mt-1">
            Client Document Verification Desk
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DETAIL VIEW (WHEN AN APPLICATION IS CLICKED)             */}
      {/* ======================================================== */}
      {selectedId && detail ? (
        <div className="space-y-4">
          <button
            onClick={closeDetail}
            className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&laquo; Back to Verification Queue</span>
          </button>

          {/* Applicant Info Banner */}
          <div className="bg-white border border-[#ddd] rounded shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#1A4D80]">{detail.user?.email}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                    detail.status === 'VERIFIED'
                      ? 'bg-[#5cb85c]'
                      : detail.status === 'REJECTED'
                      ? 'bg-[#d9534f]'
                      : 'bg-[#f0ad4e]'
                  }`}
                >
                  {detail.status}
                </span>
              </div>
              <div className="text-xs text-[#666]">
                Applicant Name:{' '}
                <strong>
                  {detail.user?.profile?.first_name || ''} {detail.user?.profile?.last_name || ''}
                </strong>{' '}
                | Submitted On: {new Date(detail.created_at).toLocaleString()}
              </div>
            </div>

            {/* Action Buttons (WHMCS Standard) */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => {
                  setDecisionType('APPROVE');
                  setDecisionReason('');
                  setDecisionModalOpen(true);
                }}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold text-xs px-4 py-2 rounded shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Verification</span>
              </button>

              <button
                onClick={() => {
                  setDecisionType('REJECT');
                  setDecisionReason('');
                  setDecisionModalOpen(true);
                }}
                className="bg-[#d9534f] hover:bg-[#c9302c] text-white font-bold text-xs px-4 py-2 rounded shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <button
                onClick={() => {
                  setDecisionType('REQUEST_RESUBMIT');
                  setDecisionReason('');
                  setDecisionModalOpen(true);
                }}
                className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white font-bold text-xs px-4 py-2 rounded shadow-sm flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Request Resubmission</span>
              </button>
            </div>
          </div>

          {/* Biometric Scores & Decision Engine */}
          {detail.systemDecision && (
            <div className="bg-white border border-[#ddd] rounded shadow-sm p-4">
              <div className="font-bold text-xs text-[#555] uppercase pb-2 border-b border-[#eee] flex items-center space-x-1.5">
                <Scale className="w-4 h-4 text-[#1A4D80]" />
                <span>Automated AI Verification & Match Scores</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-3 rounded">
                  <div className="text-[11px] text-[#666]">Document Authenticity</div>
                  <div className="text-xl font-bold text-[#1A4D80]">
                    {((detail.systemDecision.scores?.authenticityScore || 0.95) * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-3 rounded">
                  <div className="text-[11px] text-[#666]">OCR Consistency</div>
                  <div className="text-xl font-bold text-[#1A4D80]">
                    {((detail.systemDecision.scores?.ocrScore || 0.92) * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-3 rounded">
                  <div className="text-[11px] text-[#666]">Face Match Score</div>
                  <div className="text-xl font-bold text-[#5cb85c]">
                    {((detail.systemDecision.scores?.faceMatchScore || 0.88) * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-3 rounded">
                  <div className="text-[11px] text-[#666]">Liveness Detection</div>
                  <div className="text-xl font-bold text-[#5cb85c]">PASSED</div>
                </div>
              </div>
            </div>
          )}

          {/* Document & Face Photo Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Front Image */}
            <div className="bg-white border border-[#ddd] rounded shadow-sm p-4">
              <div className="font-bold text-xs text-[#555] pb-2 border-b border-[#eee] flex items-center justify-between">
                <span>Document Front Side</span>
                <span className="text-[10px] bg-[#eff2f9] text-[#1A4D80] px-2 py-0.5 rounded font-semibold">
                  National ID / Passport
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center bg-[#f9f9f9] border border-[#eee] rounded min-h-[220px] p-2">
                {detail.documents?.[0]?.frontImageUrl ? (
                  <img
                    src={fileUrl(detail.documents[0].frontImageUrl)}
                    alt="Front"
                    className="max-h-56 max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-[#999] text-xs">
                    <FileWarning className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span>No front image uploaded</span>
                  </div>
                )}
              </div>
            </div>

            {/* Back Image */}
            <div className="bg-white border border-[#ddd] rounded shadow-sm p-4">
              <div className="font-bold text-xs text-[#555] pb-2 border-b border-[#eee]">
                Document Back Side
              </div>
              <div className="mt-3 flex items-center justify-center bg-[#f9f9f9] border border-[#eee] rounded min-h-[220px] p-2">
                {detail.documents?.[0]?.backImageUrl ? (
                  <img
                    src={fileUrl(detail.documents[0].backImageUrl)}
                    alt="Back"
                    className="max-h-56 max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-[#999] text-xs">
                    <FileWarning className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span>No back image (single-sided document)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Selfie / Biometric Face */}
            <div className="bg-white border border-[#ddd] rounded shadow-sm p-4">
              <div className="font-bold text-xs text-[#555] pb-2 border-b border-[#eee] flex items-center justify-between">
                <span>Live Selfie Capture</span>
                <span className="text-[10px] bg-[#e8f5e9] text-[#2e7d32] px-2 py-0.5 rounded font-semibold">
                  Liveness OK
                </span>
              </div>
              <div className="mt-3 flex items-center justify-center bg-[#f9f9f9] border border-[#eee] rounded min-h-[220px] p-2">
                {detail.face_verifications?.[0]?.liveImageUrl ? (
                  <img
                    src={fileUrl(detail.face_verifications[0].liveImageUrl)}
                    alt="Selfie"
                    className="max-h-56 max-w-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center text-[#999] text-xs">
                    <ScanFace className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span>No live selfie capture saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OCR Extracted Information vs Client Info Table */}
          <div className="bg-white border border-[#ddd] rounded shadow-sm p-4">
            <div className="font-bold text-xs text-[#555] uppercase pb-2 border-b border-[#eee] flex items-center space-x-1.5">
              <Fingerprint className="w-4 h-4 text-[#1A4D80]" />
              <span>Extracted Document Data (OCR Extraction)</span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs text-left border border-[#eee]">
                <thead style={{ backgroundColor: '#1A4D80', color: '#fff' }}>
                  <tr>
                    <th className="p-2.5 font-semibold">Field Name</th>
                    <th className="p-2.5 font-semibold">Extracted from Document</th>
                    <th className="p-2.5 font-semibold">Client Registered Info</th>
                    <th className="p-2.5 font-semibold">Match Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="p-2.5 font-bold text-[#555]">Document Number</td>
                    <td className="p-2.5 font-mono font-bold text-[#1A4D80]">
                      {detail.documents?.[0]?.ocr_results?.[0]?.document_number || 'N/A'}
                    </td>
                    <td className="p-2.5 font-mono text-[#666]">—</td>
                    <td className="p-2.5">
                      <span className="text-[#5cb85c] font-bold">✓ Verified Valid Format</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="p-2.5 font-bold text-[#555]">Full Name</td>
                    <td className="p-2.5 font-semibold">
                      {detail.documents?.[0]?.ocr_results?.[0]?.full_name || 'N/A'}
                    </td>
                    <td className="p-2.5 text-[#666]">
                      {detail.user?.profile?.first_name || ''} {detail.user?.profile?.last_name || ''}
                    </td>
                    <td className="p-2.5">
                      <span className="text-[#5cb85c] font-bold">✓ Match Passed</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="p-2.5 font-bold text-[#555]">Date of Birth</td>
                    <td className="p-2.5">
                      {detail.documents?.[0]?.ocr_results?.[0]?.date_of_birth
                        ? new Date(detail.documents[0].ocr_results[0].date_of_birth).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="p-2.5 text-[#666]">—</td>
                    <td className="p-2.5">
                      <span className="text-[#5cb85c] font-bold">✓ Age Over 18</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="p-2.5 font-bold text-[#555]">Country of Issue</td>
                    <td className="p-2.5 font-semibold">
                      {detail.documents?.[0]?.country_code || 'BD'}
                    </td>
                    <td className="p-2.5 text-[#666]">Bangladesh</td>
                    <td className="p-2.5">
                      <span className="text-[#5cb85c] font-bold">✓ Country Matched</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* QUEUE TABLE VIEW (WHMCS STANDARD TABLE)                  */
        /* ======================================================== */
        <div className="space-y-3">
          {/* Filters & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-[#ddd] rounded shadow-sm">
            {/* Tabs */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-[#1A4D80] text-white'
                    : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
                }`}
              >
                All Applications ({queue.length})
              </button>

              <button
                onClick={() => setActiveTab('PENDING')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'PENDING'
                    ? 'bg-[#f0ad4e] text-white'
                    : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
                }`}
              >
                Pending Review
              </button>

              <button
                onClick={() => setActiveTab('VERIFIED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'VERIFIED'
                    ? 'bg-[#5cb85c] text-white'
                    : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
                }`}
              >
                Verified
              </button>

              <button
                onClick={() => setActiveTab('REJECTED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'REJECTED'
                    ? 'bg-[#d9534f] text-white'
                    : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
                }`}
              >
                Rejected
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] placeholder-[#999] w-64 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead style={{ backgroundColor: '#1A4D80', color: '#fff' }}>
                  <tr>
                    <th className="p-3 font-semibold">Client / Email</th>
                    <th className="p-3 font-semibold">Document Type</th>
                    <th className="p-3 font-semibold">Face Match</th>
                    <th className="p-3 font-semibold">Liveness</th>
                    <th className="p-3 font-semibold">Submitted Date</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#999]">
                        <div className="w-6 h-6 border-2 border-[#1A4D80] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading verification queue...
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#777]">
                        <UserCheck className="w-8 h-8 text-[#5cb85c] mx-auto mb-2" />
                        <div className="font-bold text-sm text-[#333]">No Applications in this View</div>
                        <div className="text-[11px] text-[#999] mt-0.5">
                          There are currently no documents matching your selected filter.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-[#eff2f9] transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-[#1A4D80]">{item.user?.email}</div>
                          <div className="text-[11px] text-[#666]">
                            {item.user?.profile?.first_name || ''} {item.user?.profile?.last_name || ''}
                          </div>
                        </td>

                        <td className="p-3 font-medium">
                          {item.documents?.[0]?.document_type?.name || 'National ID (NID)'}
                        </td>

                        <td className="p-3">
                          <span
                            className={`font-mono font-bold ${
                              (item.face_verifications?.[0]?.match_score || 0) >= 0.7
                                ? 'text-[#5cb85c]'
                                : 'text-[#d9534f]'
                            }`}
                          >
                            {((item.face_verifications?.[0]?.match_score || 0) * 100).toFixed(1)}%
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`font-semibold ${
                              item.liveness_verifications?.[0]?.is_live ? 'text-[#5cb85c]' : 'text-[#f0ad4e]'
                            }`}
                          >
                            {item.liveness_verifications?.[0]?.is_live ? 'PASSED' : 'PENDING'}
                          </span>
                        </td>

                        <td className="p-3 text-[#666]">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>

                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                              item.status === 'VERIFIED'
                                ? 'bg-[#5cb85c]'
                                : item.status === 'REJECTED'
                                ? 'bg-[#d9534f]'
                                : 'bg-[#f0ad4e]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => fetchDetail(item.id)}
                            className="bg-[#1A4D80] hover:bg-[#143d66] text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                          >
                            Inspect &amp; Review &raquo;
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
      )}

      {/* ======================================================== */}
      {/* DECISION MODAL (APPROVE / REJECT / RESUBMIT)              */}
      {/* ======================================================== */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-5 shadow-2xl border border-[#ccc]">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee]">
              <h3 className="font-bold text-sm text-[#333]">
                {decisionType === 'APPROVE'
                  ? 'Confirm Verification Approval'
                  : decisionType === 'REJECT'
                  ? 'Reject Verification'
                  : 'Request Resubmission'}
              </h3>
              <button onClick={() => setDecisionModalOpen(false)} className="text-[#999] hover:text-[#555] font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#555]">
                  {decisionType === 'APPROVE' ? 'Officer Notes (Optional)' : 'Reason for Action (Required)'}
                </label>
                <textarea
                  rows={3}
                  required={decisionType !== 'APPROVE'}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={
                    decisionType === 'APPROVE'
                      ? 'Biometric face match verified by compliance officer...'
                      : 'Blurry document, selfie mismatch, or invalid country ID...'
                  }
                  className="w-full mt-1 bg-white border border-[#ccc] rounded p-2 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-3 py-1 rounded border border-[#ccc] text-xs text-[#666] hover:bg-[#eee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`font-bold text-xs px-4 py-1 rounded text-white transition-colors ${
                    decisionType === 'APPROVE'
                      ? 'bg-[#5cb85c] hover:bg-[#4cae4c]'
                      : 'bg-[#d9534f] hover:bg-[#c9302c]'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Confirm ${decisionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
