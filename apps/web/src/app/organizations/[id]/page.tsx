'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes,
  Users,
  KeyRound,
  Palette,
  UserPlus,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  CreditCard,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  FileCheck2,
  Server,
  Activity,
  XCircle,
  RotateCw,
  Search,
  Lock,
  ChevronRight,
  Eye,
  Globe,
  Star,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type TabType = 'MEMBERS' | 'CUSTOMERS' | 'VERIFICATIONS' | 'PROVIDERS' | 'DOMAINS' | 'API_KEYS' | 'BRANDING';

export default function OrganizationWorkspacePage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();

  const [org, setOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('MEMBERS');

  // Member invite state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [inviteToast, setInviteToast] = useState<string | null>(null);

  // API Key state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyScopes, setKeyScopes] = useState<string[]>(['kyc:read', 'kyc:verify']);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Branding state
  const [brandColor, setBrandColor] = useState('#3b82f6');
  const [logoUrl, setLogoUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);

  // Phase 2: Customers State (Layer 2)
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Phase 2: Verifications Queue State (Layer 2)
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [recordingDecision, setRecordingDecision] = useState(false);

  // Phase 2: Providers State ("কোম্পানি নিজের Provider API Key ব্যবহার করবে")
  const [providers, setProviders] = useState<any[]>([]);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerCode, setProviderCode] = useState('DATA_CHECK_SCRAPPER');
  const [providerApiKey, setProviderApiKey] = useState('');
  const [providerApiSecret, setProviderApiSecret] = useState('');
  const [providerApiUrl, setProviderApiUrl] = useState('');
  const [providerIsPrimary, setProviderIsPrimary] = useState(true);
  const [savingProvider, setSavingProvider] = useState(false);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [providerTestResult, setProviderTestResult] = useState<any | null>(null);

  // Reports Summary State
  const [reportSummary, setReportSummary] = useState<any | null>(null);

  // Phase 3: Custom Domains State
  const [domains, setDomains] = useState<any[]>([]);
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null);
  const [domainToast, setDomainToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedTokenDomain, setCopiedTokenDomain] = useState<string | null>(null);

  const fetchOrgDetails = async () => {
    setLoading(true);
    try {
      const [orgRes, keysRes, customersRes, verifRes, providersRes, reportRes, domainsRes] = await Promise.all([
        apiFetch<any>(`/tenants/${id}`, {}, token),
        apiFetch<any>(`/tenants/${id}/api-keys`, {}, token),
        apiFetch<any>(`/tenants/${id}/customers`, {}, token),
        apiFetch<any>(`/tenants/${id}/verifications`, {}, token),
        apiFetch<any>(`/tenants/${id}/providers`, {}, token),
        apiFetch<any>(`/tenants/${id}/reports/summary`, {}, token),
        apiFetch<any>(`/tenants/${id}/domains`, {}, token),
      ]);

      if (orgRes.ok) {
        setOrg(orgRes.data);
        setBrandColor(orgRes.data.brand_color || '#3b82f6');
        setLogoUrl(orgRes.data.logo_url || '');
        setCustomDomain(orgRes.data.custom_domain || '');
      }
      if (keysRes.ok) setApiKeys(keysRes.data || []);
      if (customersRes.ok) setCustomers(customersRes.data?.items || []);
      if (verifRes.ok) setVerifications(verifRes.data?.items || []);
      if (providersRes.ok) setProviders(providersRes.data || []);
      if (reportRes.ok) setReportSummary(reportRes.data || null);
      if (domainsRes.ok) setDomains(domainsRes.data || []);
    } catch (e) {
      console.error('Failed to load organization workspace', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchOrgDetails();
    }
  }, [token, id]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/members/invite`,
        {
          method: 'POST',
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
        token,
      );

      if (res.ok) {
        const invited = inviteEmail;
        setInviteModalOpen(false);
        setInviteEmail('');
        setInviteToast(`Invitation email successfully sent to ${invited}!`);
        setTimeout(() => setInviteToast(null), 6000);
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to invite member', e);
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (memberId: string, memberEmail: string) => {
    setResendingId(memberId);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/members/${memberId}/resend`,
        { method: 'POST' },
        token,
      );
      if (res.ok) {
        setInviteToast(`Invitation email successfully resent to ${memberEmail}!`);
        setTimeout(() => setInviteToast(null), 6000);
      }
    } catch (e) {
      console.error('Failed to resend invite', e);
    } finally {
      setResendingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/members/${memberId}`,
        { method: 'DELETE' },
        token,
      );
      if (res.ok) {
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to remove member', e);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingKey(true);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/api-keys`,
        {
          method: 'POST',
          body: JSON.stringify({ name: keyName, scopes: keyScopes }),
        },
        token,
      );

      if (res.ok) {
        setCreatedSecret(res.data.apiKey);
        setKeyName('');
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to generate API key', e);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/api-keys/${keyId}`,
        { method: 'DELETE' },
        token,
      );
      if (res.ok) {
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to revoke API key', e);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    setBrandingSuccess(null);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/branding`,
        {
          method: 'PATCH',
          body: JSON.stringify({ brandColor, logoUrl, customDomain }),
        },
        token,
      );

      if (res.ok) {
        setBrandingSuccess('Brand settings updated successfully.');
        setTimeout(() => setBrandingSuccess(null), 4000);
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to save branding', e);
    } finally {
      setSavingBranding(false);
    }
  };

  // Phase 2: Create Customer Handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCustomer(true);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/customers`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: newCustomerName,
            email: newCustomerEmail,
            phoneNumber: newCustomerPhone,
            customerType: newCustomerType,
          }),
        },
        token,
      );

      if (res.ok) {
        setCustomerModalOpen(false);
        setNewCustomerName('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to create customer', e);
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Phase 2: Save Provider Config Handler
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/providers`,
        {
          method: 'POST',
          body: JSON.stringify({
            providerCode,
            apiKey: providerApiKey,
            apiSecret: providerApiSecret || undefined,
            apiUrl: providerApiUrl || undefined,
            isPrimary: providerIsPrimary,
          }),
        },
        token,
      );

      if (res.ok) {
        setProviderModalOpen(false);
        setProviderApiKey('');
        setProviderApiSecret('');
        setProviderApiUrl('');
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to save provider config', e);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/providers/${providerId}`,
        { method: 'DELETE' },
        token,
      );
      if (res.ok) {
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to delete provider', e);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProviderId(providerId);
    setProviderTestResult(null);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/providers/${providerId}/test`,
        { method: 'POST' },
        token,
      );
      if (res.ok) {
        setProviderTestResult(res.data);
      }
    } catch (e) {
      console.error('Failed to test provider connection', e);
    } finally {
      setTestingProviderId(null);
    }
  };

  // Phase 2: Record Verification Decision Handler
  const handleRecordDecision = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_REVERIFICATION') => {
    if (!selectedVerification) return;
    setRecordingDecision(true);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/verifications/${selectedVerification.id}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            action,
            notes: decisionNotes,
          }),
        },
        token,
      );

      if (res.ok) {
        setReviewModalOpen(false);
        setSelectedVerification(null);
        setDecisionNotes('');
        fetchOrgDetails();
      }
    } catch (e) {
      console.error('Failed to record verification decision', e);
    } finally {
      setRecordingDecision(false);
    }
  };

  // Phase 3: Custom Domain Handlers
  const handleAddCustomDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName) return;
    setAddingDomain(true);
    setDomainToast(null);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/domains`,
        {
          method: 'POST',
          body: JSON.stringify({ domain: newDomainName.trim().toLowerCase() }),
        },
        token,
      );

      if (res.ok) {
        setDomainModalOpen(false);
        setNewDomainName('');
        setDomainToast({
          type: 'success',
          message: `Custom domain ${res.data?.domain} registered. Please add the DNS TXT record below to verify ownership.`,
        });
        fetchOrgDetails();
      } else {
        setDomainToast({
          type: 'error',
          message: (res.error as any)?.message || 'Failed to register custom domain',
        });
      }
    } catch (err: any) {
      setDomainToast({
        type: 'error',
        message: err.message || 'Error creating custom domain',
      });
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyCustomDomain = async (domainId: string) => {
    setVerifyingDomainId(domainId);
    setDomainToast(null);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/domains/${domainId}/verify`,
        { method: 'POST' },
        token,
      );

      if (res.ok && res.data?.verified) {
        setDomainToast({
          type: 'success',
          message: res.data?.message || 'Domain DNS verified successfully! SSL certificate is active.',
        });
        fetchOrgDetails();
      } else {
        setDomainToast({
          type: 'error',
          message: res.data?.message || 'DNS verification failed. TXT record not found yet. Please allow time for DNS propagation.',
        });
        fetchOrgDetails();
      }
    } catch (err: any) {
      setDomainToast({
        type: 'error',
        message: err.message || 'DNS lookup request failed',
      });
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleSetPrimaryDomain = async (domainId: string) => {
    setSettingPrimaryId(domainId);
    setDomainToast(null);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/domains/${domainId}/primary`,
        { method: 'POST' },
        token,
      );

      if (res.ok) {
        setDomainToast({
          type: 'success',
          message: `Primary domain updated to ${res.data?.primaryDomain}`,
        });
        fetchOrgDetails();
      } else {
        setDomainToast({
          type: 'error',
          message: (res.error as any)?.message || 'Failed to set primary domain',
        });
      }
    } catch (err: any) {
      setDomainToast({
        type: 'error',
        message: err.message || 'Error updating primary domain',
      });
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this custom domain?')) return;
    setDeletingDomainId(domainId);
    setDomainToast(null);
    try {
      const res = await apiFetch<any>(
        `/tenants/${id}/domains/${domainId}`,
        { method: 'DELETE' },
        token,
      );

      if (res.ok) {
        setDomainToast({
          type: 'success',
          message: 'Custom domain removed successfully',
        });
        fetchOrgDetails();
      }
    } catch (err: any) {
      console.error('Failed to delete custom domain', err);
    } finally {
      setDeletingDomainId(null);
    }
  };

  const copyDomainToken = (tokenValue: string, domainName: string) => {
    navigator.clipboard.writeText(tokenValue);
    setCopiedTokenDomain(domainName);
    setTimeout(() => setCopiedTokenDomain(null), 2500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading || !org) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center space-x-3 text-sm">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading organization workspace...</span>
        </div>
      </div>
    );
  }

  const currentPlan = org.subscriptions?.[0]?.plan?.name || 'Starter Plan';
  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
            <Link href="/organizations" className="hover:text-indigo-400">
              Organizations
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-medium">{org.name}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
              style={{ backgroundColor: org.brand_color || '#3b82f6' }}
            >
              {org.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">{org.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Multi-Domain Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {org.userRole}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">slug: {org.slug}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('DOMAINS')}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center space-x-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Custom Domains ({domains.length})</span>
          </button>
          <Link
            href="/usage"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-all flex items-center space-x-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Usage Meter</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Tenant Customers</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{customers.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Verified: {reportSummary?.verifiedCustomers || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Verification Cases</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{verifications.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Pending Review: {reportSummary?.pendingVerifications || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Configured Providers</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{providers.length}</div>
          <p className="text-[10px] text-emerald-400 mt-1">
            {providers.length > 0 ? 'Custom Key Active' : 'System Default'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Compliance Rate</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{reportSummary?.passRate || 100}%</div>
          <p className="text-[10px] text-slate-500 mt-1">Pass rate across cases</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'MEMBERS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team ({org.members?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'CUSTOMERS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-300" />
          <span>Customers ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFICATIONS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'VERIFICATIONS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verifications ({verifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROVIDERS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'PROVIDERS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span>KYC/KYB Providers ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DOMAINS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'DOMAINS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>Custom Domains ({domains.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('API_KEYS')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'API_KEYS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BRANDING')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'BRANDING'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Branding & Domains</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          {inviteToast && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">{inviteToast}</span>
              </div>
              <button
                onClick={() => setInviteToast(null)}
                className="text-emerald-400 hover:text-white text-xs ml-4"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Team members with delegated access to this organization.</p>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Teammate</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-6">Member Email</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Organization Role</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {org.members?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-6 font-medium text-white">{m.user?.email}</td>
                    <td className="py-3.5 px-6 text-slate-400">
                      {m.user?.profile?.first_name || m.user?.profile?.last_name
                        ? `${m.user?.profile?.first_name || ''} ${m.user?.profile?.last_name || ''}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-indigo-400 text-[10px] font-semibold">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {m.role !== 'OWNER' && (
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => handleResendInvite(m.id, m.user?.email)}
                            disabled={resendingId === m.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                          >
                            {resendingId === m.id ? 'Resending...' : 'Resend Invite'}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMERS (LAYER 2) */}
      {activeTab === 'CUSTOMERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search customers by name or email..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setCustomerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Email</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Verification Status</th>
                  <th className="py-3 px-6">Level</th>
                  <th className="py-3 px-6">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No customer records found in this tenant. Click "Add Customer" to onboard your first customer.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-6 font-medium text-white">{c.name}</td>
                      <td className="py-3.5 px-6 text-slate-400">{c.email}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-[10px]">
                          {c.customer_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            c.status === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : c.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400 font-mono text-[11px]">
                        {c.verification_level}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFICATIONS (LAYER 2 REVIEW QUEUE) */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Customer identity and business verification requests awaiting compliance review.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Document Type</th>
                  <th className="py-3 px-6">Face Match</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Submitted</th>
                  <th className="py-3 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {verifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No verification cases pending in this tenant.
                    </td>
                  </tr>
                ) : (
                  verifications.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-white">{v.customerName}</div>
                        <div className="text-[11px] text-slate-500">{v.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-300">
                        {v.documents?.[0]?.document_type?.name || 'National ID'}
                      </td>
                      <td className="py-3.5 px-6">
                        {v.faceMatch ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              v.faceMatch.is_matched
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {Math.round((v.faceMatch.match_score || 0) * 100)}% match
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            v.status === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : v.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedVerification(v);
                            setReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Review Case</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROVIDERS ("কোম্পানি নিজের Provider API Key ব্যবহার করবে") */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-start space-x-3.5">
            <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white">
                কোম্পানি নিজের KYC/KYB Provider-এর API Key ব্যবহার করবে (Bring Your Own Provider Key)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your company's private API credentials for Bangladesh NID verifiers, telecom gateways, or third-party KYC/KYB services. All credentials are encrypted using <strong>AES-256-GCM</strong> authenticated encryption before storage.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Configured verification providers for this organization.</p>
            <button
              onClick={() => setProviderModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure Provider</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.length === 0 ? (
              <div className="col-span-2 p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No custom provider credentials configured yet. Central Account is currently using the platform default provider.
              </div>
            ) : (
              providers.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                        {p.providerCode.slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.providerCode}</h4>
                        <span className="text-[10px] text-slate-400">
                          {p.apiUrl || 'Default Provider Endpoint'}
                        </span>
                      </div>
                    </div>
                    {p.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        Primary Key
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span className="font-mono text-slate-300 text-[11px]">
                        API Key: AES-256-GCM Encrypted
                      </span>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-semibold">Active</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleTestProvider(p.id)}
                      disabled={testingProviderId === p.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center space-x-1.5"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{testingProviderId === p.id ? 'Testing...' : 'Test Connection'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProvider(p.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove Provider"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {providerTestResult && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{providerTestResult.message} ({providerTestResult.latencyMs}ms)</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: CUSTOM DOMAINS */}
      {activeTab === 'DOMAINS' && (
        <div className="space-y-6">
          {domainToast && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-sm ${
                domainToast.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {domainToast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{domainToast.message}</span>
              </div>
              <button
                onClick={() => setDomainToast(null)}
                className="text-slate-400 hover:text-white text-xs ml-4"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Custom Domain Management</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                White-label your identity portal by pointing your company's domain or subdomain (e.g. auth.yourcompany.com).
              </p>
            </div>
            <button
              onClick={() => {
                setNewDomainName('');
                setDomainModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Domain</span>
            </button>
          </div>

          {/* Domains List */}
          <div className="space-y-4">
            {domains.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-sky-400 flex items-center justify-center mx-auto">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">No Custom Domains Configured</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Connect your own domain to provide a fully white-labeled KYC/SSO login portal for your customers.
                  </p>
                </div>
                <button
                  onClick={() => setDomainModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white inline-flex items-center space-x-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure First Domain</span>
                </button>
              </div>
            ) : (
              domains.map((dom) => (
                <div
                  key={dom.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                          <span className="font-mono text-sm font-bold text-white tracking-tight">
                            {dom.domain}
                          </span>
                          {dom.is_primary && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center space-x-1">
                              <Star className="w-2.5 h-2.5 fill-amber-300" />
                              <span>Primary Domain</span>
                            </span>
                          )}
                          {dom.status === 'VERIFIED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center space-x-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified & Active</span>
                            </span>
                          ) : dom.status === 'FAILED' ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold flex items-center space-x-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              <span>DNS Check Failed</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold flex items-center space-x-1">
                              <RotateCw className="w-2.5 h-2.5 animate-spin" />
                              <span>Pending DNS Setup</span>
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                            SSL: {dom.ssl_status || 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Added on {new Date(dom.created_at).toLocaleDateString()}
                          {dom.last_verified_at && (
                            <span> • Last verified {new Date(dom.last_verified_at).toLocaleTimeString()}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-auto">
                      <button
                        onClick={() => handleVerifyCustomDomain(dom.id)}
                        disabled={verifyingDomainId === dom.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 transition-all border border-slate-700 disabled:opacity-50"
                      >
                        <RotateCw
                          className={`w-3 h-3 text-sky-400 ${
                            verifyingDomainId === dom.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>{verifyingDomainId === dom.id ? 'Checking DNS...' : 'Verify DNS'}</span>
                      </button>

                      {dom.status === 'VERIFIED' && !dom.is_primary && (
                        <button
                          onClick={() => handleSetPrimaryDomain(dom.id)}
                          disabled={settingPrimaryId === dom.id}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center space-x-1 transition-all border border-amber-500/20"
                        >
                          <Star className="w-3 h-3 text-amber-300" />
                          <span>Make Primary</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteDomain(dom.id)}
                        disabled={deletingDomainId === dom.id}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all border border-rose-500/20"
                        title="Delete custom domain"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* DNS Instructions Card */}
                  {dom.status !== 'VERIFIED' && dom.dnsInstructions && (
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200 flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Required DNS Configuration Records</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Configure at your DNS registrar (Cloudflare, Route 53, GoDaddy)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* TXT Record */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-sky-400">Record 1: TXT (Ownership Verification)</span>
                            <span className="text-[10px] text-slate-400 font-mono">TTL: 300s</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                            <div><span className="text-slate-500">Host/Name:</span> {dom.dnsInstructions.host}</div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate"><span className="text-slate-500">Value:</span> {dom.dnsInstructions.expectedValue}</div>
                              <button
                                onClick={() => copyDomainToken(dom.dnsInstructions.expectedValue, dom.domain)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center space-x-1 shrink-0"
                              >
                                {copiedTokenDomain === dom.domain ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5 text-slate-400" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* CNAME Record */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-emerald-400">Record 2: CNAME (Traffic Routing)</span>
                            <span className="text-[10px] text-slate-400 font-mono">TTL: Auto</span>
                          </div>
                          <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                            <div><span className="text-slate-500">Host/Name:</span> {dom.dnsInstructions.cnameHost || dom.domain}</div>
                            <div><span className="text-slate-500">Target/Points to:</span> {dom.dnsInstructions.cnameTarget || 'identity.softcents.com'}</div>
                          </div>
                        </div>
                      </div>

                      {dom.error_message && (
                        <p className="text-[11px] text-rose-400 bg-rose-950/20 border border-rose-500/20 p-2 rounded-lg">
                          {dom.error_message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: API KEYS */}
      {activeTab === 'API_KEYS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Live API keys authorized to make server-to-server requests on behalf of this tenant.
            </p>
            <button
              onClick={() => {
                setCreatedSecret(null);
                setKeyModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New API Key</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Key Prefix</th>
                  <th className="py-3 px-6">Scopes</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Created</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                      No API keys generated yet for this organization.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5 px-6 font-medium text-white">{k.name}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-400 text-[11px]">{k.key_prefix}</td>
                      <td className="py-3.5 px-6">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s: string) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-full bg-slate-950 text-indigo-400 text-[10px] border border-slate-800"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        {k.is_revoked ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                            Revoked
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {!k.is_revoked && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: BRANDING */}
      {activeTab === 'BRANDING' && (
        <form onSubmit={handleSaveBranding} className="space-y-6 max-w-xl">
          {brandingSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{brandingSuccess}</span>
            </div>
          )}

          <div className="space-y-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Brand Accent Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-36 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Brand Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://companya.com/logo.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Custom Domain (e.g. app.companya.com)
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="portal.mycompany.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Point a CNAME record to your Central Account instance to activate custom domain routing.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingBranding}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {savingBranding ? 'Saving Changes...' : 'Save Branding'}
          </button>
        </form>
      )}

      {/* MODAL 1: Invite Teammate */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleInviteMember} className="space-y-4">
              <h3 className="text-base font-bold text-white">Invite Team Member</h3>
              <p className="text-xs text-slate-400">
                Grant delegated access to this organization's workspace.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="ADMIN">ADMIN — Full management permissions</option>
                  <option value="MANAGER">MANAGER — Can review customer verifications</option>
                  <option value="MEMBER">MEMBER — Standard access</option>
                  <option value="VIEWER">VIEWER — Read-only access</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {inviting ? 'Sending Invite...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Customer (Layer 2) */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <h3 className="text-base font-bold text-white">Onboard New Customer</h3>
              <p className="text-xs text-slate-400">
                Register a new customer entity under your organization for KYC/KYB verification.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name / Entity Name</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="John Doe or Acme Corp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="+880 1700 000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Customer Type</label>
                <select
                  value={newCustomerType}
                  onChange={(e) => setNewCustomerType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="INDIVIDUAL">INDIVIDUAL — Personal KYC</option>
                  <option value="COMPANY">COMPANY — Business KYB</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCustomer || !newCustomerEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {creatingCustomer ? 'Registering...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Configure Provider ("কোম্পানি নিজের Provider API Key ব্যবহার করবে") */}
      {providerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleSaveProvider} className="space-y-4">
              <h3 className="text-base font-bold text-white">Configure KYC/KYB Provider Key</h3>
              <p className="text-xs text-slate-400">
                Connect your company's private API key for external verification. Encrypted with AES-256-GCM.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Provider Code</label>
                <select
                  value={providerCode}
                  onChange={(e) => setProviderCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="DATA_CHECK_SCRAPPER">DATA_CHECK_SCRAPPER (National NID Portal)</option>
                  <option value="ICC">ICC (National ID Telecom Gateway)</option>
                  <option value="CUSTOM_KYC">CUSTOM_KYC (Custom HTTP Gateway)</option>
                  <option value="VERIFF">VERIFF / SUMSUB (Global Identity)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Provider API Key / Token</label>
                <input
                  type="password"
                  required
                  value={providerApiKey}
                  onChange={(e) => setProviderApiKey(e.target.value)}
                  placeholder="Enter private API key or Bearer token"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Provider Secret / HMAC Key (Optional)
                </label>
                <input
                  type="password"
                  value={providerApiSecret}
                  onChange={(e) => setProviderApiSecret(e.target.value)}
                  placeholder="Optional HMAC or shared secret"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Custom Endpoint URL (Optional)
                </label>
                <input
                  type="url"
                  value={providerApiUrl}
                  onChange={(e) => setProviderApiUrl(e.target.value)}
                  placeholder="https://api.yourprovider.com/v1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={providerIsPrimary}
                  onChange={(e) => setProviderIsPrimary(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isPrimary" className="text-xs text-slate-300">
                  Set as Primary Verification Provider for this organization
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProviderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProvider || !providerApiKey.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  {savingProvider ? 'Saving Credentials...' : 'Save & Encrypt Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Review Case Modal (Layer 2 Review Action) */}
      {reviewModalOpen && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Review Verification Case</h3>
                <p className="text-xs text-slate-400">
                  Case #{selectedVerification.id.slice(0, 8)} — Customer: {selectedVerification.customerName}
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Face Match Score</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">
                  {selectedVerification.faceMatch
                    ? `${Math.round((selectedVerification.faceMatch.match_score || 0) * 100)}%`
                    : 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Liveness Check</span>
                <div className="text-lg font-bold text-indigo-400 mt-1">
                  {selectedVerification.liveness?.is_live ? 'PASSED' : 'PENDING'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Verification Level</span>
                <div className="text-lg font-bold text-white mt-1">
                  {selectedVerification.verificationLevel || 'LEVEL_0'}
                </div>
              </div>
            </div>

            {/* Decision Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Reviewer Compliance Notes
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter manual audit findings or reason for decision..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={recordingDecision}
                  onClick={() => handleRecordDecision('REQUEST_REVERIFICATION')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                >
                  Request Re-upload
                </button>
                <button
                  type="button"
                  disabled={recordingDecision}
                  onClick={() => handleRecordDecision('REJECT')}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all"
                >
                  Reject Case
                </button>
                <button
                  type="button"
                  disabled={recordingDecision}
                  onClick={() => handleRecordDecision('APPROVE')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                >
                  {recordingDecision ? 'Processing...' : 'Approve & Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Generate API Key */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            {createdSecret ? (
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">API Key Generated Successfully</h3>
                <p className="text-xs text-rose-400 font-medium">
                  Copy this key now. For security purposes, it will never be displayed again.
                </p>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-emerald-300 truncate">{createdSecret}</span>
                  <button
                    onClick={() => copyToClipboard(createdSecret)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => setKeyModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    I Have Copied My Key
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <h3 className="text-base font-bold text-white">Generate Client API Key</h3>
                <p className="text-xs text-slate-400">
                  Provision programmatic credentials to integrate Central Account with your backend services.
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Key Name / Description</label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Production Server Key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Scopes</label>
                  <div className="space-y-2 text-xs text-slate-300">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={keyScopes.includes('kyc:verify')}
                        onChange={(e) => {
                          if (e.target.checked) setKeyScopes([...keyScopes, 'kyc:verify']);
                          else setKeyScopes(keyScopes.filter((s) => s !== 'kyc:verify'));
                        }}
                      />
                      <span>kyc:verify (Execute document & face verifications)</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={keyScopes.includes('kyb:read')}
                        onChange={(e) => {
                          if (e.target.checked) setKeyScopes([...keyScopes, 'kyb:read']);
                          else setKeyScopes(keyScopes.filter((s) => s !== 'kyb:read'));
                        }}
                      />
                      <span>kyb:read (Query corporate compliance records)</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setKeyModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generatingKey || !keyName.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    {generatingKey ? 'Generating...' : 'Generate API Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add Custom Domain */}
      {domainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleAddCustomDomain} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Add Custom Domain</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDomainModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Connect your organization's own domain or subdomain to white-label customer identity flows.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fully Qualified Domain Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. auth.yourcompany.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Do not include https:// or trailing slashes. Subdomains (e.g. login.acme.com) are recommended.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDomainModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDomain || !newDomainName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {addingDomain ? 'Registering...' : 'Add Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
