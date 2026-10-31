'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Check,
  Smartphone,
  Laptop,
  AlertCircle,
  HelpCircle,
  Maximize2,
} from 'lucide-react';
import { QRCode } from './QRCode';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
  instructions?: string;
  facingMode?: 'user' | 'environment';
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Take Photo',
  instructions = 'Align your document or face within the frame and hold steady',
  facingMode = 'environment',
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active tab on PC devices ('camera' or 'qr'). On phone, QR is hidden via Tailwind!
  const [activeTab, setActiveTab] = useState<'camera' | 'qr'>('camera');

  const startCamera = async () => {
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode,
        },
        audio: false,
      });
      setStream(mediaStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setHasCameraPermission(false);
      setError('Camera access denied or unavailable. Grant camera permissions in browser settings.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(b64);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    if (!stream) {
      startCamera();
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">{instructions}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Switcher Tabs:
            ON PHONE DEVICES (< md): HIDE the QR option tab via Tailwind (hidden md:flex)!
            Only "Use Camera" is visible and active on phones!
            ON PC/COMPUTER DEVICES (md: and up): BOTH "Use Camera" and "Scan QR Code" are visible! */}
        <div className="px-6 pt-4 pb-2">
          {/* On phones, this whole tab bar is hidden because only Camera is available.
              On PC (md:flex), both options are presented. */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'camera'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Use Camera / Open Webcam</span>
            </button>

            {/* QR Code Tab - Visible ONLY on PC/Computer devices (md:flex), NEVER on Phone devices */}
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                activeTab === 'qr'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Scan QR Code (Use Phone)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-2">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center space-x-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW 1: Camera Feed Viewfinder */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center border border-slate-800">
                {capturedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedImage}
                    alt="Captured photo"
                    className="w-full h-full object-contain bg-slate-950"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Framing Guide Lines */}
                    <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-indigo-400/50 rounded-xl" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-slate-300 pointer-events-none">
                      Position document clearly in the center
                    </div>
                  </>
                )}

                {/* Permission Denied Overlay */}
                {hasCameraPermission === false && !capturedImage && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Camera className="w-10 h-10 text-slate-500" />
                    <p className="text-xs text-slate-400 max-w-sm">
                      Camera permission is required to capture photos directly.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden Canvas */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Action Buttons */}
              <div className="flex gap-3">
                {capturedImage ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Use This Photo</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleSnap}
                    disabled={!hasCameraPermission}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Picture</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: QR Code view for switching to phone
              This section is ONLY reachable on PC (hidden md:block). On phones, the QR system is hidden! */}
          <div className={`${activeTab === 'qr' ? 'block' : 'hidden'} hidden md:block space-y-4`}>
            <QRCode
              title="Continue Verification on Phone"
              subtitle="Point your smartphone camera at this QR code to capture photos with high resolution"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraCaptureModal;
