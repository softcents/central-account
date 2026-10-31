'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
  Camera,
  Layers,
  Smartphone,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { QRCode } from '@/components/QRCode';

export default function IdentityOverviewPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();
  const [verification, setVerification] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [showDesktopQr, setShowDesktopQr] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadStatus() {
      if (!accessToken) return;
      try {
        const res = await apiFetch<any>('/identity/status', {}, accessToken);
        if (res.ok) {
          setVerification(res.data);
        }
      } catch {
        // ignore
      } finally {
        setFetching(false);
      }
    }
    loadStatus();
  }, [accessToken]);

  if (isLoading || fetching) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-400">
        Loading identity verification status...
      </div>
    );
  }

  const status = verification?.status || 'NOT_STARTED';
  const level = verification?.verificationLevel || 'LEVEL_0';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Personal Identity Verification (KYC)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Government ID proofing and biometric liveness verification
          </p>
        </div>

        <div>
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              status === 'VERIFIED'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                : status === 'PROCESSING'
                ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/50'
                : status === 'REVIEW_REQUIRED'
                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
                : status === 'REJECTED'
                ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {status === 'VERIFIED' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {status === 'PROCESSING' && <Clock className="w-3.5 h-3.5 animate-spin" />}
            {status === 'REVIEW_REQUIRED' && <AlertCircle className="w-3.5 h-3.5" />}
            <span>Status: {status.replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      {/* Current Tier Overview Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="sm:border-r sm:border-slate-800 sm:pr-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Current Tier
            </span>
            <span className="text-xl font-bold text-white">{level}</span>
            <p className="text-xs text-slate-500 mt-1">
              {level === 'LEVEL_0' && 'Unverified user profile'}
              {level === 'LEVEL_1' && 'Email verified'}
              {level === 'LEVEL_2' && 'Government ID parsed'}
              {level === 'LEVEL_3' && 'Biometrics & liveness confirmed'}
              {level === 'LEVEL_4' && 'Enhanced due diligence'}
              {level === 'LEVEL_5' && 'Manual compliance verified'}
            </p>
          </div>

          <div className="sm:border-r sm:border-slate-800 sm:pr-6">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Verification Engine
            </span>
            <span className="text-base font-semibold text-slate-200">Multi-Signal AI</span>
            <p className="text-xs text-slate-500 mt-1">OCR, MRZ, Active Challenge, Cosine Match</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Actions
            </span>
            {status === 'VERIFIED' ? (
              <Link
                href="/identity/status"
                className="inline-flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>View Certificate & Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : status === 'PROCESSING' || status === 'REVIEW_REQUIRED' ? (
              <Link
                href="/identity/status"
                className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <span>Check Live Progress</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/identity/document"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
              >
                <span>Start Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* PC-ONLY HELPER BANNER FOR SMARTPHONE QR CODE:
          - On PC / Computer devices (md:flex): Offers option to scan QR code and continue KYC on phone.
          - On Phone devices: COMPLETELY HIDDEN via Tailwind (hidden md:flex)! */}
      <div className="hidden md:flex items-center justify-between p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white block">Prefer completing KYC on your phone?</span>
            <span className="text-slate-400 text-[11px]">
              Take clear photos of your ID and live selfie directly with your iPhone or Android camera.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDesktopQr(!showDesktopQr)}
          className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer shrink-0"
        >
          {showDesktopQr ? 'Hide QR Code' : 'Show Mobile QR'}
        </button>
      </div>

      {/* Collapsible QR Code view on PC - hidden on mobile phones (hidden md:block) */}
      {showDesktopQr && (
        <div className="hidden md:block p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <QRCode
            title="Scan to Verify on Mobile"
            subtitle="Point your smartphone camera at this code to open the KYC document & selfie verification flow on phone"
          />
        </div>
      )}

      {/* 2-Step Flow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Step 1: Government Document</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload an official biometric passport, national identity card, or driving license. The
              system parses text and computes MRZ check digits.
            </p>
          </div>
          <Link
            href="/identity/document"
            className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            <span>Upload Document</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Step 2: Biometric Liveness & Match</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Complete a fast active liveness challenge (turn head or blink) and capture a live selfie
              matched against your document photo.
            </p>
          </div>
          <Link
            href="/identity/face"
            className="inline-flex items-center space-x-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold"
          >
            <span>Take Live Selfie</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
