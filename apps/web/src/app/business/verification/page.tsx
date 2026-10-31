'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertTriangle,
  Camera,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { QRCode } from '@/components/QRCode';

function BusinessVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('id');
  const { user, accessToken, isLoading } = useAuth();

  const [business, setBusiness] = useState<any>(null);
  const [docType, setDocType] = useState('TRADE_LICENSE');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showDesktopQr, setShowDesktopQr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchStatus = async () => {
    if (!accessToken || !businessId) return;
    try {
      const res = await apiFetch<any>(`/business/${businessId}/status`, {}, accessToken);
      if (res.ok && res.data) {
        setBusiness(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (businessId && accessToken) {
      fetchStatus();
    }
  }, [businessId, accessToken]);

  // Polling when in processing status
  useEffect(() => {
    if (!business || !businessId) return;
    if (business.status === 'DOCUMENT_PROCESSING' || business.status === 'KYC_PENDING') {
      const interval = setInterval(() => {
        fetchStatus();
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [business?.status, businessId, accessToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setError('Please upload a valid PDF, JPEG, or PNG document');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Document file size must not exceed 15MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBase64 || !fileName || !businessId) {
      setError('Please select a commercial document file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch<any>(
        `/business/${businessId}/document`,
        {
          method: 'POST',
          body: JSON.stringify({
            documentTypeCode: docType,
            fileBase64,
            fileName,
          }),
        },
        accessToken,
      );

      if (res.ok) {
        setSuccessMessage('Document uploaded. Asynchronous OCR and KYB verification in progress...');
        setFileBase64(null);
        setFileName(null);
        await fetchStatus();
      } else {
        setError(res.data?.message || 'Failed to upload business document');
      }
    } catch {
      setError('Connection error while uploading trade license');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatus();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!businessId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-12 h-12 mx-auto text-slate-600" />
        <h2 className="text-xl font-bold text-white">No Business Selected</h2>
        <p className="text-xs text-slate-400">
          Please select a business from your enterprise dashboard to view or verify documents.
        </p>
        <Link
          href="/business"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          <span>Return to Business List</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const latestVerification = business?.verifications?.[0];
  const results = latestVerification?.results || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-indigo-400 mb-1">
            <Link href="/business" className="hover:underline">
              Business
            </Link>
            <span>/</span>
            <span>Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Commercial KYB Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validate trade license authenticity and establish verified beneficial ownership
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Business Details Overview */}
      {business && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl shadow-black/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-snug">{business.legal_name}</h2>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span>{business.business_type}</span>
                  <span>&bull;</span>
                  <span>{business.country_code}</span>
                  <span>&bull;</span>
                  <span className="font-mono">{business.registration_number}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  business.status === 'VERIFIED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : business.status === 'KYC_PENDING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : business.status === 'DOCUMENT_PROCESSING'
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {business.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white border border-slate-700">
                {business.verification_level}
              </span>
            </div>
          </div>

          {/* Owner KYC Linkage Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              business.ownerKycVerified
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {business.ownerKycVerified ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Beneficial Owner Personal KYC
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {business.ownerKycVerified
                    ? `Primary owner identity is verified (${business.ownerKycDetails?.level || 'VERIFIED'}). Eligible for Business Tier 2+.`
                    : 'Primary business owner has not verified personal KYC. Full KYB verification requires verified owner identity.'}
                </p>
              </div>
            </div>

            {!business.ownerKycVerified && (
              <Link
                href="/identity/document"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verify Owner KYC</span>
              </Link>
            )}
          </div>

          {/* Upload Trade License Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Submit Commercial Verification Document</span>
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* PC-ONLY HELPER BANNER FOR SMARTPHONE QR CODE:
                  - On PC / Computer devices (md:flex): Offers option to scan QR code and take photos on phone.
                  - On Phone devices: COMPLETELY HIDDEN via Tailwind (hidden md:flex)! */}
              <div className="hidden md:flex items-center justify-between p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">Prefer uploading with your phone?</span>
                    <span className="text-slate-400 text-[11px]">
                      Scan this QR code to capture trade licenses and certificates using your smartphone camera.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDesktopQr(!showDesktopQr)}
                  className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer shrink-0"
                >
                  {showDesktopQr ? 'Hide QR Code' : 'Show QR Code'}
                </button>
              </div>

              {/* Collapsible QR Code view on PC - hidden on mobile (hidden md:block) */}
              {showDesktopQr && (
                <div className="hidden md:block p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <QRCode
                    title="Scan to Verify KYB on Phone"
                    subtitle="Open this business verification page on your mobile phone to snap commercial documents"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { code: 'TRADE_LICENSE', label: 'Trade License' },
                  { code: 'CERTIFICATE_OF_INCORPORATION', label: 'Incorporation Cert' },
                  { code: 'TAX_CERTIFICATE', label: 'Tax / TIN Certificate' },
                ].map((type) => (
                  <button
                    key={type.code}
                    type="button"
                    onClick={() => setDocType(type.code)}
                    className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                      docType === type.code
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Document upload zone with Use Camera button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Document File / Camera Photo
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Use Camera to Take Photo</span>
                  </button>
                </div>

                <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-950/60 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {fileBase64 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center space-x-2 text-emerald-400 text-xs">
                        <FileCheck className="w-5 h-5" />
                        <span className="font-semibold truncate max-w-sm">
                          {fileName || 'Document Loaded'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">Click or drag another file to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 mx-auto text-slate-500" />
                      <p className="text-xs text-slate-400 font-medium">
                        Click or drag your official commercial license file here
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Supports PDF, PNG, or JPEG up to 15MB. Stored in encrypted private storage.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading || !fileBase64}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <span>{isUploading ? 'Uploading & Enqueuing Verification...' : 'Submit Document for KYB Analysis'}</span>
                {!isUploading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Reusable Camera Capture Modal:
                - On Phone: Only "Use Camera" is available (QR option is hidden via hidden md:flex inside the modal).
                - On PC: Both "Open Webcam" and "Scan QR Code" are available! */}
            <CameraCaptureModal
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              title="Capture Commercial Document"
              instructions="Position the full document page flat and clearly readable in the frame"
              facingMode="environment"
              onCapture={(base64) => {
                setFileBase64(base64);
                setFileName(`${docType}_Camera_Capture.jpg`);
              }}
            />
          </div>

          {/* Uploaded Documents History */}
          {business.documents && business.documents.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Submitted Commercial Files
              </h4>
              <div className="space-y-2">
                {business.documents.map((d: any) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-white font-medium block">{d.file_name}</span>
                        <span className="text-[11px] text-slate-400">
                          {d.document_type?.name || 'Trade License'} &bull; Status: {d.status}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {new Date(d.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Results & Signals */}
          {results.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Automated Verification Results & Signals
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start space-x-3 text-xs"
                  >
                    {r.is_valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{r.check_type}</span>
                        {r.confidence_score && (
                          <span className="text-[10px] text-slate-400">
                            ({(r.confidence_score * 100).toFixed(0)}% confidence)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BusinessVerificationPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-slate-400">Loading verification details...</div>}
    >
      <BusinessVerificationContent />
    </Suspense>
  );
}
