'use client';

import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Edit,
  Trash2,
  Radio,
  Check,
  X,
  Lock,
  Globe,
  Database,
  Users,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

interface ServerItem {
  id: string;
  name: string;
  ipaddress: string;
  hostname: string;
  type: string;
  username?: string;
  secure?: string;
  port?: string | number;
  active: string | number;
  disabled?: string | number;
  maxaccounts?: string | number;
  activeAccounts?: number;
  nameserver1?: string;
  nameserver2?: string;
}

interface ServerGroupItem {
  id: string;
  name: string;
  filltype: string;
  servers: string[];
}

export default function AdminServersPage() {
  const [activeTab, setActiveTab] = useState<'servers' | 'groups'>('servers');
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [serverGroups, setServerGroups] = useState<ServerGroupItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Testing connection state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string; latency?: number }>>({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerItem | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ServerGroupItem | null>(null);

  // Add/Edit Server Form State
  const [serverForm, setServerForm] = useState({
    id: '',
    name: '',
    hostname: '',
    ipaddress: '',
    type: 'cpanel',
    username: 'root',
    password: '',
    accesshash: '',
    secure: 'on',
    port: '2087',
    maxaccounts: '200',
    nameserver1: 'ns1.softcents.com',
    nameserver2: 'ns2.softcents.com',
    active: true,
  });

  // Group Form State
  const [groupForm, setGroupForm] = useState({
    id: '',
    name: '',
    filltype: '1',
    selectedServers: [] as string[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/servers');
      if (res.ok) {
        const d = await res.json();
        if (d.servers) setServers(d.servers);
        if (d.serverGroups) setServerGroups(d.serverGroups);
        return;
      }
    } catch {}

    // Fallback to local synced json
    setServers(whmcsData?.servers || []);
    setServerGroups(whmcsData?.serverGroups || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestConnection = async (s: ServerItem) => {
    setTestingId(s.id);
    try {
      const res = await fetch('/api/admin/servers/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: s.id,
          name: s.name,
          hostname: s.hostname,
          ipaddress: s.ipaddress,
          type: s.type,
          secure: s.secure,
          port: s.port,
        }),
      });

      const data = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [s.id]: {
          ok: data.success,
          message: data.message || (data.success ? 'Connection Successful' : 'Connection Failed'),
          latency: data.latencyMs,
        },
      }));
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [s.id]: {
          ok: false,
          message: `Network error: ${err.message}`,
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenAddServer = () => {
    setServerForm({
      id: '',
      name: '',
      hostname: '',
      ipaddress: '',
      type: 'cpanel',
      username: 'root',
      password: '',
      accesshash: '',
      secure: 'on',
      port: '2087',
      maxaccounts: '200',
      nameserver1: 'ns1.softcents.com',
      nameserver2: 'ns2.softcents.com',
      active: true,
    });
    setEditingServer(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditServer = (s: ServerItem) => {
    setEditingServer(s);
    setServerForm({
      id: s.id,
      name: s.name || '',
      hostname: s.hostname || '',
      ipaddress: s.ipaddress || '',
      type: s.type || 'cpanel',
      username: s.username || 'root',
      password: '',
      accesshash: '',
      secure: s.secure || 'on',
      port: String(s.port || (s.type === 'cpanel' ? '2087' : '443')),
      maxaccounts: String(s.maxaccounts || '200'),
      nameserver1: s.nameserver1 || '',
      nameserver2: s.nameserver2 || '',
      active: s.active === '1' || s.active === 1,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to save server');
    }
  };

  const handleDeleteServer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove server ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/servers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadData();
      }
    } catch {}
  };

  const handleOpenAddGroup = () => {
    setGroupForm({
      id: '',
      name: '',
      filltype: '1',
      selectedServers: [],
    });
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (g: ServerGroupItem) => {
    setEditingGroup(g);
    setGroupForm({
      id: g.id,
      name: g.name,
      filltype: g.filltype || '1',
      selectedServers: g.servers || [],
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/servers/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: groupForm.id,
          name: groupForm.name,
          filltype: groupForm.filltype,
          servers: groupForm.selectedServers,
        }),
      });
      if (res.ok) {
        setIsGroupModalOpen(false);
        loadData();
      }
    } catch {}
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Delete server group ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/servers/groups?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) loadData();
    } catch {}
  };

  const totalActiveAccounts = servers.reduce((acc, s) => acc + (s.activeAccounts || 0), 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-800 font-sans pb-16">
      {/* WHMCS Banner Header */}
      <div className="bg-[#1A4D80] text-white p-4 rounded shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-200 mb-1">
            <Link href="/admin/dashboard" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span>Setup</span>
            <span>/</span>
            <span>Products/Services</span>
            <span>/</span>
            <span className="text-white font-semibold">Servers</span>
          </div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Server className="w-5 h-5 text-amber-300" />
            <span>Servers & Provisioning Infrastructure</span>
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            Configure web hosting nodes (cPanel/WHM, DirectAdmin, Plesk), Cloud PBX clusters, and Virtualizor VPS nodes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'servers' ? (
            <button
              onClick={handleOpenAddServer}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3.5 py-1.5 rounded text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Server</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddGroup}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3.5 py-1.5 rounded text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'servers'
              ? 'border-[#1A4D80] text-[#1A4D80] bg-white rounded-t'
              : 'border-transparent text-slate-600 hover:text-[#1A4D80] hover:bg-slate-100 rounded-t'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Provisioning Servers ({servers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'groups'
              ? 'border-[#1A4D80] text-[#1A4D80] bg-white rounded-t'
              : 'border-transparent text-slate-600 hover:text-[#1A4D80] hover:bg-slate-100 rounded-t'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Server Groups ({serverGroups.length})</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Configured Servers</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline justify-between">
            <span>{servers.length}</span>
            <span className="text-xs font-normal text-emerald-600 font-sans">
              {servers.filter((s) => s.active === '1' || s.active === 1).length} Active Primary
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Primary cPanel Cluster</div>
          <div className="text-base font-bold text-slate-800 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">srv8 (125.253.92.7)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Port 2087 (SSL)</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Cloud PBX Cluster</div>
          <div className="text-base font-bold text-slate-800 mt-1 flex items-center space-x-1">
            <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">srv111-bdpbx-1</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">srv111.bdpbx.com:443</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Provisioned Accounts</div>
          <div className="text-2xl font-bold text-[#1A4D80] mt-1 font-mono">
            {totalActiveAccounts} Svc
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all servers</div>
        </div>
      </div>

      {/* Tab 1: Servers List */}
      {activeTab === 'servers' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
            <span className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#1A4D80]" />
              <span>Configured Provisioning Servers</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Click &quot;Test Connection&quot; to probe live API socket latency.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-4">Server Name</th>
                  <th className="py-3 px-4">Hostname</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-center">Module / Type</th>
                  <th className="py-3 px-4 text-center">Active Accounts</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servers.map((s) => {
                  const maxAcc = Number(s.maxaccounts || 200);
                  const activeAcc = s.activeAccounts || 0;
                  const percentUsed = Math.min(100, Math.round((activeAcc / maxAcc) * 100));

                  const test = testResult[s.id];

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                          <span>{s.name}</span>
                          {s.active === '1' || s.active === 1 ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              Primary
                            </span>
                          ) : null}
                        </div>
                        {test && (
                          <div
                            className={`text-[11px] font-medium mt-1 p-1 rounded flex items-center space-x-1 ${
                              test.ok
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {test.ok ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            )}
                            <span>{test.message}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700">{s.hostname || '-'}</td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {s.ipaddress || '-'}
                        {s.port && (
                          <span className="text-slate-400 text-[11px]">:{s.port}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            s.type === 'cpanel'
                              ? 'bg-amber-100 text-amber-800'
                              : s.type === 'pbx' || s.type === 'softcentspbx'
                              ? 'bg-indigo-100 text-indigo-800'
                              : s.type === 'virtualizor'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {s.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-bold text-slate-800">
                            {activeAcc} / {maxAcc}
                          </span>
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                percentUsed > 80 ? 'bg-rose-500' : percentUsed > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {s.disabled === '1' || s.disabled === 1 ? (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Disabled
                          </span>
                        ) : s.active === '1' || s.active === 1 ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                            Standby
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleTestConnection(s)}
                          disabled={testingId === s.id}
                          className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-2.5 py-1 rounded text-xs font-semibold transition-colors border border-slate-300 disabled:opacity-50"
                        >
                          {testingId === s.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin inline-block mr-1" />
                          ) : null}
                          <span>Test Connection</span>
                        </button>

                        <a
                          href={
                            s.type === 'cpanel'
                              ? `https://${s.hostname || s.ipaddress}:2087`
                              : `https://${s.hostname || s.ipaddress}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold transition-colors border border-slate-300 inline-flex items-center space-x-1"
                        >
                          <span>Login</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>

                        <button
                          onClick={() => handleOpenEditServer(s)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 rounded text-xs border border-slate-300 transition-colors inline-flex items-center"
                          title="Edit Server"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteServer(s.id, s.name)}
                          className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 p-1 rounded text-xs border border-rose-200 transition-colors inline-flex items-center"
                          title="Delete Server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Server Groups */}
      {activeTab === 'groups' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
            <span className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#1A4D80]" />
              <span>Server Groups ({serverGroups.length})</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Group servers to distribute automatic product provisioning.
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Group ID</th>
                <th className="py-3 px-4">Group Name</th>
                <th className="py-3 px-4">Fill Strategy</th>
                <th className="py-3 px-4">Assigned Servers</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serverGroups.map((g) => {
                const assigned = servers.filter((s) => (g.servers || []).includes(String(s.id)));

                return (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1A4D80]">#{g.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{g.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {g.filltype === '1'
                        ? 'Fill active server until full then switch to next'
                        : 'Add to the least full server'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {assigned.length > 0 ? (
                          assigned.map((s) => (
                            <span
                              key={s.id}
                              className="bg-blue-50 text-[#1A4D80] border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                            >
                              {s.name} ({s.type})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No servers assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEditGroup(g)}
                        className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-2.5 py-1 rounded text-xs font-semibold border border-slate-300 transition-colors"
                      >
                        Edit Group
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g.id, g.name)}
                        className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 px-2 py-1 rounded text-xs border border-rose-200 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Server Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1A4D80] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Server className="w-4 h-4 text-amber-300" />
                <span>{editingServer ? `Edit Server: ${editingServer.name}` : 'Add New Server'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServer} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Server Name *</label>
                  <input
                    type="text"
                    value={serverForm.name}
                    onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                    placeholder="e.g. srv9-singapore"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hostname *</label>
                  <input
                    type="text"
                    value={serverForm.hostname}
                    onChange={(e) => setServerForm({ ...serverForm, hostname: e.target.value })}
                    placeholder="e.g. srv9.whitednszone.com"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IP Address *</label>
                  <input
                    type="text"
                    value={serverForm.ipaddress}
                    onChange={(e) => setServerForm({ ...serverForm, ipaddress: e.target.value })}
                    placeholder="e.g. 103.145.118.68"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Module Type *</label>
                  <select
                    value={serverForm.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setServerForm({
                        ...serverForm,
                        type: t,
                        port: t === 'cpanel' ? '2087' : t === 'virtualizor' ? '4085' : '443',
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="cpanel">cPanel / WHM Web Hosting</option>
                    <option value="pbx">Softcents PBX / FusionPBX</option>
                    <option value="softcentspbx">Softcents PBX Enterprise</option>
                    <option value="virtualizor">Virtualizor VPS</option>
                    <option value="directadmin">DirectAdmin</option>
                    <option value="plesk">Plesk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={serverForm.username}
                    onChange={(e) => setServerForm({ ...serverForm, username: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="text"
                    value={serverForm.port}
                    onChange={(e) => setServerForm({ ...serverForm, port: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password / API Token</label>
                  <input
                    type="password"
                    value={serverForm.password}
                    onChange={(e) => setServerForm({ ...serverForm, password: e.target.value })}
                    placeholder="Enter root password or API token"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Accounts</label>
                  <input
                    type="number"
                    value={serverForm.maxaccounts}
                    onChange={(e) => setServerForm({ ...serverForm, maxaccounts: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Nameserver</label>
                  <input
                    type="text"
                    value={serverForm.nameserver1}
                    onChange={(e) => setServerForm({ ...serverForm, nameserver1: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Secondary Nameserver</label>
                  <input
                    type="text"
                    value={serverForm.nameserver2}
                    onChange={(e) => setServerForm({ ...serverForm, nameserver2: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={serverForm.secure === 'on'}
                    onChange={(e) => setServerForm({ ...serverForm, secure: e.target.checked ? 'on' : 'off' })}
                    className="rounded text-[#1A4D80]"
                  />
                  <span>Secure SSL Connection (HTTPS)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={serverForm.active}
                    onChange={(e) => setServerForm({ ...serverForm, active: e.target.checked })}
                    className="rounded text-[#1A4D80]"
                  />
                  <span>Active Primary Node</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold shadow-sm"
                >
                  Save Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Server Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="bg-[#1A4D80] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-300" />
                <span>{editingGroup ? `Edit Server Group: ${editingGroup.name}` : 'Create Server Group'}</span>
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. SG-Hosting or BDPBX GROUP"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fill Strategy</label>
                <select
                  value={groupForm.filltype}
                  onChange={(e) => setGroupForm({ ...groupForm, filltype: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                >
                  <option value="1">Fill active server until full then switch to next</option>
                  <option value="2">Add to the least full server</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Assign Servers to this Group:</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded p-2">
                  {servers.map((s) => {
                    const isChecked = groupForm.selectedServers.includes(String(s.id));
                    return (
                      <label key={s.id} className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGroupForm({
                                ...groupForm,
                                selectedServers: [...groupForm.selectedServers, String(s.id)],
                              });
                            } else {
                              setGroupForm({
                                ...groupForm,
                                selectedServers: groupForm.selectedServers.filter((id) => id !== String(s.id)),
                              });
                            }
                          }}
                          className="rounded text-[#1A4D80]"
                        />
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({s.hostname} - {s.type})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold shadow-sm"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
