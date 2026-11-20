'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, AlertTriangle, Clock, Server, RefreshCw } from 'lucide-react';

export default function NetworkIssuesPage() {
  const [activeTab, setActiveTab] = useState<'open' | 'scheduled' | 'resolved'>('open');

  const servers = [
    { name: 'Web & cPanel Node 1 (BD DC)', host: '138.252.125.207', http: 'Online', uptime: '99.98%' },
    { name: 'Web & cPanel Node 2 (BD DC)', host: '138.252.125.208', http: 'Online', uptime: '99.99%' },
    { name: 'Asterisk Cloud PBX Master Node', host: '192.168.1.1', http: 'Online', uptime: '100.0%' },
    { name: 'KVM VPS Master Cluster 1', host: '103.114.98.50', http: 'Online', uptime: '99.95%' },
    { name: 'KVM VPS Master Cluster 2', host: '103.114.98.51', http: 'Online', uptime: '99.97%' },
    { name: 'Primary Nameserver ns12.softcents.com', host: 'Anycast DNS', http: 'Online', uptime: '100.0%' },
  ];

  const networkIssues = [
    {
      id: 1,
      title: 'Scheduled Core Router Firmware Upgrades - BD Datacenter',
      type: 'Server',
      priority: 'Low',
      status: 'Scheduled',
      startDate: '2026-11-25 02:00 UTC',
      endDate: '2026-11-25 03:00 UTC',
      description:
        'We will be upgrading the edge routing firmware in our Dhaka datacenter. Redundant links will carry traffic during the maintenance window with no packet loss anticipated.',
    },
    {
      id: 2,
      title: 'Voice SMS Gateway Maintenance Completed',
      type: 'System',
      priority: 'Medium',
      status: 'Resolved',
      startDate: '2025-11-16 18:00 UTC',
      endDate: '2025-11-16 19:30 UTC',
      description:
        'Voice SMS gateway was optimized to support Same IP Number dialing. All pending campaign queues cleared and verified.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            / Network Issues &amp; Server Status
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#1A4D80]" />
            Network Issues &amp; Server Status
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time infrastructure health, uptime tracking, and scheduled maintenance notices.
          </p>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-8">
        {/* All Systems Operational Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex items-center space-x-3 shadow-2xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-emerald-900">
              All Core Cloud &amp; Hosting Systems Operational
            </h2>
            <p className="text-xs text-emerald-700">
              Zero active critical outages. Web servers, Cloud PBX SIP trunks, and DNS clusters are running normally.
            </p>
          </div>
        </div>

        {/* Server Status Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#1A4D80]" />
              Server Node Status
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Updated 1 min ago
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Server / Node Name</th>
                  <th className="py-2.5 px-3">Host / Address</th>
                  <th className="py-2.5 px-3">HTTP (Port 80/443)</th>
                  <th className="py-2.5 px-3">Monthly Uptime</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servers.map((srv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{srv.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{srv.host}</td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">{srv.http}</td>
                    <td className="py-2.5 px-3 text-slate-600">{srv.uptime}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Operational
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance / Issues Log */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'open'
                  ? 'bg-[#1A4D80] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Open Issues (0)
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'scheduled'
                  ? 'bg-[#1A4D80] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Scheduled Maintenance (1)
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'resolved'
                  ? 'bg-[#1A4D80] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Resolved Issues (1)
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'open' && (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                There are currently no open service disruptions or network outages.
              </div>
            )}

            {activeTab === 'scheduled' && (
              <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Scheduled Core Router Firmware Upgrades - BD Datacenter
                  </h4>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Scheduled
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  We will be upgrading the edge routing firmware in our Dhaka datacenter. Redundant links will carry traffic during the maintenance window with no packet loss anticipated.
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Time: 25th Nov 2026 02:00 UTC - 03:00 UTC • Priority: Low
                </div>
              </div>
            )}

            {activeTab === 'resolved' && (
              <div className="border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Voice SMS Gateway Maintenance Completed
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                    Resolved
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Voice SMS gateway was optimized to support Same IP Number dialing. All pending campaign queues cleared and verified.
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Time: 16th Nov 2025 18:00 UTC • Priority: Medium
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
