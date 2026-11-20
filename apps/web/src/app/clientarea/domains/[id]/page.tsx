'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  Globe,
  ShieldCheck,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  User,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Server,
  Save,
  Check,
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

export default function DomainDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params.id as string) || '';

  // Find domain in synced domains
  const domain = useMemo(() => {
    return (whmcsData?.domains || []).find(
      (d: any) => String(d.id) === String(rawId) || d.domain === rawId
    );
  }, [rawId]);

  // Find client
  const client = useMemo(() => {
    if (!domain) return null;
    return (whmcsData?.clients || []).find(
      (c: any) => String(c.id) === String(domain.userid)
    );
  }, [domain]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'nameservers' | 'lock' | 'whois' | 'epp'>('overview');

  // Nameservers state
  const [nsType, setNsType] = useState<'default' | 'custom'>('default');
  const [ns1, setNs1] = useState('ns1.softcents.com');
  const [ns2, setNs2] = useState('ns2.softcents.com');
  const [ns3, setNs3] = useState('');
  const [ns4, setNs4] = useState('');
  const [ns5, setNs5] = useState('');
  const [nsSaved, setNsSaved] = useState(false);

  // Auto renewal state
  const [autoRenew, setAutoRenew] = useState(domain?.donotrenew !== '1');

  // Registrar Lock state
  const [isLocked, setIsLocked] = useState(true);
  const [lockSaved, setLockSaved] = useState(false);

  // Contact WHOIS info
  const [contactData, setContactData] = useState({
    firstName: client?.firstname || 'Softcents',
    lastName: client?.lastname || 'Customer',
    company: client?.company || client?.companyname || 'SoftCents Systems Ltd.',
    email: client?.email || 'billing@softcents.com',
    phone: client?.phone || client?.phonenumber || '+880 1700 000000',
    address1: client?.address1 || 'Gulshan-2',
    city: client?.city || 'Dhaka',
    state: client?.state || 'Dhaka',
    postcode: client?.postcode || '1212',
    country: client?.country || 'BD',
  });
  const [whoisSaved, setWhoisSaved] = useState(false);

  // EPP Code modal state
  const [eppCode, setEppCode] = useState<string | null>(null);

  if (!domain) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
        <ClientHeader />
        <main className="max-w-[1240px] mx-auto px-4 py-12 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-800">Domain Not Found</h1>
          <p className="text-xs text-slate-500">
            The requested domain #{rawId} could not be located in your account.
          </p>
          <Link
            href="/clientarea/domains"
            className="inline-block bg-[#1A4D80] text-white px-5 py-2 rounded text-xs font-bold"
          >
            &larr; Back to My Domains
          </Link>
        </main>
      </div>
    );
  }

  const handleSaveNameservers = (e: React.FormEvent) => {
    e.preventDefault();
    setNsSaved(true);
    setTimeout(() => setNsSaved(false), 3000);
  };

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
    setLockSaved(true);
    setTimeout(() => setLockSaved(false), 3000);
  };

  const handleSaveWhois = (e: React.FormEvent) => {
    e.preventDefault();
    setWhoisSaved(true);
    setTimeout(() => setWhoisSaved(false), 3000);
  };

  const handleGetEpp = () => {
    // Generate secure EPP code representation for this domain
    const mockEpp = `EPP-${domain.domain.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-${Math.random().toString(36).slice(-6).toUpperCase()}`;
    setEppCode(mockEpp);
  };

  const status = domain.status || 'Active';

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
          <Link href="/clientarea/domains" className="hover:text-[#1A4D80]">
            My Domains
          </Link>
          <ChevronRight className="w-3 h-3 mx-2 text-slate-400" />
          <span className="font-semibold text-slate-800">{domain.domain}</span>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                {domain.domain}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Registrar: <strong>{domain.registrar || 'Softcents Registrar'}</strong> &bull; Registration Period: <strong>{domain.registrationperiod || 1} Year(s)</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/clientarea/domains"
              className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Domains</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT SIDEBAR: Domain Management Tabs */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#1A4D80] text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Domain Management</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                    activeTab === 'overview'
                      ? 'bg-[#1A4D80] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Overview &amp; Renewal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('nameservers')}
                  className={`w-full text-left px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                    activeTab === 'nameservers'
                      ? 'bg-[#1A4D80] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Nameservers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('lock')}
                  className={`w-full text-left px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                    activeTab === 'lock'
                      ? 'bg-[#1A4D80] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Registrar Lock</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('whois')}
                  className={`w-full text-left px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                    activeTab === 'whois'
                      ? 'bg-[#1A4D80] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>WHOIS Contact Info</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('epp')}
                  className={`w-full text-left px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                    activeTab === 'epp'
                      ? 'bg-[#1A4D80] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Get EPP / Auth Code</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Tab Contents */}
          <div className="lg:col-span-3 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-[#1A4D80] text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Domain Information</span>
                  </div>

                  <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs divide-y sm:divide-y-0 divide-slate-100">
                    <div className="space-y-1">
                      <div className="text-slate-500 font-medium">Domain Name</div>
                      <div className="font-bold text-slate-900 font-mono text-sm">{domain.domain}</div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Registration Date</div>
                      <div className="font-bold text-slate-900 font-mono">{formatWhmcsDate(domain.registrationdate)}</div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Next Due Date</div>
                      <div className="font-bold text-slate-900 font-mono">{formatWhmcsDate(domain.nextduedate)}</div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Expiry Date</div>
                      <div className="font-bold text-slate-900 font-mono text-amber-700">{formatWhmcsDate(domain.expirydate)}</div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Recurring Renewal Amount</div>
                      <div className="font-bold text-[#1A4D80] font-mono text-sm">
                        ৳{parseFloat(domain.recurringamount || '1400.00').toFixed(2)} BDT / Year
                      </div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">First Payment Amount</div>
                      <div className="font-bold text-slate-900 font-mono">
                        ৳{parseFloat(domain.firstpaymentamount || domain.recurringamount || '1400.00').toFixed(2)} BDT
                      </div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Registrar</div>
                      <div className="font-bold text-slate-900">{domain.registrar || 'Softcents Registrar'}</div>
                    </div>

                    <div className="space-y-1 pt-3 sm:pt-0">
                      <div className="text-slate-500 font-medium">Payment Method</div>
                      <div className="font-bold text-slate-900 capitalize">{domain.paymentmethod || 'PipraPay'}</div>
                    </div>
                  </div>
                </div>

                {/* Auto-Renewal Settings */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Automatic Domain Renewal</h3>
                      <p className="text-slate-500 mt-0.5">
                        When enabled, an invoice for renewal will be automatically generated prior to expiration.
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoRenew(!autoRenew)}
                      className={`px-4 py-2 rounded font-bold transition-colors ${
                        autoRenew
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {autoRenew ? 'Auto-Renew: Enabled' : 'Auto-Renew: Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NAMESERVERS */}
            {activeTab === 'nameservers' && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Server className="w-4 h-4 text-[#1A4D80]" />
                    <span>Manage Nameservers</span>
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    Configure which nameservers this domain points to. Changes may take up to 24 hours to fully propagate worldwide.
                  </p>
                </div>

                {nsSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Nameservers updated successfully!</span>
                  </div>
                )}

                <form onSubmit={handleSaveNameservers} className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="nsType"
                        value="default"
                        checked={nsType === 'default'}
                        onChange={() => {
                          setNsType('default');
                          setNs1('ns1.softcents.com');
                          setNs2('ns2.softcents.com');
                          setNs3('ns3.softcents.com');
                          setNs4('ns4.softcents.com');
                        }}
                      />
                      <span>Use Default Nameservers (ns1.softcents.com - ns4.softcents.com)</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="nsType"
                        value="custom"
                        checked={nsType === 'custom'}
                        onChange={() => setNsType('custom')}
                      />
                      <span>Use Custom Nameservers (enter below)</span>
                    </label>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nameserver 1</label>
                      <input
                        type="text"
                        value={ns1}
                        onChange={(e) => setNs1(e.target.value)}
                        disabled={nsType === 'default'}
                        className="w-full font-mono bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80] disabled:bg-slate-100 disabled:text-slate-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nameserver 2</label>
                      <input
                        type="text"
                        value={ns2}
                        onChange={(e) => setNs2(e.target.value)}
                        disabled={nsType === 'default'}
                        className="w-full font-mono bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80] disabled:bg-slate-100 disabled:text-slate-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nameserver 3 (Optional)</label>
                      <input
                        type="text"
                        value={ns3}
                        onChange={(e) => setNs3(e.target.value)}
                        disabled={nsType === 'default'}
                        className="w-full font-mono bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80] disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nameserver 4 (Optional)</label>
                      <input
                        type="text"
                        value={ns4}
                        onChange={(e) => setNs4(e.target.value)}
                        disabled={nsType === 'default'}
                        className="w-full font-mono bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80] disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-6 py-2.5 rounded font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>Change Nameservers</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: REGISTRAR LOCK */}
            {activeTab === 'lock' && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-[#1A4D80]" />
                    <span>Registrar Transfer Lock</span>
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    Registrar Lock protects your domain against unauthorized transfers to another provider. We strongly recommend keeping this turned on.
                  </p>
                </div>

                {lockSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Registrar Lock status updated successfully.</span>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isLocked ? (
                      <Lock className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Unlock className="w-6 h-6 text-rose-600" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Status: {isLocked ? 'Locked (Protected)' : 'Unlocked (Transfer Allowed)'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {isLocked
                          ? 'Unauthorized domain transfers will be blocked by the registrar.'
                          : 'Your domain is unlocked and can be transferred away.'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleLock}
                    className={`px-5 py-2 rounded font-bold transition-colors shadow-sm ${
                      isLocked
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isLocked ? 'Disable Registrar Lock' : 'Enable Registrar Lock'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: WHOIS CONTACT INFORMATION */}
            {activeTab === 'whois' && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-5 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#1A4D80]" />
                    <span>WHOIS Contact Information</span>
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    Keep your public ICANN domain registration contact records accurate and up to date.
                  </p>
                </div>

                {whoisSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>WHOIS Contact Details saved successfully!</span>
                  </div>
                )}

                <form onSubmit={handleSaveWhois} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">First Name</label>
                    <input
                      type="text"
                      value={contactData.firstName}
                      onChange={(e) => setContactData({ ...contactData, firstName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      value={contactData.lastName}
                      onChange={(e) => setContactData({ ...contactData, lastName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Company Name</label>
                    <input
                      type="text"
                      value={contactData.company}
                      onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={contactData.phone}
                      onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                    <input
                      type="text"
                      value={contactData.address1}
                      onChange={(e) => setContactData({ ...contactData, address1: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={contactData.city}
                      onChange={(e) => setContactData({ ...contactData, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">State / Province</label>
                    <input
                      type="text"
                      value={contactData.state}
                      onChange={(e) => setContactData({ ...contactData, state: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-6 py-2.5 rounded font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save WHOIS Contact Details</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 5: GET EPP / AUTH CODE */}
            {activeTab === 'epp' && (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-[#1A4D80]" />
                    <span>Get EPP / Domain Authorization Code</span>
                  </h3>
                  <p className="text-slate-500 mt-0.5">
                    The EPP code (also known as Auth-Code or Transfer Secret) is required when transferring your domain name to another registrar.
                  </p>
                </div>

                {eppCode ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg space-y-2">
                    <div className="text-slate-700 font-semibold">
                      Your Authorization (EPP) Code for <strong>{domain.domain}</strong>:
                    </div>
                    <div className="font-mono text-base font-extrabold text-[#1A4D80] bg-white p-3 rounded border border-emerald-200 select-all">
                      {eppCode}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Copy this code and provide it to your new registrar to authorize the transfer.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-slate-600">
                      Click below to generate and retrieve the official transfer secret.
                    </div>
                    <button
                      onClick={handleGetEpp}
                      className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2.5 rounded font-bold transition-colors shrink-0 shadow-sm"
                    >
                      Generate EPP / Auth Code
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
