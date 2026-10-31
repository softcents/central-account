'use client';

import React, { useEffect, useState } from 'react';
import { Lock, Smartphone, Shield, CheckCircle2, AlertCircle, Trash2, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function SettingsPage() {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiFetch<any>('/users/me/sessions', {}, token);
      if (res.ok) {
        setSessions(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load sessions', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessions();
    }
  }, [token]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordErr(null);

    if (newPassword !== confirmPassword) {
      setPasswordErr('New password and confirmation do not match');
      return;
    }

    setChangingPass(true);
    try {
      const res = await apiFetch<any>(
        '/users/me/password',
        {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        token,
      );

      if (res.ok) {
        setPasswordMsg('Password changed successfully. All other sessions invalidated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSessions();
      } else {
        throw new Error(res.data?.message || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordErr(err.message || 'Error updating password');
    } finally {
      setChangingPass(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await apiFetch<any>(
        `/users/me/sessions/${sessionId}`,
        { method: 'DELETE' },
        token,
      );
      if (res.ok) {
        fetchSessions();
      }
    } catch (e) {
      console.error('Failed to revoke session', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Update password credentials, manage active login sessions, and secure your account.
        </p>
      </div>

      {/* Change Password Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5 mb-2">
          <Key className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Update Account Password</h2>
        </div>

        {passwordMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordErr && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{passwordErr}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <button
            type="submit"
            disabled={changingPass}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {changingPass ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Active Login Sessions */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-semibold text-white">Active Login Sessions</h2>
            <p className="text-xs text-slate-400">Devices currently authenticated to your central account.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {loadingSessions ? (
            <div className="py-6 text-center text-xs text-slate-500">Loading active sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">No other active sessions.</div>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">{s.user_agent || 'Web Browser'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    IP: {s.ip_address || '127.0.0.1'} &bull; Logged in: {new Date(s.created_at).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => revokeSession(s.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Revoke Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
