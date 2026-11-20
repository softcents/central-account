'use client';

import React from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { DownloadCloud, Folder, FileCode, FileText, Download, ShieldCheck } from 'lucide-react';

export default function DownloadsPage() {
  const categories = [
    {
      id: 1,
      name: 'Software & VoIP Dialers',
      description: 'Desktop and mobile softphone dialers for Cloud PBX (Zoiper, MicroSIP).',
      filesCount: 3,
    },
    {
      id: 2,
      name: 'WHMCS Modules & API SDKs',
      description: 'Official SoftCents SMS and PipraPay integration plugins.',
      filesCount: 4,
    },
    {
      id: 3,
      name: 'Configuration Guides & Manuals',
      description: 'PDF manuals for SIP trunk setup, firewall policies, and email clients.',
      filesCount: 5,
    },
  ];

  const popularFiles = [
    {
      id: 1,
      title: 'MicroSIP VoIP Dialer for Windows (Pre-configured)',
      category: 'Software & VoIP Dialers',
      size: '8.4 MB',
      downloads: 420,
      description: 'Lightweight portable SIP softphone for Windows with G.711u, G.729, and Opus codecs pre-enabled.',
    },
    {
      id: 2,
      title: 'SoftCents SMS Gateway WHMCS Module v3.2',
      category: 'WHMCS Modules & API SDKs',
      size: '240 KB',
      downloads: 850,
      description: 'Official WHMCS addon module to send automated transactional SMS for new orders, invoices, and ticket replies.',
    },
    {
      id: 3,
      title: 'PipraPay Automated Payment Gateway Plugin for WHMCS',
      category: 'WHMCS Modules & API SDKs',
      size: '180 KB',
      downloads: 1240,
      description: 'Instant automated bKash, Nagad, Rocket, and Upay payment processing for WHMCS.',
    },
    {
      id: 4,
      title: 'Cloud PBX Asterisk SIP Trunking Quick-Start Guide (PDF)',
      category: 'Configuration Guides & Manuals',
      size: '1.2 MB',
      downloads: 310,
      description: 'Complete step-by-step PDF manual on IP authentication, extension routing, and codec selection.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <ClientHeader />
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            / Downloads
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DownloadCloud className="w-6 h-6 text-[#1A4D80]" />
            Downloads & Resources
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Download official softphones, WHMCS modules, API documentation, and configuration templates.
          </p>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-8">
        {/* Categories */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#1A4D80]" />
            Download Categories
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs hover:border-[#1A4D80] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded bg-sky-50 text-[#1A4D80] flex items-center justify-center">
                    <Folder className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {cat.filesCount} files
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-xs text-slate-500">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Available Files */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#1A4D80]" />
            Available Downloads
          </h2>

          <div className="space-y-4">
            {popularFiles.map((file) => (
              <div
                key={file.id}
                className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-[#1A4D80] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>{file.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{file.description}</p>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1">
                    <span>Category: {file.category}</span>
                    <span>•</span>
                    <span>Size: {file.size}</span>
                    <span>•</span>
                    <span>Downloads: {file.downloads}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Initiating download: ${file.title}`);
                    }}
                    className="inline-flex items-center space-x-1.5 bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-2 rounded text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
