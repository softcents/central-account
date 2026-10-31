'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Copy,
  Download,
  RefreshCw,
  Check,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const router = useRouter();
  const { user, accessToken, isLoading, updateUserMfa } = useAuth();

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionActionError, setSessionActionError] = useState<string | null>(null);

  // Email Change State
  const [emailChangeData, setEmailChangeData] = useState<any | null>(null);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isSubmittingEmailChange, setIsSubmittingEmailChange] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);

  // MFA Flow state
  const [mfaStatus, setMfaStatus] = useState<{ isEnabled: boolean }>({ isEnabled: false });
  const [isGeneratingMfa, setIsGeneratingMfa] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [totpInput, setTotpInput] = useState('');
  const [isEnablingMfa, setIsEnablingMfa] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Load Sessions
  const loadSessions = async () => {
    if (!accessToken) return;
    setLoadingSessions(true);
    try {
      const res = await apiFetch<Session[]>('/auth/sessions', {}, accessToken);
      if (res.ok && Array.isArray(res.data)) {
        setSessions(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load MFA Status
  const loadMfaStatus = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<{ isEnabled: boolean }>('/mfa/status', {}, accessToken);
      if (res.ok) {
        setMfaStatus(res.data);
      }
    } catch {
      // ignore
    }
  };

  // Load Email Change Status
  const loadEmailChangeStatus = async () => {
    if (!accessToken) return;
    try {
      const res = await apiFetch<any>('/auth/email-change/status', {}, accessToken);
      if (res.ok && res.data?.hasActiveRequest) {
        setEmailChangeData(res.data.request);
      } else {
        setEmailChangeData(null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadSessions();
      loadMfaStatus();
      loadEmailChangeStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) return;

    setIsSubmittingEmailChange(true);
    setEmailChangeError(null);
    setEmailChangeSuccess(null);

    try {
      const res = await apiFetch<any>(
        '/auth/email-change/request',
        {
          method: 'POST',
          body: JSON.stringify({ newEmail: newEmailInput.trim() }),
        },
        accessToken,
      );

      if (res.ok) {
        setEmailChangeSuccess(res.data?.message || 'Email change request submitted for compliance review.');
        setNewEmailInput('');
        await loadEmailChangeStatus();
      } else {
        setEmailChangeError(res.data?.message || 'Failed to request email change');
      }
    } catch {
      setEmailChangeError('An unexpected error occurred submitting email change request');
    } finally {
      setIsSubmittingEmailChange(false);
    }
  };

  // Revoke Session
  const handleRevokeSession = async (sessionId: string) => {
    setSessionActionError(null);
    try {
      const res = await apiFetch(`/auth/sessions/${sessionId}/revoke`, { method: 'POST' }, accessToken);
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        setSessionActionError('Failed to revoke session.');
      }
    } catch {
      setSessionActionError('Error revoking session.');
    }
  };

  // Begin MFA Setup
  const handleStartMfaSetup = async () => {
    setMfaError(null);
    setIsGeneratingMfa(true);
    try {
      const res = await apiFetch<{
        secret: string;
        qrCodeDataUrl: string;
        backupCodes: string[];
      }>('/mfa/generate', { method: 'POST' }, accessToken);

      if (res.ok) {
        setMfaSetupData(res.data);
      } else {
        setMfaError('Failed to initiate MFA setup.');
      }
    } catch {
      setMfaError('Server error initiating MFA.');
    } finally {
      setIsGeneratingMfa(false);
    }
  };

  // Confirm TOTP Code
  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupData || !totpInput.trim()) return;

    setMfaError(null);
    setIsEnablingMfa(true);

    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/mfa/enable',
        {
          method: 'POST',
          body: JSON.stringify({
            secret: mfaSetupData.secret,
            code: totpInput.trim(),
            backupCodes: mfaSetupData.backupCodes,
          }),
        },
        accessToken,
      );

      if (res.ok) {
        setSavedBackupCodes(mfaSetupData.backupCodes);
        setMfaSetupData(null);
        setTotpInput('');
        setMfaStatus({ isEnabled: true });
        updateUserMfa(true);
      } else {
        setMfaError((res.data as any)?.message || 'Invalid 6-digit code. Please verify and try again.');
      }
    } catch {
      setMfaError('Error verifying authenticator code.');
    } finally {
      setIsEnablingMfa(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;
    setMfaError(null);

    try {
      const res = await apiFetch('/mfa/disable', { method: 'POST' }, accessToken);
      if (res.ok) {
        setMfaStatus({ isEnabled: false });
        updateUserMfa(false);
        setSavedBackupCodes(null);
      } else {
        setMfaError('Failed to disable MFA.');
      }
    } catch {
      setMfaError('Error disabling MFA.');
    }
  };

  const copySecretToClipboard = () => {
    if (mfaSetupData?.secret) {
      navigator.clipboard.writeText(mfaSetupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (!savedBackupCodes) return;
    const blob = new Blob([savedBackupCodes.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `central-id-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !user) {
    return <div className="p-8 text-center text-slate-400">Loading security center...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Security & Sessions</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your two-factor authentication and active device sessions
        </p>
      </div>

      {/* MFA Management Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Two-Factor Authentication (TOTP)</h2>
              <p className="text-xs text-slate-400">
                Secure your account with Google Authenticator, Authy, or 1Password.
              </p>
            </div>
          </div>

          <div>
            {mfaStatus.isEnabled ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2FA Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                <span>Not Configured</span>
              </span>
            )}
          </div>
        </div>

        {mfaError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{mfaError}</span>
          </div>
        )}

        {/* Backup Codes Displayed After Enabling */}
        {savedBackupCodes && (
          <div className="mt-6 p-6 rounded-xl bg-slate-950 border border-emerald-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>MFA Successfully Activated! Save Your Recovery Codes</span>
              </div>
              <button
                onClick={downloadBackupCodes}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              If you lose access to your authenticator device, each recovery code can be used once as an
              emergency bypass.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {savedBackupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="font-mono text-xs bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-center text-slate-200 select-all"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MFA Setup In-Progress View */}
        {mfaSetupData && !savedBackupCodes && (
          <div className="mt-6 p-6 rounded-xl bg-slate-950/80 border border-indigo-900/40 space-y-6">
            <h3 className="text-sm font-semibold text-white">Scan Authenticator QR Code</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mfaSetupData.qrCodeDataUrl}
                  alt="MFA QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Manual Entry Secret:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-indigo-300 select-all break-all">
                      {mfaSetupData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecretToClipboard}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy Secret"
                    >
                      {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleEnableMfa} className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Enter 6-Digit Code to Confirm
                  </label>
                  <div className="flex gap-2 max-w-xs">
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="000000"
                      value={totpInput}
                      onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-36 font-mono text-center tracking-widest text-base bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isEnablingMfa || totpInput.length !== 6}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                      {isEnablingMfa ? 'Verifying...' : 'Activate 2FA'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Action Toggle */}
        <div className="mt-6 flex items-center justify-between">
          {!mfaStatus.isEnabled ? (
            !mfaSetupData && (
              <button
                onClick={handleStartMfaSetup}
                disabled={isGeneratingMfa}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isGeneratingMfa ? 'Generating Key...' : 'Set Up Two-Factor Authentication'}</span>
              </button>
            )
          ) : (
            <button
              onClick={handleDisableMfa}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Disable Two-Factor Auth</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Email & Gated Change Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Primary Account Email</h2>
              <p className="text-xs text-slate-400">
                Gated email address updates with identity compliance review
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Current Active Email:</span>
              <span className="text-sm font-bold text-white font-mono">{user?.email}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Primary Address</span>
            </div>
          </div>

          {emailChangeSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{emailChangeSuccess}</span>
            </div>
          )}

          {emailChangeError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{emailChangeError}</span>
            </div>
          )}

          {emailChangeData ? (
            <div className="p-5 rounded-xl bg-slate-950/90 border border-indigo-900/50 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Active Email Change Request</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
                  {emailChangeData.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[11px]">Requested Target Email:</span>
                  <span className="font-mono text-white">{emailChangeData.new_email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Compliance Ticket:</span>
                  <Link
                    href={`/support/${emailChangeData.ticket_id}`}
                    className="text-indigo-400 hover:underline font-mono"
                  >
                    #{emailChangeData.ticket_id.slice(0, 8)} (View Thread)
                  </Link>
                </div>
              </div>

              {emailChangeData.status === 'APPROVED' ? (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
                  Compliance review approved! A confirmation link has been sent to{' '}
                  <strong>{emailChangeData.new_email}</strong>. Click the link in your inbox to complete the transfer.
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs">
                  Your request is currently undergoing security compliance review. Once approved, a confirmation link will be delivered to your new email address.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleRequestEmailChange} className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Security & Compliance Requirement:</span>
                </div>
                <p>
                  To prevent unauthorized account takeovers, changing your primary email requires identity verification of at least <strong>Level 2 (Personal KYC)</strong> and manual compliance verification.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter new email address..."
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingEmailChange || !newEmailInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  {isSubmittingEmailChange ? 'Submitting...' : 'Request Email Change'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Active Sessions Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Active Sessions</h2>
              <p className="text-xs text-slate-400">
                Devices currently logged into your Central Account account
              </p>
            </div>
          </div>

          <button
            onClick={loadSessions}
            disabled={loadingSessions}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {sessionActionError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
            {sessionActionError}
          </div>
        )}

        <div className="mt-6 divide-y divide-slate-800">
          {sessions.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">No active sessions found.</div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 mt-0.5">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-white">{sess.deviceName}</span>
                      {sess.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 space-x-2">
                      <span>IP: {sess.ipAddress}</span>
                      <span>&bull;</span>
                      <span>Active since: {new Date(sess.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {!sess.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 text-xs font-medium transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
