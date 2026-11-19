'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { ShieldCheck, Lock, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function ClientSecurityPage() {
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setMsg({ type: 'success', text: 'Password has been updated successfully.' });
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1000px] mx-auto px-4 py-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#1A4D80]" />
            <span>Security Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your account login credentials, two-factor authentication, and active sessions.
          </p>
        </div>

        {msg && (
          <div
            className={`p-3 rounded text-xs font-semibold flex items-center space-x-2 border ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Password */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-[#1A4D80]" />
              <span>Change Password</span>
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Existing Password</label>
                <input
                  type="password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded text-xs font-bold transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Two-Factor Authentication (2FA)</span>
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Two-Factor Authentication adds an extra layer of security to your client portal account.
              Once enabled, you will need to enter both your password and an authenticator code (TOTP) from Google Authenticator or Microsoft Authenticator.
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Status: <strong>Ready to Enable</strong></span>
            </div>
            <button
              onClick={() => alert('TOTP QR code generator opened')}
              className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2 rounded text-xs font-bold transition-colors"
            >
              Configure Two-Factor Auth &rarr;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
