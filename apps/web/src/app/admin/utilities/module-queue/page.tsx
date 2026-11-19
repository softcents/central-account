'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Server, RefreshCw } from 'lucide-react';

export default function ModuleQueuePage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Utilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Module Queue</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Module Queue</h1>
          <p className="text-xs text-slate-500">
            Pending automated server commands (cPanel account creation, VPS provisioning, suspensions)
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded border border-slate-200 shadow-sm text-center text-xs text-slate-500">
        <Server className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">No pending module commands in queue</p>
        <p>All cPanel, Proxmox, SolusVM, and registrar provisioning commands have executed successfully.</p>
      </div>
    </div>
  );
}
