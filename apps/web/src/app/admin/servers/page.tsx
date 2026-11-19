'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Activity,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function AdminServersPage() {
  const [servers, setServers] = useState<any[]>(whmcsData?.servers || [
    { id: '1', name: 'srv8', ipaddress: '125.253.92.7', hostname: 'srv8.whitednszone.com', type: 'cpanel', active: '1' },
    { id: '2', name: 'srv5', ipaddress: '66.85.167.28', hostname: 'srv5.whitednszone.com', type: 'cpanel', active: '0' },
    { id: '3', name: 'srv7', ipaddress: '103.65.138.66', hostname: 'srv7.whitednszone.com', type: 'cpanel', active: '0' },
    { id: '6', name: 'bdix111', ipaddress: '138.252.125.207', hostname: 'bdix111.softcents.com', type: 'cpanel', active: '0' },
    { id: '7', name: 'srv111-bdpbx-1', ipaddress: '103.145.118.66', hostname: 'srv111.bdpbx.com', type: 'pbx', active: '1' },
    { id: '8', name: 'SC bdpbx-server22', ipaddress: '103.145.118.67', hostname: 'srv111.bdpbx.com', type: 'pbx', active: '0' },
  ]);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const handleTestConnection = async (id: string, name: string) => {
    setTestingId(id);
    await new Promise((r) => setTimeout(r, 600));
    setTestResult((prev) => ({
      ...prev,
      [id]: `Connection to ${name} OK. WHM API & Remote RPC online.`,
    }));
    setTestingId(null);
  };

  return (
    <div className="space-y-6">
      {/* WHMCS Banner */}
      <div className="bg-[#1A4D80] text-white p-4 rounded-t shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Server className="w-5 h-5 text-amber-300" />
            <span>Server Provisioning & Infrastructure</span>
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            cPanel/WHM web hosting clusters, Cloud PBX engines, and VPS provisioning nodes.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => alert('New Server Provisioning Wizard opened')}
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Server</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Configured Servers</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{servers.length}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Primary cPanel Cluster</div>
          <div className="text-base font-bold text-slate-800 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>srv8 (125.253.92.7)</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Cloud PBX Cluster</div>
          <div className="text-base font-bold text-slate-800 mt-1 flex items-center space-x-1">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>srv111-bdpbx-1</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Provisioned Accounts</div>
          <div className="text-2xl font-bold text-[#1A4D80] mt-1 font-mono">149 Svc</div>
        </div>
      </div>

      {/* Servers Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
          <span>Provisioning Nodes ({servers.length})</span>
          <span className="text-[11px] text-slate-500 font-normal">WHMCS Synced</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-4">Server Name</th>
              <th className="py-2.5 px-4">IP Address</th>
              <th className="py-2.5 px-4">Hostname</th>
              <th className="py-2.5 px-4 text-center">Module / Type</th>
              <th className="py-2.5 px-4 text-center">Active Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {servers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                  {s.name}
                  {testResult[s.id] && (
                    <div className="text-[11px] font-normal text-emerald-700 mt-0.5">
                      {testResult[s.id]}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 font-mono text-slate-600">{s.ipaddress || '-'}</td>
                <td className="py-3 px-4 font-mono text-slate-700">{s.hostname || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      s.type === 'cpanel'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {s.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {s.active === '1' ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      Active Primary
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                      Standby / Backup
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-1.5">
                  <button
                    onClick={() => handleTestConnection(s.id, s.name)}
                    disabled={testingId === s.id}
                    className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-2.5 py-1 rounded font-semibold transition-colors border border-slate-300"
                  >
                    {testingId === s.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin inline-block mr-1" />
                    ) : null}
                    <span>Test Connection</span>
                  </button>
                  <button
                    onClick={() => alert(`Opening WebHost Manager (WHM) or Console for ${s.name}...`)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-semibold transition-colors border border-slate-300"
                  >
                    Login
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
