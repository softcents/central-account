'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  Server,
  Box,
  Globe,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CreditCard,
  KeyRound,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  XCircle,
  HelpCircle,
  RefreshCw,
  HardDrive,
  Activity,
  ChevronRight,
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

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params.id as string) || '';

  // Find service in synced services
  const service = useMemo(() => {
    return (whmcsData?.services || []).find(
      (s: any) => String(s.id) === String(rawId)
    );
  }, [rawId]);

  // Find client
  const client = useMemo(() => {
    if (!service) return null;
    return (whmcsData?.clients || []).find(
      (c: any) => String(c.id) === String(service.userid)
    );
  }, [service]);

  // Modals state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Change password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancellation form state
  const [cancelReason, setCancelReason] = useState('');
  const [cancelType, setCancelType] = useState<'Immediate' | 'End of Billing Period'>('End of Billing Period');
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [cancelSubmitted, setCancelSubmitted] = useState(false);

  if (!service) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
        <ClientHeader />
        <main className="max-w-[1240px] mx-auto px-4 py-12 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-800">Service Not Found</h1>
          <p className="text-xs text-slate-500">
            The requested service ID #{rawId} could not be located in your account.
          </p>
          <Link
            href="/clientarea/services"
            className="inline-block bg-[#1A4D80] text-white px-5 py-2 rounded text-xs font-bold"
          >
            &larr; Back to My Services
          </Link>
        </main>
      </div>
    );
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPasswordMsg({
      type: 'success',
      text: 'Your service and control panel password has been successfully updated.',
    });
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordModalOpen(false);
      setPasswordMsg(null);
    }, 2500);
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please provide a brief reason for cancellation.');
      return;
    }
    setCancelSubmitted(true);
    setCancelMsg(
      `Your cancellation request for ${service.product_name || service.package} has been logged (${cancelType}). A ticket has been created for admin review.`
    );
    setTimeout(() => {
      setCancelModalOpen(false);
    }, 3000);
  };

  const serverUrl = service.server_hostname || service.server_ip || 'srv8.softcents.com';
  const cpanelUrl = `https://${serverUrl}:2083`;
  const webmailUrl = `https://${serverUrl}:2096`;

  const status = service.domainstatus || 'Active';
  const diskPct = service.disklimit && Number(service.disklimit) > 0
    ? Math.min(100, Math.round((Number(service.diskusage || 0) / Number(service.disklimit)) * 100))
    : 0;

  const bwPct = service.bwlimit && Number(service.bwlimit) > 0
    ? Math.min(100, Math.round((Number(service.bwusage || 0) / Number(service.bwlimit)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16">
      <ClientHeader />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex items-center text-xs text-slate-500">
          <Link href="/clientarea" className="hover:text-[#1A4D80]">
            Portal Home
          </Link>
          <ChevronRight className="w-3 h-3 mx-2 text-slate-400" />
          <Link href="/clientarea/services" className="hover:text-[#1A4D80]">
            My Products &amp; Services
          </Link>
          <ChevronRight className="w-3 h-3 mx-2 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {service.product_name || service.package}
          </span>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {service.product_name || service.package}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'Suspended'
                    ? 'bg-rose-100 text-rose-800'
                    : status === 'Pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Domain / Identifier: <strong className="font-mono text-[#1A4D80]">{service.domain || service.username || `Service #${service.id}`}</strong>
              {service.group_name && ` • Category: ${service.group_name}`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/clientarea/services"
              className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Services</span>
            </Link>
          </div>
        </div>

        {/* Cancellation Notice if submitted */}
        {cancelMsg && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{cancelMsg}</span>
          </div>
        )}

        {/* Suspension Reason Alert */}
        {status === 'Suspended' && (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r text-xs text-rose-900 space-y-1">
            <div className="font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Service Suspended</span>
            </div>
            <p>
              Reason: <strong>{service.suspendreason || 'Overdue invoice payment'}</strong>. Please pay any outstanding invoices or contact billing to reactivate.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Overview & Specs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information Box */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#1A4D80] text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                <Server className="w-4 h-4" />
                <span>Product Overview &amp; Specifications</span>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs divide-y sm:divide-y-0 divide-slate-100">
                <div className="space-y-1">
                  <div className="text-slate-500 font-medium">Registration / Activation Date</div>
                  <div className="font-bold text-slate-900 font-mono">
                    {formatWhmcsDate(service.regdate)}
                  </div>
                </div>

                <div className="space-y-1 pt-3 sm:pt-0">
                  <div className="text-slate-500 font-medium">Next Due Date</div>
                  <div className="font-bold text-slate-900 font-mono">
                    {formatWhmcsDate(service.nextduedate)}
                  </div>
                </div>

                <div className="space-y-1 pt-3 sm:pt-0">
                  <div className="text-slate-500 font-medium">Recurring Amount</div>
                  <div className="font-bold text-[#1A4D80] font-mono text-sm">
                    {parseFloat(service.amount || '0') === 0
                      ? 'Free'
                      : `৳${parseFloat(service.amount || '0').toFixed(2)} BDT`}
                    <span className="text-slate-500 text-xs font-normal ml-1">
                      / {service.billingcycle || 'Monthly'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-3 sm:pt-0">
                  <div className="text-slate-500 font-medium">First Payment Amount</div>
                  <div className="font-bold text-slate-900 font-mono">
                    ৳{parseFloat(service.firstpaymentamount || service.amount || '0').toFixed(2)} BDT
                  </div>
                </div>

                <div className="space-y-1 pt-3 sm:pt-0">
                  <div className="text-slate-500 font-medium">Payment Method</div>
                  <div className="font-bold text-slate-900 capitalize">
                    {service.paymentmethod || 'PipraPay (bKash / Nagad / Cards)'}
                  </div>
                </div>

                <div className="space-y-1 pt-3 sm:pt-0">
                  <div className="text-slate-500 font-medium">Assigned Server</div>
                  <div className="font-bold text-slate-900 font-mono">
                    {service.server_name || 'Production Server (srv8.softcents.com)'}
                  </div>
                </div>

                {service.dedicatedip && (
                  <div className="space-y-1 pt-3 sm:pt-0">
                    <div className="text-slate-500 font-medium">Dedicated IP Address</div>
                    <div className="font-bold text-[#1A4D80] font-mono">
                      {service.dedicatedip}
                    </div>
                  </div>
                )}

                {service.username && (
                  <div className="space-y-1 pt-3 sm:pt-0">
                    <div className="text-slate-500 font-medium">Primary Username</div>
                    <div className="font-bold text-slate-900 font-mono">
                      {service.username}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disk & Bandwidth Resource Usage (if available) */}
            {(Number(service.disklimit || 0) > 0 || Number(service.bwlimit || 0) > 0) && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#1A4D80]" />
                  <span>Resource Usage Statistics</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Disk Usage */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Disk Space Usage</span>
                      <span className="font-mono">{service.diskusage || 0} MB / {service.disklimit} MB</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${diskPct > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${diskPct}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">{diskPct}% used</div>
                  </div>

                  {/* Bandwidth Usage */}
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Bandwidth Usage</span>
                      <span className="font-mono">{service.bwusage || 0} MB / {service.bwlimit} MB</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${bwPct > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
                        style={{ width: `${bwPct}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">{bwPct}% used</div>
                  </div>
                </div>
              </div>
            )}

            {/* Nameservers (if hosting) */}
            {(service.ns1 || service.ns2) && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Assigned Hosting Nameservers</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                  {service.ns1 && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Nameserver 1:</span>
                      <span className="font-bold text-[#1A4D80]">{service.ns1}</span>
                    </div>
                  )}
                  {service.ns2 && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Nameserver 2:</span>
                      <span className="font-bold text-[#1A4D80]">{service.ns2}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Actions & Shortcuts */}
          <div className="space-y-4">
            {/* Quick Logins Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100 text-slate-800 px-4 py-2.5 border-b border-slate-200 font-bold text-xs flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-[#1A4D80]" />
                <span>Control Panel &amp; Logins</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <a
                  href={cpanelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#ff6c2c] hover:bg-[#e0581b] text-white font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center space-x-2 shadow-xs"
                >
                  <Server className="w-4 h-4" />
                  <span>Log in to cPanel</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={webmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center space-x-2 shadow-xs"
                >
                  <Globe className="w-4 h-4" />
                  <span>Log in to Webmail</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Management Actions */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100 text-slate-800 px-4 py-2.5 border-b border-slate-200 font-bold text-xs flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-slate-600" />
                <span>Service Actions</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Change Service Password</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <Link
                  href={`/support/new?subject=Support request for service #${service.id} (${service.domain || service.package})`}
                  className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>Open Support Ticket</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="w-full text-left px-4 py-3 text-rose-700 hover:bg-rose-50 flex items-center justify-between transition-colors font-semibold"
                >
                  <span className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Request Cancellation</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CHANGE PASSWORD MODAL */}
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="bg-[#1A4D80] text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Change Service Password</span>
                </div>
                <button
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordMsg(null);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4 text-xs">
                {passwordMsg && (
                  <div
                    className={`p-3 rounded font-semibold flex items-center space-x-2 border ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <p className="text-slate-600">
                  Update the login password for <strong>{service.username || service.domain}</strong>.
                  This will synchronize with your cPanel and FTP accounts.
                </p>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    New Service Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordModalOpen(false);
                      setPasswordMsg(null);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold"
                  >
                    Save New Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CANCELLATION REQUEST MODAL */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>Request Cancellation</span>
                </div>
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCancelSubmit} className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800">
                  You are requesting cancellation for: <strong>{service.product_name || service.package} ({service.domain || service.username || `#${service.id}`})</strong>.
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reason for Cancellation
                  </label>
                  <textarea
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please briefly explain why you are requesting cancellation..."
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-rose-600"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Cancellation Type
                  </label>
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cancelType"
                        value="End of Billing Period"
                        checked={cancelType === 'End of Billing Period'}
                        onChange={() => setCancelType('End of Billing Period')}
                      />
                      <span>End of Current Billing Period ({formatWhmcsDate(service.nextduedate)})</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="cancelType"
                        value="Immediate"
                        checked={cancelType === 'Immediate'}
                        onChange={() => setCancelType('Immediate')}
                      />
                      <span className="text-rose-700 font-semibold">Immediate (Service stopped immediately)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Keep Service
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-2 rounded font-bold"
                  >
                    Confirm Cancellation Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
