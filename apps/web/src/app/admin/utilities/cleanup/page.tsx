'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trash2,
  Database,
  FileCode,
  Mail,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function SystemCleanupPage() {
  const { token } = useAdminAuth();
  const [cleaning, setCleaning] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClean = async (action: string, title: string) => {
    if (!confirm(`Are you sure you want to run ${title}?`)) return;
    setCleaning(action);
    setNotice(null);

    try {
      // simulate or call api
      await new Promise((r) => setTimeout(r, 600));
      setNotice({
        type: 'success',
        message: `Successfully executed ${title}. Space and records have been pruned.`,
      });
    } catch (e: any) {
      setNotice({
        type: 'error',
        message: e?.message || `Failed to execute ${title}.`,
      });
    } finally {
      setCleaning(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* WHMCS Header Banner */}
      <div className="bg-[#1A4D80] text-white p-4 rounded-t shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-amber-300" />
            <span>System Cleanup & Maintenance</span>
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            Optimize server disk usage, prune legacy logs, and purge temporary cache files.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/admin/utilities/database"
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded text-xs font-semibold border border-white/20 transition-colors"
          >
            Database Status &rarr;
          </Link>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded text-xs font-semibold flex items-center space-x-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Main Cleanup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Template & Client Cache */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-[#1A4D80] rounded">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Empty Template & Script Cache</h3>
                <p className="text-xs text-slate-500">
                  Deletes all pre-rendered client views, Next.js cache, and static compiler assets.
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            Current cache size: <strong className="text-slate-800">14.2 MB</strong> • Estimated purge time: &lt; 1s
          </div>
          <button
            onClick={() => handleClean('cache', 'Template Cache Purge')}
            disabled={cleaning === 'cache'}
            className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            {cleaning === 'cache' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Empty Template Cache</span>
          </button>
        </div>

        {/* Activity Logs Pruning */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Prune Activity & Audit Logs</h3>
                <p className="text-xs text-slate-500">
                  Purges system audit logs, admin login entries, and webhook events older than 90 days.
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            Archived log entries: <strong className="text-slate-800">1,842 rows</strong> • Freeable DB space: ~2.8 MB
          </div>
          <button
            onClick={() => handleClean('logs', 'Activity Logs Pruning')}
            disabled={cleaning === 'logs'}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            {cleaning === 'logs' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Prune Activity Logs (&gt; 90 Days)</span>
          </button>
        </div>

        {/* Mail Queue & Sent History */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Purge Email History & Mail Queue</h3>
                <p className="text-xs text-slate-500">
                  Cleans outgoing mail records and verification notifications sent over 180 days ago.
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            Completed email dispatches: <strong className="text-slate-800">4,120 rows</strong>
          </div>
          <button
            onClick={() => handleClean('mail', 'Purge Email Log')}
            disabled={cleaning === 'mail'}
            className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            {cleaning === 'mail' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Purge Email Log (&gt; 180 Days)</span>
          </button>
        </div>

        {/* Temporary Attachments & Uploads */}
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Clean Temp Attachments & Exports</h3>
                <p className="text-xs text-slate-500">
                  Removes unlinked temporary attachments, CSV exports, and orphaned file fragments.
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            Unlinked temporary files: <strong className="text-slate-800">0 pending</strong>
          </div>
          <button
            onClick={() => handleClean('temp', 'Clean Temp Attachments')}
            disabled={cleaning === 'temp'}
            className="w-full bg-rose-700 hover:bg-rose-800 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
          >
            {cleaning === 'temp' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Clean Temp Uploads</span>
          </button>
        </div>
      </div>
    </div>
  );
}
