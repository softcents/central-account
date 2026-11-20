'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Wrench,
  Users,
  CreditCard,
  Box,
  LifeBuoy,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Globe,
  Server,
  Settings,
  Mail,
  Lock,
  Tag,
  Key,
  Database,
  Sliders,
  DollarSign,
  FileText,
  Clock,
  Shuffle,
  Filter,
  X,
  AlertTriangle,
  Folder,
} from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading settings...</div>}>
      <AdminSettingsContent />
    </Suspense>
  );
}

function AdminSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSubtab = searchParams.get('subtab') || searchParams.get('tab') || 'general';

  const [activeSubtab, setActiveSubtab] = useState(initialSubtab);
  const [savedToast, setSavedToast] = useState(false);
  const [showOpCacheAlert, setShowOpCacheAlert] = useState(true);

  // Sync with URL parameters or hash
  useEffect(() => {
    const handleHashOrParam = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('ordering')) setActiveSubtab('ordering');
      else if (hash.includes('localisation')) setActiveSubtab('localisation');
      else if (hash.includes('domains')) setActiveSubtab('domains');
      else if (hash.includes('mail')) setActiveSubtab('mail');
      else if (hash.includes('support')) setActiveSubtab('support');
      else if (hash.includes('invoices')) setActiveSubtab('invoices');
      else if (hash.includes('credit')) setActiveSubtab('credit');
      else if (hash.includes('affiliates')) setActiveSubtab('affiliates');
      else if (hash.includes('security')) setActiveSubtab('security');
      else if (hash.includes('social')) setActiveSubtab('social');
      else if (hash.includes('other')) setActiveSubtab('other');
      else if (hash.includes('general')) setActiveSubtab('general');
      else {
        const sub = searchParams.get('subtab');
        if (sub) setActiveSubtab(sub);
      }
    };

    handleHashOrParam();
    window.addEventListener('hashchange', handleHashOrParam);
    return () => window.removeEventListener('hashchange', handleHashOrParam);
  }, [searchParams]);

  // Form state initialized with exact WHMCS live database values
  const [formData, setFormData] = useState({
    // General Tab
    companyName: 'SoftCents Systems',
    emailAddress: 'no-reply@softcents.com',
    domain: 'http://billing.softcents.com',
    logoUrl: 'https://billing.softcents.com/logo.png',
    payToText: 'SoftCents Systems\n4/6, Senpara Parbata\nBegum Rokeya Saroni\nDhaka-1216, Bangladesh',
    systemUrl: 'https://billing.softcents.com/',
    systemTheme: 'twenty-one',
    limitActivityLog: '10000',
    recordsPerPage: '50',
    maintenanceMode: false,
    maintenanceModeMessage: 'We are currently performing maintenance and will be back shortly.',
    maintenanceModeRedirectUrl: '',

    // Localisation Tab (1:1 from screenshot)
    systemCharset: 'utf-8',
    globalDateFormat: 'DD/MM/YYYY',
    clientDateFormat: 'Use Global Date Format',
    defaultCountry: 'Bangladesh',
    defaultLanguage: 'English',
    enableLanguageMenu: true,
    dynamicFieldTranslations: false,
    removeExtendedUtf8: true,
    phoneNumbersDropdown: true,

    // Ordering Tab (1:1 from screenshot https://prnt.sc/rHBX5MyO8j7d)
    orderDaysGrace: '0',
    defaultOrderTemplate: 'standard_cart',
    onDemandRenewalsEnabled: false,
    onDemandMonthly: '31',
    onDemandQuarterly: '92',
    onDemandSemiAnnually: '184',
    onDemandAnnually: '366',
    onDemandBiennially: '731',
    onDemandTriennially: '1096',
    undefinedAddonsRenewals: 'global',
    sidebarToggleOption: true,
    enableTosAcceptance: false,
    termsOfServiceUrl: '',
    autoRedirectOnCheckout: 'gateway',
    allowNotesOnCheckout: true,
    monthlyPricingBreakdown: false,
    blockExistingDomains: true,
    noInvoiceEmailOnOrder: false,
    skipFraudCheckForExisting: false,
    onlyAutoProvisionForExisting: false,
    enableRandomUsernames: false,
    signupAnniversaryProrata: false,
    enableProductCrossSelling: false,
    crossSellLocAddProduct: false,
    crossSellLocReviewCheckout: false,
    crossSellLocCheckout: false,
    crossSellLocOrderConfirm: false,
    numberOfCrossSells: '3',
    recommendExistingServices: false,
    productCrossSellStyle: false,

    // Domains
    domainRegEnabled: true,
    domainRenewEnabled: true,
    bulkDomainSearch: true,

    // Mail
    mailProvider: 'mail',
    smtpHost: 'mail.softcents.com',
    smtpPort: '25',
    smtpUsername: 'no-reply@softcents.com',
    smtpPassword: '••••••••••••••••',
    smtpSsl: 'ssl',

    // Support
    ticketMask: '%A%A%A-%n%n%n%n%n%n',
    ticketAllowedTypes: '.jpg,.gif,.jpeg,.png,.txt,.pdf',
    ticketRating: true,

    // Invoices
    invoiceGenDays: '10',
    dueReminderDays: '7',
    lateFeeDays: '4',

    // Credit
    addFundsEnabled: true,
    addFundsMin: '10.00',
    addFundsMax: '1000000.00',

    // Affiliates
    affiliateEnabled: true,
    affiliatePayout: '5000.00',
    affiliatePercent: '0',
    affiliateBonus: '0.00',

    // Security
    twoFactorClient: true,
    twoFactorAdmin: true,
    adminSessionTimeout: '15',

    // Social
    facebookUrl: 'https://facebook.com/softcents',
    twitterUrl: 'https://twitter.com/softcents',
    linkedinUrl: 'https://linkedin.com/company/softcents',
    youtubeUrl: 'https://youtube.com/@softcents',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const subtabs = [
    { id: 'general', label: 'General' },
    { id: 'localisation', label: 'Localisation' },
    { id: 'ordering', label: 'Ordering' },
    { id: 'domains', label: 'Domains' },
    { id: 'mail', label: 'Mail' },
    { id: 'support', label: 'Support' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'credit', label: 'Credit' },
    { id: 'affiliates', label: 'Affiliates' },
    { id: 'security', label: 'Security' },
    { id: 'social', label: 'Social' },
    { id: 'other', label: 'Other' },
  ];

  const orderTemplates = [
    {
      id: 'cloud_slider',
      name: 'Cloud Slider',
      bgClass: 'bg-gradient-to-b from-sky-50 to-blue-100 border-sky-300',
      headerClass: 'bg-sky-600',
      type: 'slider',
    },
    {
      id: 'legacy_boxes',
      name: 'Legacy Boxes',
      bgClass: 'bg-slate-50 border-slate-300',
      headerClass: 'bg-slate-700',
      type: 'boxes',
    },
    {
      id: 'legacy_modern',
      name: 'Legacy Modern',
      bgClass: 'bg-amber-50/40 border-amber-300',
      headerClass: 'bg-amber-600',
      type: 'modern',
    },
    {
      id: 'premium_comparison',
      name: 'Premium Comparison',
      bgClass: 'bg-teal-50 border-teal-300',
      headerClass: 'bg-teal-600',
      type: 'comparison',
    },
    {
      id: 'pure_comparison',
      name: 'Pure Comparison',
      bgClass: 'bg-blue-50 border-blue-300',
      headerClass: 'bg-[#1A4D80]',
      type: 'comparison',
    },
    {
      id: 'standard_cart',
      name: 'Standard Cart',
      bgClass: 'bg-emerald-50 border-emerald-400',
      headerClass: 'bg-emerald-600',
      type: 'standard',
    },
    {
      id: 'supreme_comparison',
      name: 'Supreme Comparison',
      bgClass: 'bg-purple-50 border-purple-300',
      headerClass: 'bg-purple-700',
      type: 'comparison',
    },
    {
      id: 'universal_slider',
      name: 'Universal Slider',
      bgClass: 'bg-emerald-50/60 border-emerald-300',
      headerClass: 'bg-emerald-700',
      type: 'slider',
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-start gap-4 font-sans text-[#333]">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#198754] text-white text-xs px-4 py-2.5 rounded shadow-xl flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Changes Saved Successfully!</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. WHMCS LEFT SIDEBAR (.sidebar - EXACT 1:1 TO SCREENSHOT) */}
      {/* ======================================================== */}
      <aside className="w-full lg:w-[220px] shrink-0 space-y-3 select-none text-[12px]">
        {/* SECTION 1: CONFIGURATION */}
        <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-3 py-2 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
            <Wrench className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Configuration</span>
          </div>
          <div className="py-1 text-[11px]">
            <Link
              href="/admin/settings?tab=general"
              className="block px-3 py-1.5 font-bold text-[#1A4D80] bg-[#eef3f7] border-l-2 border-[#1A4D80]"
            >
              General Settings
            </Link>
            <Link
              href="/admin/addons"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Apps & Integrations
            </Link>
            <Link
              href="/admin/oauth"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Sign-In Integrations
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=invoices"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Automation Settings
            </Link>
            <Link
              href="/admin/addons"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              MarketConnect
            </Link>
            <Link
              href="/admin/addons/bdhost_wa"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Notifications
            </Link>
            <Link
              href="/admin/utilities/cleanup"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Storage Settings
            </Link>
            <Link
              href="/admin/applications"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Application Links
            </Link>
            <Link
              href="/admin/oauth"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              OpenID Connect
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=mail"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Email Templates
            </Link>
            <Link
              href="/admin/addons"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Addon Modules
            </Link>
            <Link
              href="/admin/clients"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Client Groups
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=other"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Custom Client Fields
            </Link>
            <Link
              href="/admin/security"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Fraud Protection
            </Link>
          </div>
        </div>

        {/* SECTION 2: STAFF MANAGEMENT */}
        <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-3 py-2 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Staff Management</span>
          </div>
          <div className="py-1 text-[11px]">
            <Link
              href="/admin/settings?tab=admins"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Administrator Users
            </Link>
            <Link
              href="/admin/settings?tab=admins"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Administrator Roles
            </Link>
            <Link
              href="/admin/security"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Two-Factor Authentication
            </Link>
            <Link
              href="/admin/oauth"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Manage API Credentials
            </Link>
          </div>
        </div>

        {/* SECTION 3: PAYMENTS */}
        <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-3 py-2 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Payments</span>
          </div>
          <div className="py-1 text-[11px]">
            <Link
              href="/admin/settings?tab=general&subtab=credit"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Currencies
            </Link>
            <Link
              href="/admin/settings?tab=gateways"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Payment Gateways
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=invoices"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Tax Configuration
            </Link>
            <Link
              href="/admin/addons/dynamiccoupon"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Promotions
            </Link>
          </div>
        </div>

        {/* SECTION 4: PRODUCTS / SERVICES */}
        <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-3 py-2 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
            <Box className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Products/Services</span>
          </div>
          <div className="py-1 text-[11px]">
            <Link
              href="/admin/clients/services"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Products/Services
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=ordering"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Configurable Options
            </Link>
            <Link
              href="/admin/addons"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Product Addons
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=ordering"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Product Bundles
            </Link>
            <Link
              href="/admin/addons/tld_price_updater"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Domain Pricing
            </Link>
            <Link
              href="/admin/addons/DomainsReseller"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Domain Registrars
            </Link>
            <Link
              href="/admin/servers"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Servers
            </Link>
          </div>
        </div>

        {/* SECTION 5: SUPPORT */}
        <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-3 py-2 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
            <LifeBuoy className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Support</span>
          </div>
          <div className="py-1 text-[11px]">
            <Link
              href="/admin/support"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Support Departments
            </Link>
            <Link
              href="/admin/support"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Ticket Statuses
            </Link>
            <Link
              href="/admin/support"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Escalation Rules
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=support"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Spam Control
            </Link>
          </div>
        </div>

        {/* SECTION 6: OTHER (AS SHOWN IN SCREENSHOT) */}
        <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
          <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-3 py-2 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
            <Settings className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Other</span>
          </div>
          <div className="py-1 text-[11px]">
            <Link
              href="/admin/orders"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Order Statuses
            </Link>
            <Link
              href="/admin/security"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Security Questions
            </Link>
            <Link
              href="/admin/addons/unblockip"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Banned IPs
            </Link>
            <Link
              href="/admin/settings?tab=general&subtab=security"
              className="block px-3 py-1.5 text-[#444] hover:bg-[#f5f5f5] hover:text-[#1A4D80]"
            >
              Banned Emails
            </Link>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA (EXACT TO SCREENSHOT)              */}
      {/* ======================================================== */}
      <main className="flex-1 min-w-0 bg-white border border-[#ccc] rounded shadow-sm p-4 text-[12px]">
        {/* OPCache PHP Extension Alert (as seen in screenshot) */}
        {showOpCacheAlert && (
          <div className="mb-4 bg-[#fff3cd] border border-[#ffeeba] text-[#856404] px-3.5 py-2.5 rounded text-[11px] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-[#856404] shrink-0" />
              <span>
                <strong>The OPCache PHP extension is enabled.</strong> This extension can cause problems with cached data use and PHP script execution in WHMCS. We recommend disabling OPCache.{' '}
                <a href="https://docs.whmcs.com" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-[#533f03]">
                  Learn More.
                </a>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowOpCacheAlert(false)}
              className="text-[#856404] hover:text-black p-0.5"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Title */}
        <h1 className="text-xl font-normal text-[#333] mb-3">General Settings</h1>

        {/* Navigation Tabs (.nav-tabs style) */}
        <div className="flex flex-wrap gap-1 border-b border-[#ccc] text-[11px] mb-4">
          {subtabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubtab(tab.id);
                router.replace(`/admin/settings?tab=general&subtab=${tab.id}#tab${tab.label}`, { scroll: false });
              }}
              className={`px-3 py-1.5 border-t border-l border-r rounded-t transition-colors ${
                activeSubtab === tab.id
                  ? 'bg-white border-[#ccc] font-bold text-[#1A4D80] -mb-px'
                  : 'bg-[#f4f4f4] border-transparent text-[#555] hover:bg-[#eaeaea]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* TAB 1: GENERAL (SCREENSHOT 1) */}
          {activeSubtab === 'general' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* Company Name */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Company Name</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full sm:w-[280px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">Your Company Name as you want it to appear throughout the system</span>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Email Address</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => handleChange('emailAddress', e.target.value)}
                    className="w-full sm:w-[320px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">The default sender address used for emails sent by WHMCS</span>
                </div>
              </div>

              {/* Domain */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Domain</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => handleChange('domain', e.target.value)}
                    className="w-full sm:w-[320px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">The URL to your website homepage</span>
                </div>
              </div>

              {/* Logo URL */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">Logo URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className="w-full max-w-xl p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777] mt-1">
                    Enter your logo URL to display in email messages or leave blank for none
                  </div>
                </div>
              </div>

              {/* Pay To Text */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">Pay To Text</label>
                <div className="flex-1">
                  <textarea
                    rows={4}
                    value={formData.payToText}
                    onChange={(e) => handleChange('payToText', e.target.value)}
                    className="w-full max-w-xl p-2 border border-[#ccc] rounded bg-white text-[12px] font-mono focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777] mt-1">
                    This text is displayed on the invoice as the Pay To details
                  </div>
                </div>
              </div>

              {/* WHMCS System URL */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">WHMCS System URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.systemUrl}
                    onChange={(e) => handleChange('systemUrl', e.target.value)}
                    className="w-full max-w-md p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777] mt-1">
                    The URL to your WHMCS installation (SSL Recommended) eg. https://www.example.com/members/
                  </div>
                </div>
              </div>

              {/* System Theme */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">System Theme</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <select
                    value={formData.systemTheme}
                    onChange={(e) => handleChange('systemTheme', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="twenty-one">Twenty-One</option>
                    <option value="blend">Blend (Classic Admin)</option>
                    <option value="six">Six</option>
                  </select>
                  <span className="text-[11px] text-[#777]">The theme you want WHMCS to use</span>
                </div>
              </div>

              {/* Limit Activity Log */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Limit Activity Log</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={formData.limitActivityLog}
                    onChange={(e) => handleChange('limitActivityLog', e.target.value)}
                    className="w-28 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">The maximum number of System Level Activity Log entries you wish to retain</span>
                </div>
              </div>

              {/* Records to Display per Page */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Records to Display per Page</label>
                <div className="flex-1">
                  <select
                    value={formData.recordsPerPage}
                    onChange={(e) => handleChange('recordsPerPage', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                  </select>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Maintenance Mode</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maint_mode"
                    checked={formData.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="maint_mode" className="text-[11px] text-[#555] cursor-pointer">
                    Check to enable - prevents client area access when enabled
                  </label>
                </div>
              </div>

              {/* Maintenance Mode Message */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">
                  Maintenance Mode Message
                </label>
                <div className="flex-1">
                  <textarea
                    rows={3}
                    value={formData.maintenanceModeMessage}
                    onChange={(e) => handleChange('maintenanceModeMessage', e.target.value)}
                    className="w-full max-w-xl p-2 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Maintenance Mode Redirect URL */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Maintenance Mode Redirect URL
                </label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={formData.maintenanceModeRedirectUrl}
                    onChange={(e) => handleChange('maintenanceModeRedirectUrl', e.target.value)}
                    placeholder=""
                    className="w-full sm:w-[320px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">
                    If specified, redirects client area visitors to this URL when Maintenance Mode is enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCALISATION (1:1 TO SCREENSHOT 2) */}
          {activeSubtab === 'localisation' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* System Charset */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">System Charset</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={formData.systemCharset}
                    onChange={(e) => handleChange('systemCharset', e.target.value)}
                    className="w-[180px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">Default: utf-8</span>
                </div>
              </div>

              {/* Global Date Format */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Global Date Format</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <select
                    value={formData.globalDateFormat}
                    onChange={(e) => handleChange('globalDateFormat', e.target.value)}
                    className="w-[180px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                  </select>
                  <span className="text-[11px] text-[#777]">Choose numeric display format</span>
                </div>
              </div>

              {/* Client Date Format */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Client Date Format</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <select
                    value={formData.clientDateFormat}
                    onChange={(e) => handleChange('clientDateFormat', e.target.value)}
                    className="w-[200px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="Use Global Date Format">Use Global Date Format</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="Full Date">Full Date (e.g. 20th November 2026)</option>
                  </select>
                  <span className="text-[11px] text-[#777]">Choose display style for clients (can be text based)</span>
                </div>
              </div>

              {/* Default Country */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Default Country</label>
                <div className="flex-1">
                  <select
                    value={formData.defaultCountry}
                    onChange={(e) => handleChange('defaultCountry', e.target.value)}
                    className="w-[240px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              {/* Default Language */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Default Language</label>
                <div className="flex-1">
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                    className="w-[180px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="English">English</option>
                    <option value="Bengali">Bengali</option>
                  </select>
                </div>
              </div>

              {/* Enable Language Menu */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Enable Language Menu</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_lang"
                    checked={formData.enableLanguageMenu}
                    onChange={(e) => handleChange('enableLanguageMenu', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="enable_lang" className="text-[12px] text-[#444] cursor-pointer">
                    Allow users to change the language of the system
                  </label>
                </div>
              </div>

              {/* Dynamic Field Translations */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Dynamic Field Translations</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dynamic_trans"
                    checked={formData.dynamicFieldTranslations}
                    onChange={(e) => handleChange('dynamicFieldTranslations', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="dynamic_trans" className="text-[12px] text-[#444] cursor-pointer">
                    Enable localisation of supported database field values to multiple languages
                  </label>
                </div>
              </div>

              {/* Remove Extended UTF-8 Characters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Remove Extended UTF-8 Characters
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remove_utf8"
                    checked={formData.removeExtendedUtf8}
                    onChange={(e) => handleChange('removeExtendedUtf8', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="remove_utf8" className="text-[12px] text-[#444] cursor-pointer">
                    Automatically remove 4 byte UTF-8 characters such as emoticons from customer ticket posts and emails
                  </label>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Phone Numbers</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="phone_numbers"
                    checked={formData.phoneNumbersDropdown}
                    onChange={(e) => handleChange('phoneNumbersDropdown', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="phone_numbers" className="text-[12px] text-[#444] cursor-pointer">
                    Check to enable international phone number input interface and automatic formatting
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERING (EXACT 1:1 TO SCREENSHOT https://prnt.sc/rHBX5MyO8j7d) */}
          {activeSubtab === 'ordering' && (
            <div className="space-y-4 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* Order Days Grace */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Order Days Grace</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={formData.orderDaysGrace}
                    onChange={(e) => handleChange('orderDaysGrace', e.target.value)}
                    className="w-20 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">The number of days to allow for payment of an order before being overdue</span>
                </div>
              </div>

              {/* Default Order Form Template (Visual Grid from Screenshot) */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-1 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-2">
                  Default Order Form Template
                </label>
                <div className="flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
                    {orderTemplates.map((tmpl) => {
                      const isSelected = formData.defaultOrderTemplate === tmpl.id;
                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => handleChange('defaultOrderTemplate', tmpl.id)}
                          className={`cursor-pointer border rounded p-2 text-center transition-all bg-white hover:border-[#1A4D80] ${
                            isSelected ? 'ring-2 ring-[#1A4D80] border-[#1A4D80] shadow-sm' : 'border-[#ccc]'
                          }`}
                        >
                          {/* Miniature Template Mockup */}
                          <div className={`h-16 w-full rounded border mb-2 overflow-hidden flex flex-col ${tmpl.bgClass}`}>
                            <div className={`h-3 w-full ${tmpl.headerClass}`}></div>
                            <div className="p-1 flex-1 flex flex-col justify-around">
                              <div className="h-1.5 w-3/4 bg-slate-300 rounded mx-auto"></div>
                              <div className="grid grid-cols-3 gap-0.5 px-0.5">
                                <div className="h-4 bg-white border border-slate-200 rounded"></div>
                                <div className="h-4 bg-white border border-slate-200 rounded"></div>
                                <div className="h-4 bg-white border border-slate-200 rounded"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center space-x-1.5 text-[11px]">
                            <input
                              type="radio"
                              name="order_form_tmpl"
                              checked={isSelected}
                              onChange={() => handleChange('defaultOrderTemplate', tmpl.id)}
                              className="text-[#1A4D80]"
                            />
                            <span className={isSelected ? 'font-bold text-[#1A4D80]' : 'text-[#444]'}>
                              {tmpl.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* On-Demand Renewals */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">On-Demand Renewals</label>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ondemand_enable"
                      checked={formData.onDemandRenewalsEnabled}
                      onChange={(e) => handleChange('onDemandRenewalsEnabled', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <label htmlFor="ondemand_enable" className="text-[12px] text-[#444] cursor-pointer">
                      Check to allow clients to place renewal orders early.
                    </label>
                  </div>

                  {/* 6 Interval Periods Table */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-2xl pt-1">
                    <div>
                      <div className="text-[11px] font-semibold text-[#555] mb-1">Monthly</div>
                      <input
                        type="number"
                        value={formData.onDemandMonthly}
                        onChange={(e) => handleChange('onDemandMonthly', e.target.value)}
                        className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#555] mb-1">Quarterly</div>
                      <input
                        type="number"
                        value={formData.onDemandQuarterly}
                        onChange={(e) => handleChange('onDemandQuarterly', e.target.value)}
                        className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#555] mb-1">Semi-Annually</div>
                      <input
                        type="number"
                        value={formData.onDemandSemiAnnually}
                        onChange={(e) => handleChange('onDemandSemiAnnually', e.target.value)}
                        className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#555] mb-1">Annually</div>
                      <input
                        type="number"
                        value={formData.onDemandAnnually}
                        onChange={(e) => handleChange('onDemandAnnually', e.target.value)}
                        className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#555] mb-1">Biennially</div>
                      <input
                        type="number"
                        value={formData.onDemandBiennially}
                        onChange={(e) => handleChange('onDemandBiennially', e.target.value)}
                        className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-[#555] mb-1">Triennially</div>
                      <input
                        type="number"
                        value={formData.onDemandTriennially}
                        onChange={(e) => handleChange('onDemandTriennially', e.target.value)}
                        className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-[#777]">
                    The period (in days) during which clients can place early renewal orders before the service&apos;s due date.
                  </div>

                  {/* Undefined Addons Policy */}
                  <div className="pt-2 text-[11px] text-[#444] space-y-1">
                    <div className="font-semibold text-[#555]">
                      Select the On-Demand Renewals configuration to use for undefined product addons:
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-0.5">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="undef_addons"
                          checked={formData.undefinedAddonsRenewals === 'global'}
                          onChange={() => handleChange('undefinedAddonsRenewals', 'global')}
                          className="text-[#1A4D80]"
                        />
                        <span>Use Global Settings</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="undef_addons"
                          checked={formData.undefinedAddonsRenewals === 'parent'}
                          onChange={() => handleChange('undefinedAddonsRenewals', 'parent')}
                          className="text-[#1A4D80]"
                        />
                        <span>Use Parent Product Settings</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="undef_addons"
                          checked={formData.undefinedAddonsRenewals === 'disabled'}
                          onChange={() => handleChange('undefinedAddonsRenewals', 'disabled')}
                          className="text-[#1A4D80]"
                        />
                        <span>Disabled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Toggle Option */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Sidebar Toggle Option</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sidebar_toggle"
                    checked={formData.sidebarToggleOption}
                    onChange={(e) => handleChange('sidebarToggleOption', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="sidebar_toggle" className="text-[12px] text-[#444] cursor-pointer">
                    Check to enable the display of a sidebar toggle button on Order Form Product Selection Pages
                  </label>
                </div>
              </div>

              {/* Enable TOS Acceptance */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Enable TOS Acceptance</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tos_accept"
                    checked={formData.enableTosAcceptance}
                    onChange={(e) => handleChange('enableTosAcceptance', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="tos_accept" className="text-[12px] text-[#444] cursor-pointer">
                    If ticked, clients must agree to your Terms of Service
                  </label>
                </div>
              </div>

              {/* Terms of Service URL */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">Terms of Service URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.termsOfServiceUrl}
                    onChange={(e) => handleChange('termsOfServiceUrl', e.target.value)}
                    placeholder=""
                    className="w-full max-w-xl p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777] mt-1">
                    The URL to your Terms of Service page on your site (eg. http://www.example.com/tos.html)
                  </div>
                </div>
              </div>

              {/* Auto Redirect on Checkout */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-1 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  Auto Redirect on Checkout
                </label>
                <div className="flex-1 space-y-1.5 text-[12px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="auto_redirect_checkout"
                      checked={formData.autoRedirectOnCheckout === 'completed'}
                      onChange={() => handleChange('autoRedirectOnCheckout', 'completed')}
                      className="text-[#1A4D80]"
                    />
                    <span>Just show the order completed page (no payment redirect)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="auto_redirect_checkout"
                      checked={formData.autoRedirectOnCheckout === 'invoice'}
                      onChange={() => handleChange('autoRedirectOnCheckout', 'invoice')}
                      className="text-[#1A4D80]"
                    />
                    <span>Automatically take the user to the invoice</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="auto_redirect_checkout"
                      checked={formData.autoRedirectOnCheckout === 'gateway'}
                      onChange={() => handleChange('autoRedirectOnCheckout', 'gateway')}
                      className="text-[#1A4D80]"
                    />
                    <span>Automatically forward the user to the payment gateway</span>
                  </label>
                </div>
              </div>

              {/* Allow Notes on Checkout */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-1 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Allow Notes on Checkout</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notes_checkout"
                    checked={formData.allowNotesOnCheckout}
                    onChange={(e) => handleChange('allowNotesOnCheckout', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="notes_checkout" className="text-[12px] text-[#444] cursor-pointer">
                    Check to show a field on the order form where the customer can enter additional info for staff
                  </label>
                </div>
              </div>

              {/* Monthly Pricing Breakdown */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Monthly Pricing Breakdown</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="monthly_breakdown"
                    checked={formData.monthlyPricingBreakdown}
                    onChange={(e) => handleChange('monthlyPricingBreakdown', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="monthly_breakdown" className="text-[12px] text-[#444] cursor-pointer">
                    Check to enable monthly pricing breakdown for recurring terms on the order form
                  </label>
                </div>
              </div>

              {/* Block Existing Domains */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Block Existing Domains</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="block_existing_doms"
                    checked={formData.blockExistingDomains}
                    onChange={(e) => handleChange('blockExistingDomains', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="block_existing_doms" className="text-[12px] text-[#444] cursor-pointer">
                    Check to prevent orders being placed for domains already in your system
                  </label>
                </div>
              </div>

              {/* No Invoice Email on Order */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">No Invoice Email on Order</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="no_inv_order"
                    checked={formData.noInvoiceEmailOnOrder}
                    onChange={(e) => handleChange('noInvoiceEmailOnOrder', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="no_inv_order" className="text-[12px] text-[#444] cursor-pointer">
                    Check to not send an invoice created notice when new orders are placed
                  </label>
                </div>
              </div>

              {/* Skip Fraud Check for Existing */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Skip Fraud Check for Existing</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="skip_fraud"
                    checked={formData.skipFraudCheckForExisting}
                    onChange={(e) => handleChange('skipFraudCheckForExisting', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="skip_fraud" className="text-[12px] text-[#444] cursor-pointer">
                    Check to skip the fraud check for existing clients who already have an active order
                  </label>
                </div>
              </div>

              {/* Only Auto Provision for Existing */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Only Auto Provision for Existing</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_prov_exist"
                    checked={formData.onlyAutoProvisionForExisting}
                    onChange={(e) => handleChange('onlyAutoProvisionForExisting', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="auto_prov_exist" className="text-[12px] text-[#444] cursor-pointer">
                    Check to always leave orders by new clients pending for manual review (no auto setup/registration)
                  </label>
                </div>
              </div>

              {/* Enable Random Usernames */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Enable Random Usernames</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rnd_user"
                    checked={formData.enableRandomUsernames}
                    onChange={(e) => handleChange('enableRandomUsernames', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="rnd_user" className="text-[12px] text-[#444] cursor-pointer">
                    Check to generate random usernames for services rather than use the first 8 letters of the domain
                  </label>
                </div>
              </div>

              {/* Signup Anniversary Prorata */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Signup Anniversary Prorata</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anniv_prorata"
                    checked={formData.signupAnniversaryProrata}
                    onChange={(e) => handleChange('signupAnniversaryProrata', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="anniv_prorata" className="text-[12px] text-[#444] cursor-pointer">
                    Prorata products to the clients signup anniversary date if prorata is enabled (ie. all items due on the same date per client)
                  </label>
                </div>
              </div>

              {/* Enable Product Cross-selling */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-1 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Enable Product Cross-selling</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_cross"
                    checked={formData.enableProductCrossSelling}
                    onChange={(e) => handleChange('enableProductCrossSelling', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="enable_cross" className="text-[12px] text-[#444] cursor-pointer">
                    Check to display product cross-sells in the shopping cart
                  </label>
                </div>
              </div>

              {/* Product Cross-sell Locations */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">Product Cross-sell Locations</label>
                <div className="flex-1 space-y-1 text-[12px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.crossSellLocAddProduct}
                      onChange={(e) => handleChange('crossSellLocAddProduct', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <span>Display when adding a product to the cart</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.crossSellLocReviewCheckout}
                      onChange={(e) => handleChange('crossSellLocReviewCheckout', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <span>Display on the Review & Checkout page</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.crossSellLocCheckout}
                      onChange={(e) => handleChange('crossSellLocCheckout', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <span>Display on the Checkout page</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.crossSellLocOrderConfirm}
                      onChange={(e) => handleChange('crossSellLocOrderConfirm', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <span>Display on the Order Confirmation page</span>
                  </label>
                </div>
              </div>

              {/* Number of Cross-sells */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Number of Cross-sells</label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="number"
                    value={formData.numberOfCrossSells}
                    onChange={(e) => handleChange('numberOfCrossSells', e.target.value)}
                    className="w-20 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">The number of cross-sells to display to a customer within the shopping cart experience</span>
                </div>
              </div>

              {/* Recommend Existing Services on Order Confirmation */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Recommend Existing Services
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rec_existing"
                    checked={formData.recommendExistingServices}
                    onChange={(e) => handleChange('recommendExistingServices', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="rec_existing" className="text-[12px] text-[#444] cursor-pointer">
                    Check to provide logged-in customers with product cross-sells for previously-purchased services on the Order Confirmation page
                  </label>
                </div>
              </div>

              {/* Product Cross-sell Style */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Product Cross-sell Style</label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cross_style"
                    checked={formData.productCrossSellStyle}
                    onChange={(e) => handleChange('productCrossSellStyle', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="cross_style" className="text-[12px] text-[#444] cursor-pointer">
                    Check to provide customers with an explanation of why specific cross-sells are presented
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOMAINS */}
          {activeSubtab === 'domains' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dom_reg"
                  checked={formData.domainRegEnabled}
                  onChange={(e) => handleChange('domainRegEnabled', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="dom_reg" className="font-semibold text-[#444] cursor-pointer">
                  Allow Client Domain Registration
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dom_renew"
                  checked={formData.domainRenewEnabled}
                  onChange={(e) => handleChange('domainRenewEnabled', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="dom_renew" className="font-semibold text-[#444] cursor-pointer">
                  Auto Renew Domains on Payment
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dom_bulk"
                  checked={formData.bulkDomainSearch}
                  onChange={(e) => handleChange('bulkDomainSearch', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="dom_bulk" className="font-semibold text-[#444] cursor-pointer">
                  Enable Bulk Domain Search (.com, .net, .xyz, .com.bd)
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: MAIL */}
          {activeSubtab === 'mail' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Mail Provider</label>
                <div className="flex-1">
                  <select
                    value={formData.mailProvider}
                    onChange={(e) => handleChange('mailProvider', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="mail">PHP mail()</option>
                    <option value="SMTP">SMTP (mail.softcents.com / Brevo / SendGrid)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">SMTP Host</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.smtpHost}
                    onChange={(e) => handleChange('smtpHost', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">SMTP Port</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.smtpPort}
                    onChange={(e) => handleChange('smtpPort', e.target.value)}
                    className="w-24 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">SMTP Username</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.smtpUsername}
                    onChange={(e) => handleChange('smtpUsername', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT */}
          {activeSubtab === 'support' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Ticket Mask</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.ticketMask}
                    onChange={(e) => handleChange('ticketMask', e.target.value)}
                    className="w-60 p-1.5 border border-[#ccc] rounded bg-white text-[12px] font-mono"
                  />
                  <span className="text-[11px] text-[#777] ml-2">Default: %A%A%A-%n%n%n%n%n%n</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Allowed File Types</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.ticketAllowedTypes}
                    onChange={(e) => handleChange('ticketAllowedTypes', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: INVOICES */}
          {activeSubtab === 'invoices' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Invoice Generation Days</label>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.invoiceGenDays}
                    onChange={(e) => handleChange('invoiceGenDays', e.target.value)}
                    className="w-24 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">Days before due date to generate recurring invoice</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Payment Due Reminder</label>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.dueReminderDays}
                    onChange={(e) => handleChange('dueReminderDays', e.target.value)}
                    className="w-24 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">Days before due date to send reminder email</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Add Late Fee Days</label>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.lateFeeDays}
                    onChange={(e) => handleChange('lateFeeDays', e.target.value)}
                    className="w-24 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">Days after due date before adding late fee</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CREDIT */}
          {activeSubtab === 'credit' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addfunds_enable"
                  checked={formData.addFundsEnabled}
                  onChange={(e) => handleChange('addFundsEnabled', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="addfunds_enable" className="font-semibold text-[#444] cursor-pointer">
                  Enable Add Funds (Client Wallet Balance)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Minimum Deposit</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.addFundsMin}
                    onChange={(e) => handleChange('addFundsMin', e.target.value)}
                    className="w-32 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">BDT (৳)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Maximum Deposit</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.addFundsMax}
                    onChange={(e) => handleChange('addFundsMax', e.target.value)}
                    className="w-32 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">BDT (৳)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: AFFILIATES */}
          {activeSubtab === 'affiliates' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="aff_enable"
                  checked={formData.affiliateEnabled}
                  onChange={(e) => handleChange('affiliateEnabled', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="aff_enable" className="font-semibold text-[#444] cursor-pointer">
                  Enable Affiliate System
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Affiliate Payout Amount</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.affiliatePayout}
                    onChange={(e) => handleChange('affiliatePayout', e.target.value)}
                    className="w-32 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">Minimum withdrawal limit in BDT</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SECURITY */}
          {activeSubtab === 'security' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tfa_client"
                  checked={formData.twoFactorClient}
                  onChange={(e) => handleChange('twoFactorClient', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="tfa_client" className="font-semibold text-[#444] cursor-pointer">
                  Enable Two-Factor Authentication for Clients (TOTP / Google Authenticator)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tfa_admin"
                  checked={formData.twoFactorAdmin}
                  onChange={(e) => handleChange('twoFactorAdmin', e.target.checked)}
                  className="w-4 h-4 text-[#1A4D80]"
                />
                <label htmlFor="tfa_admin" className="font-semibold text-[#444] cursor-pointer">
                  Enable Two-Factor Authentication for Staff
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Session Timeout (minutes)</label>
                <div className="flex-1">
                  <input
                    type="number"
                    value={formData.adminSessionTimeout}
                    onChange={(e) => handleChange('adminSessionTimeout', e.target.value)}
                    className="w-24 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: SOCIAL */}
          {activeSubtab === 'social' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Facebook URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.facebookUrl}
                    onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">Twitter / X URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.twitterUrl}
                    onChange={(e) => handleChange('twitterUrl', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">LinkedIn URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: OTHER */}
          {activeSubtab === 'other' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="text-[12px] text-[#555]">
                Custom Client Fields, Activity Log retention policies, and API IP Access restrictions are active.
              </div>
            </div>
          )}

          {/* Bottom Action Bar (EXACT TO SCREENSHOT) */}
          <div className="pt-3 border-t border-[#e5e5e5] flex items-center space-x-2">
            <button
              type="submit"
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="bg-white hover:bg-[#f5f5f5] text-[#333] border border-[#ccc] px-4 py-1.5 rounded text-xs font-normal transition-colors"
            >
              Cancel Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
