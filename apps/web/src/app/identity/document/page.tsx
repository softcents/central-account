'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileCheck,
  AlertCircle,
  ArrowRight,
  Globe,
  FileText,
  Image as ImageIcon,
  Camera,
  Smartphone,
  Laptop,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import { QRCode } from '@/components/QRCode';

export default function DocumentUploadPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [countries, setCountries] = useState<any[]>([
    { code: 'BD', name: 'Bangladesh' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
  ]);
  const [selectedCountry, setSelectedCountry] = useState('BD');
  const [documentType, setDocumentType] = useState('PASSPORT');

  const [frontImageBase64, setFrontImageBase64] = useState<string | null>(null);
  const [backImageBase64, setBackImageBase64] = useState<string | null>(null);
  const [frontFileName, setFrontFileName] = useState<string | null>(null);
  const [backFileName, setBackFileName] = useState<string | null>(null);

  // Camera modal state
  const [cameraTarget, setCameraTarget] = useState<'front' | 'back' | null>(null);
  // PC-only QR code display state (hidden on mobile phones)
  const [showDesktopQr, setShowDesktopQr] = useState(false);

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function initSession() {
      if (!accessToken) return;
      try {
        const res = await apiFetch<any>('/identity/session', {}, accessToken);
        if (res.ok) {
          setVerificationId(res.data.id);
        }
        const cRes = await apiFetch<any[]>('/countries');
        if (cRes.ok && Array.isArray(cRes.data) && cRes.data.length > 0) {
          setCountries(cRes.data);
        }
      } catch {
        // ignore
      }
    }
    initSession();
  }, [accessToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setError('Please upload a valid JPEG, PNG, or PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must not exceed 10MB');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      if (isFront) {
        setFrontImageBase64(b64);
        setFrontFileName(file.name);
      } else {
        setBackImageBase64(b64);
        setBackFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId || !frontImageBase64) {
      setError('Please upload at least the front image of your document');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        '/identity/document',
        {
          method: 'POST',
          body: JSON.stringify({
            verificationId,
            documentType,
            countryCode: selectedCountry,
            frontImageBase64,
            backImageBase64: backImageBase64 || undefined,
          }),
        },
        accessToken,
      );

      if (res.ok) {
        // Brief poll to check if the document classifier flagged it as fake.
        // The OCR + classification runs in background, so we give it a few seconds.
        let declined = false;
        for (let i = 0; i < 4; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const statusRes = await apiFetch<any>('/identity/status', {}, accessToken);
            if (statusRes.ok && statusRes.data?.status === 'REJECTED') {
              declined = true;
              break;
            }
            // If status moved to PENDING with FACE_LIVENESS step, document passed — proceed
            if (statusRes.ok && statusRes.data?.currentStep === 'FACE_LIVENESS') {
              break;
            }
          } catch {
            // Ignore polling errors
          }
        }

        if (declined) {
          router.push('/identity/status');
        } else {
          router.push('/identity/face');
        }
      } else {
        setError(res.data?.message || 'Failed to process document');
      }
    } catch {
      setError('Connection to verification server failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Step 1: Document Upload</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload an authentic government-issued identity document for automated OCR parsing
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Issuing Country / Jurisdiction
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Document Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: 'PASSPORT', label: 'Passport' },
                { code: 'NATIONAL_ID', label: 'National ID' },
                { code: 'DRIVING_LICENSE', label: 'Driving License' },
              ].map((dt) => (
                <button
                  type="button"
                  key={dt.code}
                  onClick={() => setDocumentType(dt.code)}
                  className={`p-3 rounded-xl border text-xs font-medium text-center transition-all ${
                    documentType === dt.code
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4 mx-auto mb-1.5 opacity-70" />
                  <span>{dt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PC-ONLY HELPER BANNER FOR SMARTPHONE QR CODE:
              - On PC / Computer devices (md:flex): Offers option to scan QR code and take photos on phone.
              - On Phone devices: COMPLETELY HIDDEN via Tailwind (hidden md:flex)! */}
          <div className="hidden md:flex items-center justify-between p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-white block">Prefer using your phone camera?</span>
                <span className="text-slate-400 text-[11px]">
                  Smartphones have higher quality cameras for capturing government IDs and passports.
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
                title="Scan to Upload Document via Phone"
                subtitle="Open this document verification page on your mobile phone to take clear photos with your smartphone camera"
              />
            </div>
          )}

          {/* Front Image Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {documentType === 'PASSPORT' ? 'Passport Photo Page' : 'Front of Document'}
              </label>
              <button
                type="button"
                onClick={() => setCameraTarget('front')}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Use Camera to Take Photo</span>
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-950/60 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => handleFileChange(e, true)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {frontImageBase64 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-emerald-400 text-xs">
                    <FileCheck className="w-5 h-5" />
                    <span className="font-semibold truncate max-w-xs">{frontFileName || 'Front Image Loaded'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Click or drag another file to replace</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-slate-500" />
                  <p className="text-xs text-slate-400 font-medium">Click or drag document image here</p>
                  <p className="text-[10px] text-slate-500">Supports JPEG, PNG, or PDF up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Back Image Dropzone (only for National ID and Driving License) */}
          {documentType !== 'PASSPORT' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Back of Document (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setCameraTarget('back')}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Use Camera to Take Photo</span>
                </button>
              </div>

              <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-950/60 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileChange(e, false)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {backImageBase64 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-emerald-400 text-xs">
                      <FileCheck className="w-5 h-5" />
                      <span className="font-semibold truncate max-w-xs">{backFileName || 'Back Image Loaded'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Click or drag another file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 mx-auto text-slate-500" />
                    <p className="text-xs text-slate-400 font-medium">Click or drag back side image (optional)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !frontImageBase64}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>{isSubmitting ? 'Scanning & Verifying Document...' : 'Next: Biometric Selfie'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Reusable Camera Capture Modal:
            - On Phone: Only "Use Camera" is available (QR option is hidden via hidden md:flex inside the modal).
            - On PC: Both "Open Webcam" and "Scan QR Code" are available! */}
        <CameraCaptureModal
          isOpen={cameraTarget !== null}
          onClose={() => setCameraTarget(null)}
          title={cameraTarget === 'front' ? 'Capture Front of Document' : 'Capture Back of Document'}
          instructions="Hold your document clearly in front of the camera with good lighting"
          facingMode="environment"
          onCapture={(base64) => {
            if (cameraTarget === 'front') {
              setFrontImageBase64(base64);
              setFrontFileName('Camera_Front_Capture.jpg');
            } else if (cameraTarget === 'back') {
              setBackImageBase64(base64);
              setBackFileName('Camera_Back_Capture.jpg');
            }
          }}
        />
      </div>
    </div>
  );
}
