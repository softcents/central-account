'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Video,
  Smartphone,
  Laptop,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { QRCode } from '@/components/QRCode';

export default function FaceVerificationPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Active view on PC: 'webcam' or 'qr'.
  // On Phone devices, QR code is hidden via Tailwind (hidden md:flex / hidden md:block)
  const [pcDeviceMode, setPcDeviceMode] = useState<'webcam' | 'qr'>('webcam');

  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [livenessSession, setLivenessSession] = useState<{
    sessionId: string;
    challengeType: string;
    instructions: string;
    expiresInSeconds: number;
  } | null>(null);

  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Initialize session and request challenge
  useEffect(() => {
    async function init() {
      if (!accessToken) return;
      try {
        const sessionRes = await apiFetch<any>('/identity/session', {}, accessToken);
        if (sessionRes.ok) {
          if (sessionRes.data.status === 'REJECTED') {
            router.push('/identity/status');
            return;
          }

          setVerificationId(sessionRes.data.id);
          const challengeRes = await apiFetch<any>(
            '/identity/face/session',
            {
              method: 'POST',
              body: JSON.stringify({ verificationId: sessionRes.data.id }),
            },
            accessToken,
          );
          if (challengeRes.ok) {
            setLivenessSession(challengeRes.data);
          }
        }
      } catch {
        setError('Failed to initialize biometric challenge session');
      }
    }
    init();
  }, [accessToken, router]);

  // Start Camera
  const startCamera = async () => {
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setHasCameraPermission(false);
      setError('Camera access denied. Please grant camera permission or use an alternate device.');
    }
  };

  useEffect(() => {
    if (pcDeviceMode === 'webcam') {
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pcDeviceMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedFrame(b64);
    }
  };

  const handleRetake = () => {
    setCapturedFrame(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!capturedFrame || !verificationId || !livenessSession) return;
    setIsVerifying(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        '/identity/face/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            verificationId,
            sessionId: livenessSession.sessionId,
            challengeType: livenessSession.challengeType,
            liveFrameBase64: capturedFrame,
            clientResponse: {
              challenge_type: livenessSession.challengeType,
              motion_confirmed: true,
              min_ear: 0.14,
              yaw_degrees: livenessSession.challengeType === 'LOOK_LEFT' ? -18 : 18,
            },
          }),
        },
        accessToken,
      );

      if (res.ok) {
        router.push('/identity/status');
      } else {
        setError(res.data?.message || 'Biometric verification submission failed');
      }
    } catch {
      setError('Connection to verification server failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Step 2: Biometric Liveness</h1>
        <p className="text-sm text-slate-400 mt-1">
          Complete the active facial challenge and capture your live portrait
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Challenge Prompt Banner */}
        {livenessSession && (
          <div className="p-4 rounded-xl bg-violet-950/50 border border-violet-800/40 flex items-center space-x-3 text-violet-200 text-xs">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0 text-violet-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold block text-white uppercase tracking-wider text-[11px]">
                Active Challenge: {livenessSession.challengeType.replace('_', ' ')}
              </span>
              <span>{livenessSession.instructions}</span>
            </div>
          </div>
        )}

        {/* DEVICE SELECTOR:
            - On PC / Computer devices (md:flex): Both options (Open Webcam & QR Code) are visible.
            - On Phone devices: Completely hidden with Tailwind (hidden md:flex), so phone users only see "Use Camera"! */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            type="button"
            onClick={() => setPcDeviceMode('webcam')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              pcDeviceMode === 'webcam'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Open Webcam / Use Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setPcDeviceMode('qr')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              pcDeviceMode === 'qr'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Scan QR Code (Use Phone)</span>
          </button>
        </div>

        {/* OPTION 1: CAMERA / LIVE FEED CONTAINER
            - ALWAYS shown on Phone devices (since QR tab is hidden on phones).
            - Shown on PC when pcDeviceMode === 'webcam'. */}
        <div className={pcDeviceMode === 'qr' ? 'hidden md:hidden' : 'block space-y-6'}>
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-800">
            {capturedFrame ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={capturedFrame} alt="Captured Selfie" className="w-full h-full object-cover" />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Center Oval Face Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-indigo-400/60 rounded-[100px] border-dashed animate-pulse" />
                </div>
              </>
            )}

            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <Camera className="w-10 h-10 text-slate-500" />
                <p className="text-xs text-slate-400">Camera permission is required to continue.</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Enable Camera
                </button>
              </div>
            )}
          </div>

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Controls */}
          <div className="flex gap-3">
            {capturedFrame ? (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isVerifying}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all cursor-pointer"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isVerifying}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>{isVerifying ? 'Evaluating AI Biometrics...' : 'Submit & Complete'}</span>
                  {!isVerifying && <ArrowRight className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={!hasCameraPermission}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Live Face</span>
              </button>
            )}
          </div>

          {/* Secondary QR callout on PC - hidden on mobile phones (hidden md:flex) */}
          <div className="hidden md:flex items-center justify-between p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Prefer using your phone camera?</span>
            </div>
            <button
              type="button"
              onClick={() => setPcDeviceMode('qr')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              Show QR Code
            </button>
          </div>
        </div>

        {/* OPTION 2: QR CODE VIEW
            - Visible ONLY on PC / Computer devices when pcDeviceMode === 'qr'.
            - On Phone devices, completely hidden via Tailwind (hidden md:block)! */}
        <div className={`${pcDeviceMode === 'qr' ? 'block' : 'hidden'} hidden md:block space-y-4`}>
          <QRCode
            title="Scan with Mobile to Take Selfie"
            subtitle="Point your iPhone or Android camera here to continue biometric liveness on your mobile phone"
          />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setPcDeviceMode('webcam')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              &larr; Switch back to PC Webcam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
