'use client';

import React from 'react';
import { Server, Cpu, HardDrive, ShieldCheck, Terminal, Layers } from 'lucide-react';

export default function SystemInfoPage() {
  const envDetails = [
    { key: 'Platform', value: 'Linux x86_64 (aaPanel Managed)' },
    { key: 'Node.js Runtime', value: 'v20.x LTS' },
    { key: 'NestJS Backend', value: 'v10.3 (Central Auth & Billing Engine)' },
    { key: 'Next.js Frontend', value: 'v14.2.35 (React 18 App Router)' },
    { key: 'PostgreSQL Server', value: 'v16.2 on 127.0.0.1:5432' },
    { key: 'Redis Server', value: 'v7.0.15 (BullMQ Queue & Session Cache)' },
    { key: 'Nginx Web Server', value: 'v1.24.0 (Reverse Proxy & SSL Termination)' },
    { key: 'Process Supervisor', value: 'Concurrently with Watchdog Auto-Heal' },
    { key: 'CORS & Cookie Domain', value: '.softcents.com (Cross-subdomain SSO)' },
    { key: 'Max Upload Size', value: '50 MB (NID, Trade License, Attachments)' },
    { key: 'JWT Algorithm', value: 'RS256 (OIDC Compliant Keypair)' },
    { key: 'Timezone', value: 'Asia/Dhaka (UTC+06:00)' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#1A4D80] text-white p-4 rounded-t shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Server className="w-5 h-5 text-sky-300" />
            <span>System & Runtime Information</span>
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            Architecture, microservice runtime variables, and operational dependencies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-[#1A4D80] rounded">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Framework</div>
            <div className="text-sm font-bold text-slate-800">Next.js 14 + NestJS 10</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Security / SSO</div>
            <div className="text-sm font-bold text-slate-800">OIDC RS256 / SHA256</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Auto-Heal Watchdog</div>
            <div className="text-sm font-bold text-slate-800">Active (5m Interval)</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
          Environment & Runtime Variables
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-4 w-1/3">Variable / Feature</th>
              <th className="py-2.5 px-4">Configured Value / Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {envDetails.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-semibold text-slate-800 bg-slate-50/50">
                  {item.key}
                </td>
                <td className="py-2.5 px-4 font-mono text-slate-700">
                  {item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
