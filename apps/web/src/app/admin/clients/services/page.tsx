'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Server,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Calendar,
  Layers,
  ArrowUpDown,
  Terminal,
  Play,
  Pause,
  Trash2,
  KeyRound,
  LogIn,
  CheckCircle2,
  X,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function formatWhmcsDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000')) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function ServicesListPage() {
  const [services, setServices] = useState<any[]>(whmcsData?.services || []);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serverFilter, setServerFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Module command states
  const [selectedServiceForCmd, setSelectedServiceForCmd] = useState<any | null>(null);
  const [executingCmd, setExecutingCmd] = useState(false);
  const [commandToast, setCommandToast] = useState<{ ok: boolean; message: string } | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const servers = whmcsData?.servers || [];

  const handleExecuteModuleCommand = async (command: string) => {
    if (!selectedServiceForCmd) return;
    setExecutingCmd(true);
    setCommandToast(null);

    try {
      const res = await fetch('/api/admin/services/module-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceForCmd.id,
          command,
          suspendReason: suspendReasonInput || 'Administrative Command',
          newPassword: passwordInput || 'Pass@' + Math.floor(100000 + Math.random() * 900000),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCommandToast({ ok: true, message: data.message });
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank');
        }
        if (data.newStatus) {
          setServices((prev) =>
            prev.map((s) => (s.id === selectedServiceForCmd.id ? { ...s, domainstatus: data.newStatus } : s))
          );
          setSelectedServiceForCmd((prev: any) => prev ? { ...prev, domainstatus: data.newStatus } : null);
        }
      } else {
        setCommandToast({ ok: false, message: data.error || 'Command execution failed' });
      }
    } catch (err: any) {
      setCommandToast({ ok: false, message: err.message || 'Network error' });
    } finally {
      setExecutingCmd(false);
    }
  };

  const filtered = useMemo(() => {
    let list = services.filter((s) => {
      if (statusFilter !== 'ALL' && (s.domainstatus || '').toUpperCase() !== statusFilter) return false;
      if (serverFilter !== 'ALL' && s.server_name !== serverFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (s.domain || '').toLowerCase().includes(q) ||
          (s.clientName || '').toLowerCase().includes(q) ||
          (s.clientCompany || '').toLowerCase().includes(q) ||
          (s.package || '').toLowerCase().includes(q) ||
          (s.product_name || '').toLowerCase().includes(q) ||
          (s.group_name || '').toLowerCase().includes(q) ||
          (s.username || '').toLowerCase().includes(q) ||
          (s.regdate || '').includes(q) ||
          String(s.id).includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      const dateA = a.regdate ? new Date(a.regdate).getTime() : 0;
      const dateB = b.regdate ? new Date(b.regdate).getTime() : 0;
      if (dateA !== dateB) {
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      return sortOrder === 'desc' ? Number(b.id) - Number(a.id) : Number(a.id) - Number(b.id);
    });

    return list;
  }, [services, statusFilter, serverFilter, search, sortOrder]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeCount = services.filter((s) => s.domainstatus === 'Active').length;
  const suspendedCount = services.filter((s) => s.domainstatus === 'Suspended').length;
  const pendingCount = services.filter((s) => s.domainstatus === 'Pending').length;
  const cancelledCount = services.filter((s) => s.domainstatus === 'Cancelled').length;
  const terminatedCount = services.filter((s) => s.domainstatus === 'Terminated').length;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/clients" className="text-[#1A4D80] hover:underline font-semibold">
          Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Products / Services ({services.length})</span>
      </div>

      {/* WHMCS Quick Status Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <button
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-[#1A4D80] text-white border-[#1A4D80] shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-slate-600">All Services</div>
          <div className="text-xl font-bold mt-1">{services.length}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-emerald-600">Active (Correct)</div>
          <div className="text-xl font-bold mt-1">{activeCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('SUSPENDED'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'SUSPENDED'
              ? 'bg-rose-700 text-white border-rose-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-rose-600">Suspended</div>
          <div className="text-xl font-bold mt-1">{suspendedCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-600 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-amber-600">Pending</div>
          <div className="text-xl font-bold mt-1">{pendingCount}</div>
        </button>
        <button
          onClick={() => { setStatusFilter('CANCELLED'); setCurrentPage(1); }}
          className={`p-3 rounded border text-left transition-all ${
            statusFilter === 'CANCELLED'
              ? 'bg-slate-700 text-white border-slate-700 shadow'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="font-semibold text-slate-500">Cancelled / Term.</div>
          <div className="text-xl font-bold mt-1">{cancelledCount + terminatedCount}</div>
        </button>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by product, client, domain, or date (DD/MM/YYYY)..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
            />
          </div>

          <select
            value={serverFilter}
            onChange={(e) => { setServerFilter(e.target.value); setCurrentPage(1); }}
            className="p-1.5 border border-slate-300 rounded bg-white font-medium"
          >
            <option value="ALL">All Server Nodes</option>
            {servers.map((srv: any) => (
              <option key={srv.id} value={srv.name}>{srv.name} ({srv.ipaddress})</option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold"
            title="Toggle Date Sorting Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Date: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/servers"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium border border-slate-300 transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Server Nodes ({servers.length})</span>
          </Link>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f5f7f8] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Product / Service</th>
                <th className="py-2.5 px-3">Domain / IP / User</th>
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1A4D80]" />
                    <span>Activation Date</span>
                  </div>
                </th>
                <th className="py-2.5 px-3">Billing Cycle</th>
                <th className="py-2.5 px-3">Pricing</th>
                <th className="py-2.5 px-3">Next Due Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No services found matching your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">#{s.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{s.product_name || s.package || 'Service'}</span>
                        {s.group_name && (
                          <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                            {s.group_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-700">{s.domain || s.username || '-'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/admin/clients/${s.userid}`}
                        className="text-[#1A4D80] hover:underline font-semibold block"
                      >
                        {s.clientName}
                      </Link>
                      {s.clientCompany && (
                        <span className="text-[10px] text-slate-500">{s.clientCompany}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-[#1A4D80] bg-slate-50/60">
                      {s.regdate_display || formatWhmcsDate(s.regdate)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.billingcycle || 'Monthly'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">৳{parseFloat(s.amount || '0').toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {s.nextduedate_display || formatWhmcsDate(s.nextduedate)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.domainstatus === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.domainstatus === 'Suspended'
                            ? 'bg-rose-100 text-rose-800'
                            : s.domainstatus === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.domainstatus || 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedServiceForCmd(s);
                            setCommandToast(null);
                            setSuspendReasonInput(s.suspendreason || '');
                          }}
                          className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors border border-slate-300 flex items-center space-x-1"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>Module</span>
                        </button>

                        <Link
                          href={`/admin/clients/${s.userid}?tab=services`}
                          className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-[#f9fafb]">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </div>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-200"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-[#1A4D80]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-50 hover:bg-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* WHMCS Module Command Execution Modal */}
      {selectedServiceForCmd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full overflow-hidden text-xs">
            <div className="bg-[#1A4D80] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-amber-300" />
                <span>
                  Module Commands: #{selectedServiceForCmd.id} - {selectedServiceForCmd.product_name || selectedServiceForCmd.package}
                </span>
              </h3>
              <button
                onClick={() => setSelectedServiceForCmd(null)}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Service & Server Context */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Domain / Host:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedServiceForCmd.domain || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Username:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedServiceForCmd.username || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Server:</span>
                  <span className="font-bold text-[#1A4D80]">{selectedServiceForCmd.server_name || 'srv8 cPanel'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Status:</span>
                  <span className="font-bold uppercase text-emerald-700">{selectedServiceForCmd.domainstatus}</span>
                </div>
              </div>

              {/* Toast Result Message */}
              {commandToast && (
                <div
                  className={`p-3 rounded border flex items-start space-x-2 ${
                    commandToast.ok
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {commandToast.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-medium leading-relaxed">{commandToast.message}</span>
                </div>
              )}

              {/* WHMCS Standard Module Command Actions */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Execute WHMCS Provisioning Command:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    disabled={executingCmd}
                    onClick={() => handleExecuteModuleCommand('create')}
                    className="p-2.5 rounded bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </button>

                  <button
                    disabled={executingCmd}
                    onClick={() => handleExecuteModuleCommand('suspend')}
                    className="p-2.5 rounded bg-[#f0ad4e] hover:bg-[#ec971f] text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>

                  <button
                    disabled={executingCmd}
                    onClick={() => handleExecuteModuleCommand('unsuspend')}
                    className="p-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Unsuspend</span>
                  </button>

                  <button
                    disabled={executingCmd}
                    onClick={() => {
                      if (confirm('Are you sure you want to terminate this service from the server? All data will be removed.')) {
                        handleExecuteModuleCommand('terminate');
                      }
                    }}
                    className="p-2.5 rounded bg-[#d9534f] hover:bg-[#c9302c] text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Terminate</span>
                  </button>

                  <button
                    disabled={executingCmd}
                    onClick={() => handleExecuteModuleCommand('changepw')}
                    className="p-2.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change PW</span>
                  </button>

                  <button
                    disabled={executingCmd}
                    onClick={() => handleExecuteModuleCommand('loginto')}
                    className="p-2.5 rounded bg-[#1A4D80] hover:bg-[#143d66] text-white font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login (SSO)</span>
                  </button>
                </div>
              </div>

              {/* Optional Parameters for Suspend / Password */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Suspension Reason (for Suspend)</label>
                  <input
                    type="text"
                    value={suspendReasonInput}
                    onChange={(e) => setSuspendReasonInput(e.target.value)}
                    placeholder="e.g. Overdue payment invoice #412"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">New Password (for Change PW)</label>
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Leave blank for random strong"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedServiceForCmd(null)}
                className="px-4 py-1.5 border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
