'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Download } from 'lucide-react';

export default function DownloadsPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/support" className="text-[#1A4D80] hover:underline font-semibold">
          Support
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Downloads</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Downloads</h1>
          <p className="text-xs text-slate-500">
            Client software files, manual templates, scripts, and utilities
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Download File</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded border border-slate-200 shadow-sm text-center text-xs text-slate-500">
        <Download className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">No downloadable files yet</p>
        <p>Create categories and upload software files for clients.</p>
      </div>
    </div>
  );
}
