'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
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
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch, API_URL } from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    VERIFIED: { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
    REJECTED: { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-500/30', icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
    REVIEW_REQUIRED: { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-500/30', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    PROCESSING: { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-500/30', icon: <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" /> },
    PENDING: { bg: 'bg-slate-800/60', text: 'text-slate-300', border: 'border-slate-600/30', icon: <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> },
    EXPIRED: { bg: 'bg-orange-950/40', text: 'text-orange-300', border: 'border-orange-500/30', icon: <FileWarning className="w-3.5 h-3.5 text-orange-400" /> },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full ${s.bg} border ${s.border} ${s.text} text-xs font-medium`}>
      {s.icon}
      <span>{status}</span>
    </span>
  );
}

function scoreBar(label: string, value: number, thresholdGood = 0.7) {
  const pct = Math.min(Math.round(value * 100), 100);
  const color = value >= thresholdGood ? 'bg-emerald-500' : value >= 0.5 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-bold text-slate-200">{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function AdminKycPage() {
  const { token } = useAdminAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_RESUBMIT'>('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedScores, setExpandedScores] = useState(true);

  // ─ Queue ─
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/kyc/queue', {}, token);
      if (res.ok) setQueue(res.data.items || []);
    } catch (e) {
      console.error('Failed to fetch KYC queue', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchQueue();
  }, [token]);

  // ─ Detail ─
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

  // ─ Decision ─
  const openDecisionModal = (type: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMIT') => {
    setDecisionType(type);
    setDecisionReason('');
    setDecisionModalOpen(true);
  };

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
        closeDetail();
        fetchQueue();
      }
    } catch (e) {
      console.error('Failed to submit KYC decision', e);
    } finally {
      setSubmitting(false);
    }
  };

  /** Build the full URL for admin-only file endpoints */
  const fileUrl = (endpoint: string) => {
    const base = API_URL.replace(/\/api\/?$/, '/api');
    return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  };

  // ─── Detail View ──────────────────────────────────────────────────
  if (selectedId) {
    if (detailLoading || !detail) {
      return (
        <div className="space-y-6">
          <button onClick={closeDetail} className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </button>
          <div className="p-16 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading verification details...
          </div>
        </div>
      );
    }

    const doc = detail.documents?.[0];
    const ocr = doc?.ocr_results?.[0];
    const face = detail.face_verifications?.[0];
    const liveness = detail.liveness_verifications?.[0];
    const sd = detail.systemDecision;

    return (
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button onClick={closeDetail} className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Queue</span>
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">KYC Verification Detail</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Applicant: <span className="text-indigo-400 font-semibold">{detail.user?.email}</span>
              {detail.user?.profile && (
                <span className="text-slate-500"> — {detail.user.profile.first_name} {detail.user.profile.last_name}</span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {statusBadge(detail.status)}
          </div>
        </div>

        {/* ── System Decision Card ── */}
        {sd && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800 backdrop-blur-sm">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedScores(!expandedScores)}
            >
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white">System Decision Engine</h2>
              </div>
              <div className="flex items-center space-x-3">
                {statusBadge(sd.decision)}
                {expandedScores ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </div>

            {expandedScores && (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-400 italic">{sd.summary}</p>

                {/* Scores Breakdown */}
                {sd.scores && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
                      {scoreBar('Document Authenticity', sd.scores.authenticityScore)}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
                      {scoreBar('OCR Consistency', sd.scores.ocrScore)}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
                      {scoreBar('Face Match', sd.scores.faceMatchScore)}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
                      {scoreBar('Liveness', sd.scores.livenessScore)}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2 sm:col-span-2 lg:col-span-1">
                      {scoreBar('Overall Weighted', sd.scores.overallWeightedScore, 0.65)}
                    </div>
                  </div>
                )}

                {/* Reviewer info if present */}
                {(sd.reviewedBy || sd.reviewerNotes) && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 text-xs space-y-1">
                    {sd.reviewedBy && <div className="text-slate-400">Reviewed by: <span className="text-slate-200 font-semibold">{sd.reviewedBy}</span></div>}
                    {sd.reviewerNotes && <div className="text-slate-400">Notes: <span className="text-slate-200">{sd.reviewerNotes}</span></div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Document Files + OCR Data ── */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Uploaded Identity Document</h2>
            {doc?.document_type && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 uppercase tracking-wider">
                {doc.document_type.name || doc.document_type.code}
              </span>
            )}
          </div>

          {/* Document Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Front Image */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-3 h-3" />
                <span>Front Side</span>
              </div>
              {doc?.frontImageExists ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(doc.frontImageUrl)}
                    alt="ID Document - Front"
                    className="w-full h-auto max-h-72 object-contain rounded-xl"
                    crossOrigin="use-credentials"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="p-8 text-center text-slate-500 text-xs">Could not load image — it may be a PDF. Use the download button.</div>';
                      }
                    }}
                  />
                  <a
                    href={fileUrl(doc.frontImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open in new tab"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-800 bg-slate-950/50">
                  <FileWarning className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  Front image file not found on disk
                </div>
              )}
            </div>

            {/* Back Image */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ImageIcon className="w-3 h-3" />
                <span>Back Side</span>
              </div>
              {doc?.backImageUrl && doc?.backImageExists ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(doc.backImageUrl)}
                    alt="ID Document - Back"
                    className="w-full h-auto max-h-72 object-contain rounded-xl"
                    crossOrigin="use-credentials"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="p-8 text-center text-slate-500 text-xs">Could not load image — it may be a PDF. Use the download button.</div>';
                      }
                    }}
                  />
                  <a
                    href={fileUrl(doc.backImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open in new tab"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-800 bg-slate-950/50">
                  {doc?.backImageUrl ? (
                    <>
                      <FileWarning className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                      Back image file not found on disk
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                      No back side uploaded (single-sided document)
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* OCR Extracted Data */}
          {ocr && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-3">
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Extracted OCR Data</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Document Number</span>
                  <span className="text-slate-200 font-mono font-semibold">{ocr.document_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Full Name on ID</span>
                  <span className="text-slate-200 font-semibold">{ocr.full_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Date of Birth</span>
                  <span className="text-slate-200">
                    {ocr.date_of_birth ? new Date(ocr.date_of_birth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Country</span>
                  <span className="text-slate-200">{doc?.country_code || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Expiry Date</span>
                  <span className="text-slate-200">
                    {ocr.expiry_date ? new Date(ocr.expiry_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">OCR Confidence</span>
                  <span className="font-mono text-slate-200">{((ocr.confidence_score || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {ocr.raw_text && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase mb-1">Raw OCR Snippet</span>
                  <div className="p-2 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-400 line-clamp-4">
                    {ocr.raw_text}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Face Verification & Live Selfie ── */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2">
            <ScanFace className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Biometric Verification</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Portrait from ID */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-3 h-3" />
                <span>Portrait from ID Document</span>
              </div>
              {face?.portraitImageUrl && face?.portraitImageExists ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(face.portraitImageUrl)}
                    alt="Portrait from ID"
                    className="w-full h-auto max-h-64 object-contain rounded-xl"
                    crossOrigin="use-credentials"
                  />
                  <a
                    href={fileUrl(face.portraitImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open full size"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-800 bg-slate-950/50">
                  <Camera className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  {face?.portraitImageUrl ? 'Portrait file not found on disk' : 'No portrait image saved'}
                </div>
              )}
            </div>

            {/* Live Selfie */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ScanFace className="w-3 h-3" />
                <span>Live Selfie Capture</span>
              </div>
              {face?.liveImageUrl && face?.liveImageExists ? (
                <div className="relative group rounded-xl overflow-hidden border border-emerald-800/40 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl(face.liveImageUrl)}
                    alt="Live Selfie"
                    className="w-full h-auto max-h-64 object-contain rounded-xl"
                    crossOrigin="use-credentials"
                  />
                  <a
                    href={fileUrl(face.liveImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open full size"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-slate-800 bg-slate-950/50">
                  <ScanFace className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  {face?.liveImageUrl ? 'Live selfie file not found on disk' : 'No live selfie image saved'}
                </div>
              )}
            </div>
          </div>

          {/* Biometric Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Face Match Score</span>
                <span className={`font-mono font-bold ${(face?.match_score || 0) >= 0.7 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((face?.match_score || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                Match: <span className={face?.is_matched ? 'text-emerald-400' : 'text-rose-400'}>
                  {face?.is_matched ? 'YES' : 'NO'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Liveness</span>
                <span className={`font-semibold ${liveness?.is_live ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {liveness?.is_live ? 'LIVE' : 'PENDING'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                Passive: <span className="text-slate-300">{((liveness?.passive_liveness_score || 0) * 100).toFixed(1)}%</span>
                {' · '}
                Active: <span className={liveness?.is_active_passed ? 'text-emerald-400' : 'text-slate-400'}>
                  {liveness?.is_active_passed ? 'PASSED' : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Challenge Type</span>
                <span className="text-slate-200 font-mono">{liveness?.challenge_type || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Rejection Reasons ── */}
        {detail.rejection_reasons && detail.rejection_reasons.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Rejection Reasons</div>
            <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
              {detail.rejection_reasons.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Admin Actions ── */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => openDecisionModal('APPROVE')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve KYC</span>
          </button>

          <button
            onClick={() => openDecisionModal('REJECT')}
            className="px-5 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 flex items-center space-x-2 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject KYC</span>
          </button>

          <button
            onClick={() => openDecisionModal('REQUEST_RESUBMIT')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Request Re-submission</span>
          </button>
        </div>

        {/* ── Decision Modal ── */}
        {decisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white">
                {decisionType === 'APPROVE'
                  ? 'Confirm KYC Approval'
                  : decisionType === 'REJECT'
                  ? 'Reject KYC Application'
                  : 'Request Re-verification'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Applicant: <span className="text-indigo-400 font-semibold">{detail.user?.email}</span>
              </p>

              <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {decisionType === 'APPROVE' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                  </label>
                  <textarea
                    rows={3}
                    required={decisionType !== 'APPROVE'}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder={
                      decisionType === 'APPROVE'
                        ? 'Biometric face match verified by compliance officer...'
                        : 'Blurry document / selfie mismatch / invalid country ID...'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecisionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
                      decisionType === 'APPROVE'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    }`}
                  >
                    {submitting ? 'Submitting...' : `Submit ${decisionType}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Queue View ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Personal KYC Review Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manual inspection of national IDs, biometric ArcFace similarity, and fraud signals.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({queue.length})</span>
        </button>
      </div>

      {/* KYC Applications List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading pending verification applications...
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-900/60 border border-slate-800">
            <UserCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">KYC Review Queue is Clean</h3>
            <p className="text-xs text-slate-500 mt-1">All identity verifications have been processed or approved.</p>
          </div>
        ) : (
          queue.map((v) => {
            const doc = v.documents?.[0];
            const ocr = doc?.ocr_results?.[0];
            const face = v.face_verifications?.[0];
            const liveness = v.liveness_verifications?.[0];
            const latestResult = v.results?.[0];

            return (
              <div
                key={v.id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all backdrop-blur-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Applicant Information */}
                  <div className="space-y-4 max-w-sm">
                    <div>
                      <div className="text-sm font-bold text-white">{v.user?.email}</div>
                      <div className="text-xs text-slate-400">
                        {v.user?.profile?.first_name || v.user?.profile?.last_name
                          ? `${v.user?.profile?.first_name || ''} ${v.user?.profile?.last_name || ''}`
                          : 'No profile name'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Submitted: {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {statusBadge(v.status)}

                    {/* System Decision Badge (if available) */}
                    {latestResult && (
                      <div className="flex items-center space-x-2">
                        <Scale className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] text-slate-400">Engine:</span>
                        {statusBadge(latestResult.decision)}
                      </div>
                    )}

                    {/* Biometric Scores */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Face Match Score:</span>
                        <span
                          className={`font-mono font-bold ${
                            (face?.match_score || 0) >= 0.7 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {((face?.match_score || 0) * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Liveness Passed:</span>
                        <span
                          className={`font-semibold ${
                            liveness?.is_live ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {liveness?.is_live ? 'PASSED (Live)' : 'PENDING'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">OCR Confidence:</span>
                        <span className="font-mono text-slate-200">
                          {((ocr?.confidence_score || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Extracted OCR Details */}
                  <div className="flex-1 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                    <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Extracted Document Data</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Document Number</span>
                        <span className="text-slate-200 font-mono font-semibold">
                          {ocr?.document_number || 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Full Name on ID</span>
                        <span className="text-slate-200 font-semibold">{ocr?.full_name || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Date of Birth</span>
                        <span className="text-slate-200">
                          {ocr?.date_of_birth
                            ? new Date(ocr.date_of_birth).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Country</span>
                        <span className="text-slate-200">{doc?.country_code || 'N/A'}</span>
                      </div>
                    </div>

                    {ocr?.raw_text && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase mb-1">Raw OCR Snippet</span>
                        <div className="p-2 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-400 line-clamp-3">
                          {ocr.raw_text}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end">
                    <button
                      onClick={() => fetchDetail(v.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>

                    <button
                      onClick={() => { setSelectedId(v.id); setDetail(v); openDecisionModal('APPROVE'); }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => { setSelectedId(v.id); setDetail(v); openDecisionModal('REJECT'); }}
                      className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => { setSelectedId(v.id); setDetail(v); openDecisionModal('REQUEST_RESUBMIT'); }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-submit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Queue Decision Modal (for quick actions from queue view) */}
      {decisionModalOpen && selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {decisionType === 'APPROVE'
                ? 'Confirm KYC Approval'
                : decisionType === 'REJECT'
                ? 'Reject KYC Application'
                : 'Request Re-verification'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Applicant: <span className="text-indigo-400 font-semibold">{detail?.user?.email || 'Unknown'}</span>
            </p>

            <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {decisionType === 'APPROVE' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  rows={3}
                  required={decisionType !== 'APPROVE'}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={
                    decisionType === 'APPROVE'
                      ? 'Biometric face match verified by compliance officer...'
                      : 'Blurry document / selfie mismatch / invalid country ID...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setDecisionModalOpen(false); if (!detail) closeDetail(); }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
                    decisionType === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Submit ${decisionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
