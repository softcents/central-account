'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ArrowLeft,
  X,
} from 'lucide-react';

export default function ClientSecurityPage() {
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA State
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState('JBSWY3DPEHPK3PXP');
  const [totpCode, setTotpCode] = useState('');
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwdMsg({ type: 'success', text: 'Your account password has been updated successfully.' });
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdMsg(null), 4000);
  };

  const handleCopySecret = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(twoFaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify2Fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setTwoFaMsg({ type: 'error', text: 'Please enter a valid 6-digit verification code.' });
      return;
    }
    setTwoFaEnabled(true);
    setTwoFaMsg({ type: 'success', text: 'Two-Factor Authentication (2FA) is now enabled for your account!' });
    setTimeout(() => {
      setTwoFaModalOpen(false);
      setTwoFaMsg(null);
      setTotpCode('');
    }, 2000);
  };

  const handleDisable2Fa = () => {
    if (confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      setTwoFaEnabled(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16">
      <ClientHeader />

      <main className="max-w-[1000px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
              <span>Security Settings</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your password credentials, two-factor authentication (TOTP), and session security.
            </p>
          </div>

          <div>
            <Link
              href="/clientarea"
              className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-block"
            >
              &larr; Back to Client Area
            </Link>
          </div>
        </div>

        {pwdMsg && (
          <div
            className={`p-3.5 rounded-lg text-xs font-semibold flex items-center space-x-2 border shadow-xs ${
              pwdMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {pwdMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{pwdMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Change Password Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-[#1A4D80]" />
              <span>Change Portal Password</span>
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Existing Password</label>
                <input
                  type="password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password (Min. 8 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-2.5 rounded text-xs font-bold transition-colors shadow-sm"
              >
                Save New Password
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Two-Factor Authentication (2FA)</span>
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              Two-factor authentication adds an extra layer of protection to your client account. When signing in, you will be required to enter both your password and an authenticator code (TOTP) from your mobile device.
            </p>

            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                twoFaEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                {twoFaEnabled ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
                <div>
                  <div className="font-bold">
                    {twoFaEnabled ? '2FA is Enabled & Active' : '2FA is Currently Disabled'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {twoFaEnabled
                      ? 'Your login is protected with TOTP authenticator.'
                      : 'Recommended to protect high-value domain & hosting assets.'}
                  </div>
                </div>
              </div>
            </div>

            {twoFaEnabled ? (
              <button
                onClick={handleDisable2Fa}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded text-xs font-bold transition-colors shadow-sm"
              >
                Disable Two-Factor Authentication
              </button>
            ) : (
              <button
                onClick={() => setTwoFaModalOpen(true)}
                className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2.5 rounded text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Configure Two-Factor Auth &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* 2FA SETUP MODAL */}
        {twoFaModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="bg-[#1A4D80] text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Setup Google / Microsoft Authenticator</span>
                </div>
                <button
                  onClick={() => {
                    setTwoFaModalOpen(false);
                    setTwoFaMsg(null);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {twoFaMsg && (
                  <div
                    className={`p-3 rounded font-semibold flex items-center space-x-2 border ${
                      twoFaMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {twoFaMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{twoFaMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1 text-slate-700">
                  <strong>Step 1: Scan QR Code</strong>
                  <p className="text-slate-500 text-[11px]">
                    Open Google Authenticator, Microsoft Authenticator, or 1Password and scan this code:
                  </p>
                </div>

                {/* QR Code Placeholder Representation */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center space-y-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/SoftCents:client@softcents.com?secret=${twoFaSecret}&issuer=SoftCents`}
                    alt="2FA QR Code"
                    className="w-36 h-36 border border-slate-300 rounded shadow-xs"
                  />
                  <div className="text-[11px] text-slate-500 text-center">
                    Can't scan? Enter secret key manually:
                  </div>
                  <div className="flex items-center space-x-1 font-mono font-bold bg-white px-2 py-1 border border-slate-300 rounded text-slate-800">
                    <span>{twoFaSecret}</span>
                    <button
                      onClick={handleCopySecret}
                      className="text-slate-500 hover:text-[#1A4D80] p-1"
                      title="Copy Secret"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleVerify2Fa} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <strong className="text-slate-700">Step 2: Enter 6-digit Code</strong>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="000000"
                      className="w-full text-center font-mono font-bold text-lg tracking-widest bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTwoFaModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2 rounded font-bold"
                    >
                      Verify &amp; Enable 2FA
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
