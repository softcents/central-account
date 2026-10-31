'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  Building,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Users as UsersIcon,
  FileText,
  FileCheck2,
  Camera,
  ScanFace,
  Fingerprint,
  Download,
  Eye,
  FileWarning,
  ImageIcon,
  ShieldAlert,
  Copy,
  Check,
  Scale,
  Maximize2,
  X,
  Laptop,
  Globe,
  KeyRound,
  History,
  Info,
  Loader2,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch, API_URL } from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    ACTIVE: { bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
    VERIFIED: { bg: 'bg-emerald-950/50', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
    SUSPENDED: { bg: 'bg-rose-950/50', text: 'text-rose-400', border: 'border-rose-500/30', icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
    REJECTED: { bg: 'bg-rose-950/50', text: 'text-rose-400', border: 'border-rose-500/30', icon: <XCircle className="w-3.5 h-3.5 text-rose-400" /> },
    PENDING: { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-500/30', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    PENDING_VERIFICATION: { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-500/30', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    REVIEW_REQUIRED: { bg: 'bg-amber-950/50', text: 'text-amber-300', border: 'border-amber-500/30', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> },
    PROCESSING: { bg: 'bg-blue-950/50', text: 'text-blue-300', border: 'border-blue-500/30', icon: <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" /> },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full ${s.bg} border ${s.border} ${s.text} text-xs font-medium`}>
      {s.icon}
      <span>{status?.replace('_', ' ')}</span>
    </span>
  );
}

function scoreBar(label: string, value: number, thresholdGood = 0.7) {
  const pct = Math.min(Math.round(value * 100), 100);
  const color = value >= thresholdGood ? 'bg-emerald-500' : value >= 0.5 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono font-bold text-slate-200">{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();
  const { token, admin } = useAdminAuth();

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'KYC' | 'SECURITY' | 'BUSINESS' | 'AUDIT'>('REGISTRATION');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lightbox viewer state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Account status modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Impersonate modal state
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false);
  const [submittingImpersonate, setSubmittingImpersonate] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  const handleConfirmImpersonate = async () => {
    if (!user || !token) return;
    setSubmittingImpersonate(true);
    setImpersonateError(null);

    try {
      const res = await apiFetch<any>(
        `/admin/users/${user.id}/impersonate`,
        { method: 'POST' },
        token,
      );

      if (res.ok && res.data?.accessToken) {
        const impersonationData = {
          isImpersonating: true,
          adminToken: token,
          adminUser: admin,
          impersonator: res.data.impersonator || admin,
          targetUser: res.data.user || user,
          impersonatedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem('ci_impersonator_backup', JSON.stringify(impersonationData));
          localStorage.setItem('auth_token', res.data.accessToken);
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          window.dispatchEvent(new Event('ci_impersonation_updated'));
        } catch (e) {
          console.error('Failed to set localStorage tokens', e);
        }

        const targetUrl = res.data.redirectUrl || '/dashboard';
        window.location.href = targetUrl;
      } else {
        setImpersonateError(res.data?.message || 'Failed to initialize impersonation session');
      }
    } catch (err: any) {
      setImpersonateError(err?.message || 'Error occurred during impersonation');
    } finally {
      setSubmittingImpersonate(false);
    }
  };

  const fetchUser = useCallback(async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/admin/users/${userId}`, {}, token);
      if (res.ok) {
        setUser(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch user dossier', e);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /** Build full URL for admin-authenticated image streaming */
  const fileUrl = (endpoint: string | null) => {
    if (!endpoint) return '';
    const base = API_URL.replace(/\/api\/?$/, '/api');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${cleanEndpoint}${token ? `?token=${token}` : ''}`;
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingStatus(true);

    try {
      const res = await apiFetch<any>(
        `/admin/users/${user.id}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ status: newStatus, reason: statusReason }),
        },
        token,
      );

      if (res.ok) {
        setStatusModalOpen(false);
        fetchUser();
      }
    } catch (e) {
      console.error('Failed to update user status', e);
    } finally {
      setSubmittingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading complete user dossier &amp; identity documents...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">User Record Not Found</h2>
        <p className="text-xs text-slate-400">The user record you requested does not exist or may have been purged.</p>
        <Link
          href="/admin/users"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Users Directory</span>
        </Link>
      </div>
    );
  }

  const reg = user.customer_registration;
  const kycList = user.identity_verifications || [];
  const latestKyc = kycList[0] || null;
  const displayName = reg?.full_name || (user.profile?.first_name || user.profile?.last_name ? `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim() : user.email);

  return (
    <div className="space-y-6">
      {/* ── Top Bar & Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/users"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Back to User Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Link href="/admin/users" className="hover:text-indigo-400 transition-colors">Users Directory</Link>
              <span>/</span>
              <span className="text-slate-200 font-medium truncate max-w-[200px]">{user.email}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2 mt-0.5">
              <span>{displayName}</span>
              {reg?.customer_type && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${reg.customer_type === 'COMPANY'
                  ? 'bg-violet-950/80 text-violet-300 border border-violet-500/40'
                  : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                  }`}>
                  {reg.customer_type}
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setImpersonateError(null);
              setImpersonateModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200 transition-all shadow-sm group/imp"
            title={`Login as ${user.email} without password`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400 group-hover/imp:scale-110 transition-transform" />
            <span>Impersonate User</span>
          </button>

          <button
            onClick={fetchUser}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setNewStatus(user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED');
              setStatusReason('');
              setStatusModalOpen(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${user.status === 'SUSPENDED'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-400 hover:bg-rose-900/50'
              }`}
          >
            {user.status === 'SUSPENDED' ? 'Reactivate Account' : 'Suspend Account'}
          </button>
        </div>
      </div>

      {/* ── Key Overview Banner ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 shadow-xl backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Identity & Email */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Primary Identity</span>
            <div className="flex items-center space-x-2 text-sm font-semibold text-white">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{user.email}</span>
              <button
                onClick={() => copyToClipboard(user.email, 'email')}
                className="text-slate-500 hover:text-indigo-400 transition-colors"
                title="Copy email"
              >
                {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <span className="text-slate-500 font-mono text-[11px]">ID: {user.id.slice(0, 8)}...</span>
              <button
                onClick={() => copyToClipboard(user.id, 'userId')}
                className="text-slate-500 hover:text-indigo-400 transition-colors"
                title="Copy full UUID"
              >
                {copiedField === 'userId' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Account Status & Verification */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Account Status</span>
            <div className="flex items-center space-x-2">
              {statusBadge(user.status)}
              {user.email_verified ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Email Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[10px]">
                  <span>Email Unverified</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Registered on: <span className="text-slate-300 font-mono">{new Date(user.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Registration Dossier Status */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Registration Dossier</span>
            <div>
              {user.customer_registration_completed ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Registration Dossier Complete</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Registration Form Pending</span>
                </span>
              )}
            </div>
            {reg?.nid_passport_number && (
              <div className="text-[11px] text-slate-300 font-mono flex items-center space-x-1.5 mt-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>NID: {reg.nid_passport_number}</span>
                <button
                  onClick={() => copyToClipboard(reg.nid_passport_number, 'nid')}
                  className="text-slate-500 hover:text-indigo-400 transition-colors"
                  title="Copy NID"
                >
                  {copiedField === 'nid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Biometrics & KYC Level */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Identity &amp; Biometrics</span>
            <div>
              {latestKyc?.status === 'VERIFIED' ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{latestKyc.verification_level || 'LEVEL_2'} Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  <span>{latestKyc ? `KYC ${latestKyc.status}` : 'No KYC Submitted'}</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kycList.length} verification process{kycList.length === 1 ? '' : 'es'} logged
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('REGISTRATION')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'REGISTRATION'
            ? 'border-indigo-500 text-white bg-indigo-500/10'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Customer Registration Form &amp; Records</span>
          {user.customer_registration_completed && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('KYC')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'KYC'
            ? 'border-indigo-500 text-white bg-indigo-500/10'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
        >
          <Camera className="w-4 h-4 text-indigo-400" />
          <span>KYC Photos &amp; Documents ({kycList.length})</span>
          {latestKyc?.documents?.length ? (
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'SECURITY'
            ? 'border-indigo-500 text-white bg-indigo-500/10'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
        >
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <span>Security &amp; Sessions ({user.sessions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('BUSINESS')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'BUSINESS'
            ? 'border-indigo-500 text-white bg-indigo-500/10'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
        >
          <Building className="w-4 h-4 text-indigo-400" />
          <span>Organization &amp; KYB ({user.business_memberships?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center space-x-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === 'AUDIT'
            ? 'border-indigo-500 text-white bg-indigo-500/10'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
        >
          <History className="w-4 h-4 text-indigo-400" />
          <span>Audit Logs &amp; Events ({user.audit_logs?.length || 0})</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: CUSTOMER REGISTRATION DATA                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'REGISTRATION' && (
        <div className="space-y-6">
          {!reg ? (
            <div className="p-8 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Customer Registration Incomplete</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                This user has verified their email but has not yet completed the full multi-section customer registration form (Customer type, NID, Date of birth, Addresses, and Parents information).
              </p>
            </div>
          ) : (
            <>
              {/* I & II: Customer Type & Company Info */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white tracking-wide">I &amp; II. Customer Classification &amp; Corporate Details</h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${reg.customer_type === 'COMPANY'
                    ? 'bg-violet-950/80 text-violet-300 border border-violet-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                    }`}>
                    {reg.customer_type}
                  </span>
                </div>

                {reg.customer_type === 'COMPANY' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Company Name</span>
                      <span className="text-sm font-bold text-white">{reg.company_name || '—'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Authorized Representative</span>
                      <span className="text-sm font-bold text-white">{reg.authorized_person_name || '—'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Company Position</span>
                      <span className="text-sm font-bold text-indigo-300">{reg.company_position?.replace('_', ' ') || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Registered as an Individual Customer. Personal identification and residential KYC apply.
                  </p>
                )}
              </div>

              {/* III: Personal Information */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white tracking-wide">III. Personal Identification Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Official Full Name</span>
                    <span className="text-sm font-bold text-white">{reg.full_name}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">NID / Passport Number</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-sm font-mono font-bold text-indigo-300">{reg.nid_passport_number}</span>
                      <button
                        onClick={() => copyToClipboard(reg.nid_passport_number, 'nid2')}
                        className="text-slate-500 hover:text-indigo-400 p-1"
                        title="Copy NID"
                      >
                        {copiedField === 'nid2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Date of Birth &amp; Gender</span>
                    <span className="text-sm font-bold text-white">
                      {new Date(reg.date_of_birth).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">({reg.gender})</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Primary Phone Number</span>
                    <span className="text-sm font-mono text-slate-200">{reg.phone_number}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Primary Registered Email</span>
                    <span className="text-sm text-slate-200 truncate block">{reg.email}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Form Submission Date</span>
                    <span className="text-sm font-mono text-slate-200">{new Date(reg.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* IV & V: Present & Permanent Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Present Address */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">IV. Present Residential Address</h2>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Street Address</span>
                      <span className="text-slate-200 font-medium">{reg.present_street}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">City</span>
                        <span className="text-slate-200 font-medium">{reg.present_city}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Postal Code</span>
                        <span className="text-slate-200 font-mono font-medium">{reg.present_postal_code}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Country</span>
                        <span className="text-slate-200 font-medium">{reg.present_country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-sm font-bold text-white">V. Permanent Address</h2>
                    </div>
                    {reg.same_as_present_address && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-medium">
                        Same as Present
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Street Address</span>
                      <span className="text-slate-200 font-medium">{reg.permanent_street}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">City</span>
                        <span className="text-slate-200 font-medium">{reg.permanent_city}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Postal Code</span>
                        <span className="text-slate-200 font-mono font-medium">{reg.permanent_postal_code}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">Country</span>
                        <span className="text-slate-200 font-medium">{reg.permanent_country}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VI & VII: Family Information & Secondary Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Family Info */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">VI. Family Information</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Father&apos;s Name</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{reg.father_name || '—'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Mother&apos;s Name</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{reg.mother_name || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Contact */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">VII. Emergency &amp; Secondary Contact</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Contact Phone</span>
                      <span className="text-xs font-mono font-medium text-slate-200 mt-0.5 block">{reg.contact_phone || '—'}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Contact Email</span>
                      <span className="text-xs text-slate-200 mt-0.5 block truncate">{reg.contact_email || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* VIII: Declaration & Cryptographic Blind Index */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold text-white">VIII. Declaration &amp; Cryptographic Blind Index</h2>
                  </div>
                  {reg.declaration_confirmed ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Legally Declared &amp; Confirmed</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 text-xs font-medium">Declaration Unconfirmed</span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-400">
                    <span>Confirmed at: <strong className="text-slate-200 font-mono">{reg.declaration_confirmed_at ? new Date(reg.declaration_confirmed_at).toLocaleString() : 'N/A'}</strong></span>
                    <span>HMAC Version: <strong className="text-indigo-400 font-mono">v{reg.nid_hash_version || 1}</strong></span>
                  </div>
                  {reg.nid_hash && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase text-slate-500 block">NID Blind Index Hash (HMAC-SHA256)</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-[11px] text-slate-400 break-all">{reg.nid_hash}</span>
                        <button
                          onClick={() => copyToClipboard(reg.nid_hash, 'hash')}
                          className="text-slate-500 hover:text-indigo-400 p-1 shrink-0 ml-2"
                          title="Copy hash"
                        >
                          {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: KYC PHOTOS & DOCUMENTS                               */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'KYC' && (
        <div className="space-y-6">
          {kycList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <Camera className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Identity Verification Records</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                This user has not yet uploaded identity documents or completed biometric face verification.
              </p>
            </div>
          ) : (
            kycList.map((verif: any, vIdx: number) => {
              const doc = verif.documents?.[0];
              const ocr = doc?.ocr_results?.[0];
              const face = verif.face_verifications?.[0];
              const liveness = verif.liveness_verifications?.[0];
              const result = verif.results?.[0];

              return (
                <div key={verif.id} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6 shadow-xl backdrop-blur-sm">
                  {/* Verification Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-base font-bold text-white">
                          KYC Verification Session #{kycList.length - vIdx}
                        </h2>
                        {statusBadge(verif.status)}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Level: <span className="text-indigo-400 font-semibold">{verif.verification_level}</span> | Step: <span className="text-slate-300 font-mono">{verif.current_step}</span> | Initiated: <span className="font-mono text-slate-300">{new Date(verif.created_at).toLocaleString()}</span>
                      </p>
                    </div>

                    {verif.rejection_reasons?.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                        <strong>Rejection Reasons:</strong> {verif.rejection_reasons.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* ── Section A: Uploaded ID Document (Front & Back) ── */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-bold text-white">Uploaded Identity Documents</h3>
                      </div>
                      {doc?.document_type && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 uppercase tracking-wider font-semibold">
                          {doc.document_type.name || doc.document_type.code}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* FRONT SIDE */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Front Side</span>
                          </span>
                          {doc?.frontImageExists && (
                            <span className="text-[10px] text-emerald-400 font-mono">Verified on Disk</span>
                          )}
                        </div>

                        {doc?.frontImageExists ? (
                          <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[220px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileUrl(doc.frontImageUrl)}
                              alt="ID Document - Front"
                              className="w-full h-auto max-h-72 object-contain rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
                              onClick={() => {
                                setLightboxUrl(fileUrl(doc.frontImageUrl));
                                setLightboxTitle('ID Document - Front Side');
                              }}
                            />
                            <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setLightboxUrl(fileUrl(doc.frontImageUrl));
                                  setLightboxTitle('ID Document - Front Side');
                                }}
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Zoom in"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={fileUrl(doc.frontImageUrl)}
                                download="document-front"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 text-center text-slate-500 text-xs rounded-2xl border border-slate-800 bg-slate-950/60">
                            <FileWarning className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                            <span>Front image file not found on disk or not yet uploaded.</span>
                          </div>
                        )}
                      </div>

                      {/* BACK SIDE */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Back Side</span>
                          </span>
                          {doc?.backImageExists && (
                            <span className="text-[10px] text-emerald-400 font-mono">Verified on Disk</span>
                          )}
                        </div>

                        {doc?.backImageUrl && doc?.backImageExists ? (
                          <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[220px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileUrl(doc.backImageUrl)}
                              alt="ID Document - Back"
                              className="w-full h-auto max-h-72 object-contain rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
                              onClick={() => {
                                setLightboxUrl(fileUrl(doc.backImageUrl));
                                setLightboxTitle('ID Document - Back Side');
                              }}
                            />
                            <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setLightboxUrl(fileUrl(doc.backImageUrl));
                                  setLightboxTitle('ID Document - Back Side');
                                }}
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Zoom in"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={fileUrl(doc.backImageUrl)}
                                download="document-back"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 text-center text-slate-500 text-xs rounded-2xl border border-slate-800 bg-slate-950/60">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                            <span>{doc?.backImageUrl ? 'Back image file not found on disk' : 'No back side uploaded (single-sided document or passport)'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OCR Data Extracted from Document */}
                    {ocr && (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-3">
                        <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>Extracted OCR Document Data</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Document Number</span>
                            <span className="text-slate-200 font-mono font-semibold">{ocr.document_number || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Full Name on ID</span>
                            <span className="text-slate-200 font-semibold">{ocr.full_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">Date of Birth</span>
                            <span className="text-slate-200">
                              {ocr.date_of_birth ? new Date(ocr.date_of_birth).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase">OCR Confidence Score</span>
                            <span className="font-mono text-indigo-300 font-bold">{((ocr.confidence_score || 0) * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        {ocr.raw_text && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase mb-1">Raw OCR Snippet</span>
                            <div className="p-2 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-400 line-clamp-3">
                              {ocr.raw_text}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Section B: Biometric Face Photos (Portrait vs Live Selfie) ── */}
                  <div className="space-y-4 pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-2">
                      <ScanFace className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">Biometric Verification Photos</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PORTRAIT CROPPED FROM ID */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <Camera className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Portrait Extracted from ID</span>
                          </span>
                          {face?.portraitImageExists && (
                            <span className="text-[10px] text-emerald-400 font-mono">Verified on Disk</span>
                          )}
                        </div>

                        {face?.portraitImageUrl && face?.portraitImageExists ? (
                          <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[200px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileUrl(face.portraitImageUrl)}
                              alt="Portrait from ID"
                              className="w-full h-auto max-h-64 object-contain rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
                              onClick={() => {
                                setLightboxUrl(fileUrl(face.portraitImageUrl));
                                setLightboxTitle('Portrait Extracted from ID');
                              }}
                            />
                            <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setLightboxUrl(fileUrl(face.portraitImageUrl));
                                  setLightboxTitle('Portrait Extracted from ID');
                                }}
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Zoom in"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={fileUrl(face.portraitImageUrl)}
                                download="portrait-id"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 text-center text-slate-500 text-xs rounded-2xl border border-slate-800 bg-slate-950/60">
                            <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                            <span>{face?.portraitImageUrl ? 'Portrait image file not found on disk' : 'No portrait photo cropped yet'}</span>
                          </div>
                        )}
                      </div>

                      {/* LIVE SELFIE / REGISTRATION SELFIE */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center space-x-1.5">
                            <ScanFace className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Live Face Selfie (Registration Liveness)</span>
                          </span>
                          {face?.liveImageExists && (
                            <span className="text-[10px] text-emerald-400 font-mono">Verified on Disk</span>
                          )}
                        </div>

                        {face?.liveImageUrl && face?.liveImageExists ? (
                          <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[200px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fileUrl(face.liveImageUrl)}
                              alt="Live Face Selfie"
                              className="w-full h-auto max-h-64 object-contain rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
                              onClick={() => {
                                setLightboxUrl(fileUrl(face.liveImageUrl));
                                setLightboxTitle('Live Face Selfie (Registration Liveness)');
                              }}
                            />
                            <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setLightboxUrl(fileUrl(face.liveImageUrl));
                                  setLightboxTitle('Live Face Selfie (Registration Liveness)');
                                }}
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Zoom in"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={fileUrl(face.liveImageUrl)}
                                download="live-selfie"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-10 text-center text-slate-500 text-xs rounded-2xl border border-slate-800 bg-slate-950/60">
                            <ScanFace className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                            <span>{face?.liveImageUrl ? 'Live selfie file not found on disk' : 'No live selfie captured yet'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Biometric Match & Scores */}
                    {face && (
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-slate-300">Biometric Facial Match Result</span>
                          {face.is_matched ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>MATCHED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-rose-400 font-semibold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>MISMATCHED</span>
                            </span>
                          )}
                        </div>
                        {scoreBar('Facial Similarity Match Score', face.match_score || 0, 0.75)}
                      </div>
                    )}
                  </div>

                  {/* ── Section C: Liveness & System Decision Engine ── */}
                  {(result || liveness) && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs space-y-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <Scale className="w-4 h-4 text-indigo-400" />
                        <h4 className="font-bold text-white">System Decision &amp; Liveness Breakdown</h4>
                      </div>

                      {result?.scores && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/60">
                            {scoreBar('Document Authenticity', result.scores.authenticityScore || 0)}
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/60">
                            {scoreBar('OCR Consistency', result.scores.ocrScore || 0)}
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/60">
                            {scoreBar('Face Match', result.scores.faceMatchScore || 0)}
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/60">
                            {scoreBar('Overall Score', result.scores.overallWeightedScore || 0, 0.65)}
                          </div>
                        </div>
                      )}

                      {result?.summary && (
                        <div className="text-slate-400 italic text-[11px] pt-1">
                          Summary: {result.summary}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: SECURITY & ACTIVE SESSIONS                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Account Security Status</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Failed Login Attempts</span>
                <span className={`text-base font-bold ${user.security?.failed_login_attempts > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {user.security?.failed_login_attempts || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Lockout Status</span>
                <span className="text-base font-bold text-slate-200">
                  {user.security?.locked_until ? `Locked until ${new Date(user.security.locked_until).toLocaleTimeString()}` : 'Unlocked (Normal)'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Password Last Changed</span>
                <span className="text-base font-bold text-slate-200">
                  {user.security?.last_password_change ? new Date(user.security.last_password_change).toLocaleDateString() : 'Never changed'}
                </span>
              </div>
            </div>
          </div>

          {/* MFA Methods */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white">Two-Factor Authentication (MFA)</h2>
            {user.mfa_methods?.length ? (
              <div className="space-y-2">
                {user.mfa_methods.map((m: any) => (
                  <div key={m.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{m.type} Method</span>
                    <span className={m.is_enabled ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                      {m.is_enabled ? 'Active & Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No MFA methods registered on this account.</p>
            )}
          </div>

          {/* Active Sessions */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <Laptop className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Logged Sessions &amp; Devices ({user.sessions?.length || 0})</h2>
            </div>

            {user.sessions?.length === 0 ? (
              <p className="text-xs text-slate-500">No active login sessions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Device / Client</th>
                      <th className="py-2.5 px-4">IP Address</th>
                      <th className="py-2.5 px-4">Created Date</th>
                      <th className="py-2.5 px-4">Expires</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {user.sessions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px] max-w-xs truncate">
                          {s.device_name || s.user_agent || 'Unknown Client'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-indigo-300">{s.ip_address || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-400">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="py-2.5 px-4 text-slate-400">{new Date(s.expires_at).toLocaleString()}</td>
                        <td className="py-2.5 px-4">
                          {s.is_revoked ? (
                            <span className="text-rose-400 text-[11px] font-medium">Revoked</span>
                          ) : (
                            <span className="text-emerald-400 text-[11px] font-medium">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: ORGANIZATION / KYB                                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'BUSINESS' && (
        <div className="space-y-6">
          {user.business_memberships?.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <Building className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-base font-bold text-white">No Corporate Memberships</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                This user is not affiliated with any registered SaaS business or KYB corporate entities.
              </p>
            </div>
          ) : (
            user.business_memberships.map((m: any) => {
              const b = m.business;
              return (
                <div key={m.id} className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-white">{b?.legal_name || 'Unnamed Business'}</h3>
                      <p className="text-xs text-slate-400">{b?.trade_name ? `Trade: ${b.trade_name}` : ''}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                      Role: {m.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Business Type</span>
                      <span className="text-slate-200 font-semibold">{b?.business_type || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Trade License</span>
                      <span className="text-slate-200 font-mono font-semibold">{b?.trade_license_number || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Country</span>
                      <span className="text-slate-200 font-semibold">{b?.country_code || '—'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 5: AUDIT LOGS & EVENTS                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">System Audit &amp; Compliance Trail ({user.audit_logs?.length || 0})</h2>
            </div>

            {user.audit_logs?.length === 0 ? (
              <p className="text-xs text-slate-500">No audit events recorded for this user.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Event Type</th>
                      <th className="py-2.5 px-4">IP Address</th>
                      <th className="py-2.5 px-4">Details / Metadata</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {user.audit_logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-mono text-indigo-400 font-semibold">{log.event_type}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">{log.ip_address || '—'}</td>
                        <td className="py-2.5 px-4 text-slate-400 max-w-sm font-mono text-[11px] truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── High-Resolution Lightbox Modal ── */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <span className="text-sm font-semibold">{lightboxTitle}</span>
              <div className="flex items-center space-x-2">
                <a
                  href={lightboxUrl}
                  download="document-image"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Close viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto max-h-[82vh] w-full flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt={lightboxTitle}
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Account Status Change Modal ── */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              {newStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Updating account status for <span className="text-indigo-400 font-semibold">{user.email}</span>.
            </p>

            <form onSubmit={handleStatusSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrative Reason / Note
                </label>
                <textarea
                  required
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="State reason for suspension or reactivation for compliance audit logs..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${newStatus === 'SUSPENDED'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    }`}
                >
                  {submittingStatus ? 'Updating...' : `Confirm ${newStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Impersonate Confirmation Modal ── */}
      {impersonateModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-950/30">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                    <span>Impersonate User Account</span>
                  </h3>
                  <p className="text-xs text-amber-300/80 font-medium mt-0.5">
                    Administrative &quot;Login As&quot; Access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImpersonateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Box (Identical authorization notice to sms.whiteinfobd.com) */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Administrative Authorization Notice</p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  This action grants full access to another user account and is intended strictly for authorized debugging or support purposes. Never use it to impersonate a user without explicit permission.
                </p>
              </div>
            </div>

            {/* Target User Details Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Target User:</span>
                <span className="font-semibold text-white font-mono">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Full Name:</span>
                <span className="text-slate-200 font-medium">
                  {user.customer_registration?.full_name ||
                    (user.profile?.first_name
                      ? `${user.profile.first_name} ${user.profile.last_name || ''}`.trim()
                      : 'Not configured')}
                </span>
              </div>
              {user.customer_registration?.nid_passport_number && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">NID / Passport:</span>
                  <span className="font-mono text-indigo-400">
                    {user.customer_registration.nid_passport_number}
                  </span>
                </div>
              )}
              {user.customer_registration?.company_name && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Company:</span>
                  <span className="text-slate-200 font-medium">
                    {user.customer_registration.company_name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Account Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${user.status === 'ACTIVE'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-400 border border-rose-500/30'
                  }`}>
                  {user.status}
                </span>
              </div>
            </div>

            {/* Impersonation Persistence Notice */}
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Your administrative session will remain preserved in the background. A fixed top banner will allow you to return to the Admin Portal at any time with one click.
            </p>

            {impersonateError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {impersonateError}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setImpersonateModalOpen(false)}
                disabled={submittingImpersonate}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImpersonate}
                disabled={submittingImpersonate}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {submittingImpersonate ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Launching Session...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Login As User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
