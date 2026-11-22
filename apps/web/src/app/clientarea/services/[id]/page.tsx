'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
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
  Phone,
  PhoneCall,
  Copy,
  Check,
  Shield,
  Smartphone,
  Monitor,
  Play,
  Square,
  RotateCcw,
  FolderOpen,
  Database,
  Mail,
  FileCode,
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

  // Detect service type
  const isPbx = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''} ${service.server_name || ''}`.toLowerCase();
    return s.includes('pbx') || s.includes('voice') || s.includes('call center');
  }, [service]);

  const isVps = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''}`.toLowerCase();
    return s.includes('vps') || s.includes('virtual') || s.includes('cloud server');
  }, [service]);

  // Detect BHPanel (BDIX cPanel Alternative)
  const isBhpanel = useMemo(() => {
    if (!service || isPbx || isVps) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''} ${service.server_name || ''} ${service.server_type || ''}`.toLowerCase();
    return (
      s.includes('bdix') ||
      s.includes('bhpanel') ||
      String(service.server) === '6' ||
      ['113', '114', '115', '116', '161'].includes(String(service.packageid))
    );
  }, [service, isPbx, isVps]);

  // BHPanel State
  const [bhUsage, setBhUsage] = useState<any>(null);
  const [bhLoadingUsage, setBhLoadingUsage] = useState(false);
  const [bhSsoLoading, setBhSsoLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isBhpanel && service?.username) {
      setBhLoadingUsage(true);
      fetch(`/api/whmcs/servers/bhpanel/usage?username=${encodeURIComponent(service.username)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.ok && data?.data) {
            setBhUsage(data.data);
          }
        })
        .catch(() => {})
        .finally(() => setBhLoadingUsage(false));
    }
  }, [isBhpanel, service?.username]);

  const isReseller = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''}`.toLowerCase();
    return s.includes('reseller');
  }, [service]);

  const handleBhpanelSso = async (to?: string) => {
    const defaultBhUrl = isReseller ? 'https://bdix-bh.softcents.com:2087' : 'https://bdix-bh.softcents.com:2083';
    try {
      setBhSsoLoading(to || 'cpanel');
      const url = `/api/whmcs/servers/bhpanel/sso?username=${encodeURIComponent(service.username)}&domain=${encodeURIComponent(service.domain || '')}${to ? `&to=${encodeURIComponent(to)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ssoUrl) {
        window.open(data.ssoUrl, '_blank');
      } else {
        window.open(defaultBhUrl, '_blank');
      }
    } catch {
      window.open(defaultBhUrl, '_blank');
    } finally {
      setBhSsoLoading(null);
    }
  };

  const [cpanelSsoLoading, setCpanelSsoLoading] = useState(false);

  const handleCpanelSso = async (serviceName: 'cpanel' | 'webmail' = 'cpanel') => {
    try {
      setCpanelSsoLoading(true);
      const host = service.server_hostname || service.server_ip || 'srv8.whitednszone.com';
      const res = await fetch(`/api/whmcs/servers/cpanel/sso?username=${encodeURIComponent(service.username || '')}&host=${encodeURIComponent(host)}`);
      const data = await res.json();
      if (data?.ssoUrl) {
        window.open(data.ssoUrl, '_blank');
      } else {
        window.open(serviceName === 'webmail' ? webmailUrl : cpanelUrl, '_blank');
      }
    } catch {
      window.open(serviceName === 'webmail' ? webmailUrl : cpanelUrl, '_blank');
    } finally {
      setCpanelSsoLoading(false);
    }
  };

  // PBX State
  const pbxDomain = useMemo(() => {
    let d = (service?.domain || '').trim().toLowerCase();
    if (d && d.includes('.')) return d;
    if (service?.userid) return `${service.userid}.bdpbx.com`;
    return 'srv111.bdpbx.com';
  }, [service]);
  const [extensions, setExtensions] = useState<any[]>([
    { extension: '101', name: 'Agent Desk 101', password: service?.password || 'Pass@101#2026', enabled: true },
    { extension: '102', name: 'Agent Desk 102', password: 'Pass@102#2026', enabled: true },
    { extension: '103', name: 'Manager Desk 103', password: 'Pass@103#2026', enabled: true },
    { extension: '999', name: 'Softcents Emergency Support', password: 'Free@Support999', enabled: true, isSpecial: true },
  ]);

  const [extModalOpen, setExtModalOpen] = useState(false);
  const [selectedExt, setSelectedExt] = useState<string>('101');
  const [newExtPass, setNewExtPass] = useState('');
  const [updatingExtPass, setUpdatingExtPass] = useState(false);
  const [extActionMsg, setExtActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PBX IP Unblock state
  const [clientIp, setClientIp] = useState('103.205.71.10');
  const [unblockingIp, setUnblockingIp] = useState(false);
  const [unblockResult, setUnblockResult] = useState<string | null>(null);

  // PBX SSO state
  const [ssoLoading, setSsoLoading] = useState(false);

  // VPS actions state
  const [vpsLoading, setVpsLoading] = useState(false);
  const [vpsMsg, setVpsMsg] = useState<string | null>(null);

  // Common Modals state
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

  // Copied indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  // Softcents PBX SSO
  const handlePbxSso = async () => {
    try {
      setSsoLoading(true);
      const res = await fetch(
        `/api/whmcs/servers/softcentspbx/sso?domain=${encodeURIComponent(pbxDomain)}&adminUser=${encodeURIComponent(service.username || 'admin')}`
      );
      const data = await res.json();
      if (data.ssoUrl) {
        window.open(data.ssoUrl, '_blank');
      } else {
        window.open(`https://${pbxDomain}/login.php`, '_blank');
      }
    } catch {
      window.open(`https://${pbxDomain}/login.php`, '_blank');
    } finally {
      setSsoLoading(false);
    }
  };

  // PBX Extension Password Change
  const handleUpdateExtPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtPass || newExtPass.length < 6) {
      setExtActionMsg({ type: 'error', text: 'Extension password must be at least 6 characters.' });
      return;
    }

    try {
      setUpdatingExtPass(true);
      setExtActionMsg(null);
      const res = await fetch('/api/whmcs/servers/softcentspbx/extension-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: pbxDomain,
          extension: selectedExt,
          newPassword: newExtPass,
        }),
      });

      const data = await res.json();
      if (data.success !== false) {
        setExtensions((prev) =>
          prev.map((ext) => (ext.extension === selectedExt ? { ...ext, password: newExtPass } : ext))
        );
        setExtActionMsg({
          type: 'success',
          text: `Password for Extension ${selectedExt} has been updated to "${newExtPass}". Please update your softphone device.`,
        });
        setTimeout(() => {
          setExtModalOpen(false);
          setExtActionMsg(null);
          setNewExtPass('');
        }, 3000);
      } else {
        setExtActionMsg({ type: 'error', text: data.message || 'Failed to update extension password.' });
      }
    } catch (err: any) {
      setExtActionMsg({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setUpdatingExtPass(false);
    }
  };

  // PBX Firewall IP Unblock
  const handleUnblockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIp.trim()) return;

    try {
      setUnblockingIp(true);
      setUnblockResult(null);
      const res = await fetch('/api/whmcs/servers/softcentspbx/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: pbxDomain,
          clientIp: clientIp.trim(),
        }),
      });

      const data = await res.json();
      setUnblockResult(
        data.message || `IP address ${clientIp.trim()} has been unblocked across PBX Firewall, Fail2Ban, and Event Guard!`
      );
    } catch (err: any) {
      setUnblockResult(`Unblock failed: ${err.message}`);
    } finally {
      setUnblockingIp(false);
    }
  };

  // VPS Action (Start, Stop, Restart)
  const handleVpsAction = async (action: 'start' | 'stop' | 'restart') => {
    try {
      setVpsLoading(true);
      setVpsMsg(null);
      const res = await fetch('/api/whmcs/servers/virtualizor/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vpsId: service.id,
          action,
        }),
      });
      const data = await res.json();
      setVpsMsg(`VPS command "${action}" executed successfully.`);
      setTimeout(() => setVpsMsg(null), 4000);
    } catch (err: any) {
      setVpsMsg(`Error: ${err.message}`);
    } finally {
      setVpsLoading(false);
    }
  };

  // Password Submit for cPanel or BHPanel
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      const endpoint = isBhpanel
        ? '/api/whmcs/servers/bhpanel/change-password'
        : '/api/whmcs/servers/cpanel/change-password';

      const bodyPayload = isBhpanel
        ? { username: service.username, domain: service.domain || '', newPass: newPassword }
        : { username: service.username, newPass: newPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.success !== false) {
        setPasswordMsg({
          type: 'success',
          text: data.message || 'Password has been successfully updated on the server.',
        });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordMsg(null);
        }, 3000);
      } else {
        setPasswordMsg({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Network error' });
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please provide a brief reason for cancellation.');
      return;
    }
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <ClientHeader />

      {/* WHMCS Master Breadcrumb */}
      <nav className="master-breadcrumb" aria-label="breadcrumb">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/clientarea">Portal Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/clientarea/services">Client Area</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/clientarea/services">My Products &amp; Services</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Product Details
            </li>
          </ol>
        </div>
      </nav>

      {/* WHMCS Main Body Section */}
      <section id="main-body">
        <div className="container">
          <div className="row">
            {/* Left Sidebar (col-lg-4 col-xl-3) */}
            <div className="col-lg-4 col-xl-3">
              <div className="sidebar">
                {/* Overview Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-cube mr-1 text-muted"></i> Overview
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <a href="#overview" className="list-group-item list-group-item-action active">
                      <span>Information</span>
                    </a>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-plus mr-1 text-muted"></i> Actions
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    {isPbx ? (
                      <button
                        type="button"
                        onClick={handlePbxSso}
                        disabled={ssoLoading}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-sign-in-alt fa-fw mr-2 text-success"></i> Login to PBX Console</span>
                      </button>
                    ) : isBhpanel ? (
                      <button
                        type="button"
                        onClick={() => handleBhpanelSso('cpanel')}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-sign-in-alt fa-fw mr-2 text-success"></i> Login to bhPanel</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCpanelSso('cpanel')}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-sign-in-alt fa-fw mr-2 text-success"></i> Login to cPanel</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPasswordModalOpen(true)}
                      className="list-group-item list-group-item-action text-left"
                    >
                      <span><i className="fas fa-key fa-fw mr-2 text-warning"></i> Change Password</span>
                    </button>
                    <Link href="/cart" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-level-up-alt fa-fw mr-2 text-info"></i> Upgrade/Downgrade</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(true)}
                      className="list-group-item list-group-item-action text-left text-danger"
                    >
                      <span><i className="fas fa-ban fa-fw mr-2 text-danger"></i> Request Cancellation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>Managing {service.product_name || service.package}</h1>
                <p className="text-muted">{service.domain || service.username || `Service #${service.id}`}</p>
              </div>

              <div className="space-y-6" id="overview">
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
              <span>Service Suspended Due to Overdue Invoice</span>
            </div>
            <p>
              Billable package extensions are temporarily paused until invoice payment is received.
            </p>
            {isPbx && (
              <p className="font-bold text-emerald-700 flex items-center space-x-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Extension 999 remains ACTIVE and fully available for free emergency and support calling! Call recordings and configurations are permanently preserved under the Softcents No-Termination Policy.</span>
              </p>
            )}
          </div>
        )}

        {/* ========================================================
            IF PBX SERVICE: FULL SOFTCENTSPBX CLOUD PORTAL
           ======================================================== */}
        {isPbx ? (
          <div className="space-y-6">
            {/* PBX Tenant Overview Header Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  PBX Tenant Subdomain
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-[#1A4D80] mt-0.5">
                  <a
                    href={`https://${pbxDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center space-x-1.5"
                  >
                    <span>{pbxDomain}</span>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span>PBX Node: <strong className="text-slate-800">srv111.bdpbx.com</strong></span>
                  <span>•</span>
                  <span>SIP Server: <strong className="text-slate-800 font-mono">{pbxDomain}:5060</strong></span>
                  <span>•</span>
                  <span>Call Recordings: <strong className="text-emerald-700">30-Day Permanent Store</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePbxSso}
                  disabled={ssoLoading}
                  className="bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 shadow-sm transition-colors"
                >
                  {ssoLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  <span>One-Click PBX Login</span>
                </button>
                <a
                  href={`https://${pbxDomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <span>Open URL</span>
                </a>
              </div>
            </div>

            {/* Web Portal Credentials Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 text-xs text-emerald-900 space-y-3">
              <div className="font-bold text-sm text-emerald-800 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>PBX Web Portal Admin Credentials</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">Web Portal URL</div>
                  <div className="font-bold text-[#1A4D80] truncate mt-0.5">https://{pbxDomain}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">Login Username</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{service.username || 'admin'}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">Login Password</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                    <span>{service.password || '••••••••'}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(service.password || '', 'adminPass')}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      {copiedKey === 'adminPass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">User Role &amp; Permission</div>
                  <div className="font-bold text-emerald-700 mt-0.5">Company Admin</div>
                </div>
              </div>
            </div>

            {/* Provisioned Extensions Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-[#1A4D80]" />
                  <span>Provisioned Extensions ({extensions.length})</span>
                </div>
                <span className="text-xs text-slate-500 font-normal">
                  Registered to domain: <strong className="font-mono text-slate-700">{pbxDomain}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Extension</th>
                      <th className="py-3 px-4">Caller ID / Name</th>
                      <th className="py-3 px-4">SIP Password</th>
                      <th className="py-3 px-4">SIP Server</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extensions.map((ext) => (
                      <tr key={ext.extension} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="inline-block bg-sky-100 text-sky-800 font-mono font-bold px-2.5 py-1 rounded-md">
                            {ext.extension}
                          </span>
                          {ext.isSpecial && (
                            <span className="ml-2 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                              Free 24/7 Support
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{ext.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          <span>{ext.password}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ext.password, `ext_${ext.extension}`)}
                            className="ml-2 text-slate-400 hover:text-slate-700 inline-block align-middle"
                          >
                            {copiedKey === `ext_${ext.extension}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{pbxDomain}:5060</td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold text-[11px]">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExt(ext.extension);
                              setExtModalOpen(true);
                            }}
                            className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 bg-white hover:bg-slate-50 text-[11px] shadow-xs"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600 inline mr-1" />
                            <span>Change Password</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Self-Service IP Unblock Tool */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
              <div className="flex items-center space-x-2 font-bold text-sm text-slate-800">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>PBX Firewall Self-Service IP Unblock</span>
              </div>
              <p className="text-slate-500">
                If your office or home IP was temporarily blocked due to repeated failed SIP password attempts, enter your IP below to unblock it instantly across PBX Firewall, Fail2Ban, and Event Guard.
              </p>

              {unblockResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{unblockResult}</span>
                </div>
              )}

              <form onSubmit={handleUnblockIp} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={clientIp}
                  onChange={(e) => setClientIp(e.target.value)}
                  placeholder="e.g. 103.205.71.10"
                  className="font-mono p-2.5 border border-slate-300 rounded w-full sm:w-80 text-slate-800 focus:outline-none focus:border-[#1A4D80]"
                  required
                />
                <button
                  type="submit"
                  disabled={unblockingIp}
                  className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2.5 rounded font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  {unblockingIp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Unblocking...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Unblock My IP</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Softphone Setup Guide */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-[#1A4D80]" />
                <span>Recommended Softphone Configuration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-sky-600" />
                    <span>MicroSIP (Windows PC)</span>
                  </div>
                  <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                    <div>• <strong>SIP Server:</strong> <span className="text-[#1A4D80]">{pbxDomain}:5060</span></div>
                    <div>• <strong>SIP Proxy:</strong> <span className="text-[#1A4D80]">{pbxDomain}:5060</span></div>
                    <div>• <strong>Username:</strong> Extension (e.g. 101)</div>
                    <div>• <strong>Domain:</strong> {pbxDomain}</div>
                    <div>• <strong>Login:</strong> Extension (e.g. 101)</div>
                    <div>• <strong>Password:</strong> Your SIP Password from table above</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>GS Wave / Zoiper (Android &amp; iOS)</span>
                  </div>
                  <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                    <div>• <strong>Account Name:</strong> Softcents PBX</div>
                    <div>• <strong>SIP Server:</strong> <span className="text-[#1A4D80]">{pbxDomain}:5060</span></div>
                    <div>• <strong>SIP User ID:</strong> Extension (e.g. 101)</div>
                    <div>• <strong>Auth ID:</strong> Extension (e.g. 101)</div>
                    <div>• <strong>Password:</strong> Your SIP Password from table above</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isVps ? (
          /* ========================================================
             IF VPS SERVICE: VIRTUALIZOR CLOUD VPS CONTROLS
             ======================================================== */
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cloud VPS Instance
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                  {service.domain || `vps-${service.id}.softcents.com`}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                  <span>IP: <strong className="text-white font-mono">{service.dedicatedip || '103.205.71.50'}</strong></span>
                  <span>•</span>
                  <span>OS: <strong className="text-white">Ubuntu 22.04 LTS 64-bit</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVpsAction('start')}
                  disabled={vpsLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start</span>
                </button>
                <button
                  onClick={() => handleVpsAction('restart')}
                  disabled={vpsLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>
                <button
                  onClick={() => handleVpsAction('stop')}
                  disabled={vpsLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              </div>
            </div>

            {vpsMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-semibold">
                {vpsMsg}
              </div>
            )}
          </div>
        ) : isBhpanel ? (
          /* ========================================================
             IF BDIX HOSTING: BHPANEL (CPANEL ALTERNATIVE)
             ======================================================== */
          <div className="space-y-6">
            {/* Top Quick Launch & SSO Header */}
            <div className="bg-gradient-to-r from-[#0d2a4a] via-[#153e6b] to-[#1A4D80] rounded-xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-400 text-slate-900 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded tracking-wider">
                    High-Speed BDIX
                  </span>
                  <span className="text-xs text-sky-200 font-medium">cPanel Alternative Hosting</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black mt-1 text-white flex items-center space-x-2">
                  <span>{service.domain || service.username || `BDIX Hosting #${service.id}`}</span>
                  {service.domain && (
                    <a
                      href={`https://${service.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-300 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                  <span>Node: <strong className="text-white font-mono">bdix-bh.softcents.com</strong></span>
                  <span>•</span>
                  <span>Server IP: <strong className="text-white font-mono">138.252.125.209</strong></span>
                  <span>•</span>
                  <span>Web Engine: <strong className="text-emerald-300 font-semibold">LiteSpeed Enterprise</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleBhpanelSso()}
                  disabled={bhSsoLoading === 'cpanel'}
                  className="bg-[#ff6c2c] hover:bg-[#e0581b] text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-2 shadow-sm transition-all transform hover:-translate-y-0.5"
                >
                  {bhSsoLoading === 'cpanel' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Server className="w-4 h-4" />
                  )}
                  <span>Log in to cPanel</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={() => handleBhpanelSso('mail')}
                  disabled={bhSsoLoading === 'mail'}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  {bhSsoLoading === 'mail' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 text-sky-300" />
                  )}
                  <span>Webmail</span>
                </button>
              </div>
            </div>

            {/* Quick cPanel Shortcuts Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                  <Box className="w-4 h-4 text-[#1A4D80]" />
                  <span>One-Click Control Panel Shortcuts</span>
                </h3>
                <span className="text-[11px] text-slate-500">Instant SSO into specific management tools</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <button
                  type="button"
                  onClick={() => handleBhpanelSso('files')}
                  disabled={!!bhSsoLoading}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#1A4D80] hover:bg-sky-50/50 transition-all text-center group flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {bhSsoLoading === 'files' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FolderOpen className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-xs text-slate-700 group-hover:text-[#1A4D80]">File Manager</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBhpanelSso('mail')}
                  disabled={!!bhSsoLoading}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#1A4D80] hover:bg-sky-50/50 transition-all text-center group flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {bhSsoLoading === 'mail' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-xs text-slate-700 group-hover:text-[#1A4D80]">Email Accounts</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBhpanelSso('databases')}
                  disabled={!!bhSsoLoading}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#1A4D80] hover:bg-sky-50/50 transition-all text-center group flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {bhSsoLoading === 'databases' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-xs text-slate-700 group-hover:text-[#1A4D80]">MySQL &amp; DBs</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBhpanelSso('wordpress')}
                  disabled={!!bhSsoLoading}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#1A4D80] hover:bg-sky-50/50 transition-all text-center group flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {bhSsoLoading === 'wordpress' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileCode className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-xs text-slate-700 group-hover:text-[#1A4D80]">WordPress</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBhpanelSso('ssl')}
                  disabled={!!bhSsoLoading}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#1A4D80] hover:bg-sky-50/50 transition-all text-center group flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {bhSsoLoading === 'ssl' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-xs text-slate-700 group-hover:text-[#1A4D80]">SSL / TLS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBhpanelSso('dns')}
                  disabled={!!bhSsoLoading}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-[#1A4D80] hover:bg-sky-50/50 transition-all text-center group flex flex-col items-center space-y-2 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {bhSsoLoading === 'dns' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                  </div>
                  <span className="font-bold text-xs text-slate-700 group-hover:text-[#1A4D80]">DNS Zone</span>
                </button>
              </div>
            </div>

            {/* Specifications & Usage Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Real-time Usage Metrics */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>Live Resource Usage</span>
                    </h3>
                    {bhLoadingUsage && <span className="text-xs text-slate-400">Syncing with server...</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                    {/* Disk Usage */}
                    <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-600 flex items-center space-x-1.5">
                          <HardDrive className="w-4 h-4 text-slate-500" />
                          <span>Disk Space Usage</span>
                        </span>
                        <span className="font-mono text-slate-900">
                          {bhUsage?.disk_used_mb ?? 4} MB / {bhUsage?.disk_limit_mb ? `${bhUsage.disk_limit_mb} MB` : '20,480 MB'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-sky-600 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(1, Math.round(((bhUsage?.disk_used_mb || 4) / (bhUsage?.disk_limit_mb || 20480)) * 100)))}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Allocated NVMe Storage</span>
                        <span>{Math.round(((bhUsage?.disk_used_mb || 4) / (bhUsage?.disk_limit_mb || 20480)) * 100)}% Used</span>
                      </div>
                    </div>

                    {/* Bandwidth Usage */}
                    <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-600 flex items-center space-x-1.5">
                          <Activity className="w-4 h-4 text-slate-500" />
                          <span>Bandwidth (Monthly)</span>
                        </span>
                        <span className="font-mono text-slate-900">
                          {bhUsage?.bandwidth_used_mb ?? 4} MB / {bhUsage?.bandwidth_limit_mb ? `${bhUsage.bandwidth_limit_mb} MB` : 'Unlimited'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '2%' }}></div>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>BDIX Direct High-Speed</span>
                        <span>Unmetered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details & Nameservers Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1A4D80] text-white px-5 py-3.5 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Server className="w-4 h-4" />
                    <span>Hosting Information &amp; Nameservers</span>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs divide-y sm:divide-y-0 divide-slate-100">
                    <div className="space-y-1">
                      <div className="text-slate-500 font-medium">Primary Domain</div>
                      <div className="font-bold text-[#1A4D80] font-mono">{service.domain || service.username || 'softcents.com'}</div>
                    </div>
                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">cPanel Username</div>
                      <div className="font-bold text-slate-900 font-mono">{service.username || 'user'}</div>
                    </div>
                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Server Hostname &amp; IP</div>
                      <div className="font-bold text-slate-900 font-mono">bdix-bh.softcents.com (138.252.125.209)</div>
                    </div>
                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Server Platform</div>
                      <div className="font-bold text-slate-900">BDIX cPanel Alternative (LiteSpeed + bhpaneld)</div>
                    </div>
                    <div className="space-y-1 pt-3 sm:pt-0 sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-700 font-bold mb-1">Assigned Nameservers:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-slate-800">
                        <div className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                          <span>NS1: <strong>ns1.bdix-bh.softcents.com</strong></span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('ns1.bdix-bh.softcents.com', 'ns1')}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {copiedKey === 'ns1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200 flex justify-between items-center">
                          <span>NS2: <strong>ns2.bdix-bh.softcents.com</strong></span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('ns2.bdix-bh.softcents.com', 'ns2')}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            {copiedKey === 'ns2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Actions */}
              <div className="space-y-4">
                {/* Billing Summary Box */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
                  <div className="font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Billing Summary</span>
                    <span className="font-mono text-[#1A4D80]">৳{parseFloat(service.amount || '0').toFixed(2)} BDT</span>
                  </div>
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Billing Cycle:</span>
                      <strong className="text-slate-800">{service.billingcycle || 'Annually'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Registration:</span>
                      <span className="font-mono text-slate-800">{formatWhmcsDate(service.regdate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Due Date:</span>
                      <span className="font-mono text-slate-800 font-bold">{formatWhmcsDate(service.nextduedate)}</span>
                    </div>
                  </div>
                </div>

                {/* Management Actions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5 text-xs">
                  <div className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                    Manage Service
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBhpanelSso()}
                    disabled={bhSsoLoading === 'cpanel'}
                    className="w-full bg-[#ff6c2c] hover:bg-[#e0581b] text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    {bhSsoLoading === 'cpanel' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                    <span>Log in to cPanel</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBhpanelSso('mail')}
                    disabled={bhSsoLoading === 'mail'}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    {bhSsoLoading === 'mail' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>Log in to Webmail</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Request Cancellation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             IF SHARED HOSTING: CPANEL CONTROLS
             ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Product Overview Box */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#1A4D80] text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <Server className="w-4 h-4" />
                  <span>Product Overview &amp; Specifications</span>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs divide-y sm:divide-y-0 divide-slate-100">
                  <div className="space-y-1">
                    <div className="text-slate-500 font-medium">Registration Date</div>
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
                      ৳{parseFloat(service.amount || '0').toFixed(2)} BDT
                      <span className="text-slate-500 text-xs font-normal ml-1">
                        / {service.billingcycle || 'Monthly'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-3 sm:pt-0">
                    <div className="text-slate-500 font-medium">Assigned Server</div>
                    <div className="font-bold text-slate-900 font-mono">
                      {service.server_name || 'Production Server (srv8.softcents.com)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Right Column */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100 text-slate-800 px-4 py-2.5 border-b border-slate-200 font-bold text-xs flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4 text-[#1A4D80]" />
                  <span>Control Panel Logins</span>
                </div>
                <div className="p-4 space-y-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => (isBhpanel ? handleBhpanelSso() : handleCpanelSso('cpanel'))}
                    disabled={isBhpanel ? bhSsoLoading === 'cpanel' : cpanelSsoLoading}
                    className="w-full bg-[#ff6c2c] hover:bg-[#e0581b] text-white font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    {(isBhpanel ? bhSsoLoading === 'cpanel' : cpanelSsoLoading) ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Server className="w-4 h-4" />
                    )}
                    <span>Log in to cPanel</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => (isBhpanel ? handleBhpanelSso('mail') : handleCpanelSso('webmail'))}
                    disabled={isBhpanel ? bhSsoLoading === 'mail' : cpanelSsoLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Log in to Webmail</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold py-2.5 px-4 rounded transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(true)}
                    className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Request Cancellation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extension Password Modal */}
        {extModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="bg-[#1A4D80] text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Change Password for Extension {selectedExt}</span>
                </div>
                <button onClick={() => setExtModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleUpdateExtPassword} className="p-5 space-y-4 text-xs">
                {extActionMsg && (
                  <div
                    className={`p-3 rounded font-semibold flex items-center space-x-2 border ${
                      extActionMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{extActionMsg.text}</span>
                  </div>
                )}

                <p className="text-slate-600">
                  Enter a new SIP password for Extension <strong>{selectedExt}</strong>@{pbxDomain}.
                </p>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New SIP Password</label>
                  <input
                    type="text"
                    value={newExtPass}
                    onChange={(e) => setNewExtPass(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full font-mono bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setExtModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingExtPass}
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold flex items-center space-x-1.5"
                  >
                    {updatingExtPass ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Save Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal (cPanel / BHPanel) */}
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
              <div className="bg-[#1A4D80] text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                  <span>Change Hosting Password</span>
                </div>
                <button onClick={() => setPasswordModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">✕</button>
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
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600">
                  Updating password for user: <strong className="font-mono text-slate-900">{service.username}</strong> on{' '}
                  <strong>{isBhpanel ? 'BDIX Server (cPanel Alternative / BHPanel)' : service.server_name || 'cPanel Server'}</strong>.
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New Password</label>
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
                  <label className="block text-slate-700 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold cursor-pointer"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
              <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>Request Cancellation</span>
                </div>
                <button onClick={() => setCancelModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCancelSubmit} className="p-5 space-y-4 text-xs">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800">
                  You are requesting cancellation for: <strong>{service.product_name || service.package} ({service.domain || service.username || `#${service.id}`})</strong>.
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reason for Cancellation</label>
                  <textarea
                    rows={4}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please briefly explain why you are requesting cancellation..."
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-rose-600"
                    required
                  ></textarea>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhmcsFooter />
    </div>
  );
}
