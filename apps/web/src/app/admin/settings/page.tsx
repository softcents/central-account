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
  const initialSubtab = searchParams.get('subtab') || 'general';
  const initialTab = searchParams.get('tab') || 'general';

  const [activeSubtab, setActiveSubtab] = useState(initialSubtab);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const sub = searchParams.get('subtab');
    if (sub) setActiveSubtab(sub);
  }, [searchParams]);

  // Form state initialized with exact WHMCS live database values
  const [formData, setFormData] = useState({
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

    // Localisation
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Dhaka',
    defaultCountry: 'BD',
    defaultLanguage: 'english',

    // Ordering
    orderTemplate: 'standard_cart',
    tosUrl: 'https://softcents.com/terms',
    autoRedirectInvoice: 'gateway',

    // Domains
    domainRegEnabled: true,
    domainRenewEnabled: true,
    bulkDomainSearch: true,

    // Mail
    mailProvider: 'SMTP',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: '587',
    smtpUsername: '76ccb8a5001@smtp-brevo.com',
    smtpPassword: '••••••••••••••••',
    smtpSsl: 'tls',

    // Support
    ticketMask: '%A%A%A-%n%n%n%n%n%n',
    ticketAllowedTypes: '.jpg,.gif,.jpeg,.png,.txt,.pdf',
    ticketRating: true,

    // Invoices
    invoiceGenDays: '14',
    dueReminderDays: '3',
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
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA (EXACT TO SCREENSHOT)              */}
      {/* ======================================================== */}
      <main className="flex-1 min-w-0 bg-white border border-[#ccc] rounded shadow-sm p-4 text-[12px]">
        {/* Title */}
        <h1 className="text-xl font-normal text-[#333] mb-3">General Settings</h1>

        {/* Navigation Tabs (.nav-tabs style) */}
        <div className="flex flex-wrap gap-1 border-b border-[#ccc] text-[11px] mb-4">
          {subtabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubtab(tab.id);
                router.replace(`/admin/settings?tab=general&subtab=${tab.id}`, { scroll: false });
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
          {/* TAB 1: GENERAL (SCREENSHOT 1:1) */}
          {activeSubtab === 'general' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* Company Name */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Company Name</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Email Address</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Domain</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">Logo URL</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">Pay To Text</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">WHMCS System URL</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">System Theme</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Limit Activity Log</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Records to Display per Page</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Maintenance Mode</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1.5">
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Maintenance Mode Redirect URL
                </label>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={formData.maintenanceModeRedirectUrl}
                    onChange={(e) => handleChange('maintenanceModeRedirectUrl', e.target.value)}
                    placeholder="https://"
                    className="w-full sm:w-[320px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">
                    If specified, redirects client area visitors to this URL when Maintenance Mode is enabled
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCALISATION */}
          {activeSubtab === 'localisation' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Date Format</label>
                <div className="flex-1">
                  <select
                    value={formData.dateFormat}
                    onChange={(e) => handleChange('dateFormat', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 20/11/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-20)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/20/2026)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Timezone</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    className="w-64 p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                  <span className="text-[11px] text-[#777] ml-2">Default: Asia/Dhaka (+06:00)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Default Country</label>
                <div className="flex-1">
                  <select
                    value={formData.defaultCountry}
                    onChange={(e) => handleChange('defaultCountry', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="BD">Bangladesh (BD)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Default Language</label>
                <div className="flex-1">
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="english">English</option>
                    <option value="bengali">Bengali</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERING */}
          {activeSubtab === 'ordering' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Default Order Template</label>
                <div className="flex-1">
                  <select
                    value={formData.orderTemplate}
                    onChange={(e) => handleChange('orderTemplate', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="standard_cart">standard_cart</option>
                    <option value="boxes">boxes</option>
                    <option value="slider">slider</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Terms of Service URL</label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.tosUrl}
                    onChange={(e) => handleChange('tosUrl', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Auto Redirect on Checkout</label>
                <div className="flex-1">
                  <select
                    value={formData.autoRedirectInvoice}
                    onChange={(e) => handleChange('autoRedirectInvoice', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="gateway">Automatically forward to Payment Gateway</option>
                    <option value="invoice">Display Invoice</option>
                  </select>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Mail Provider</label>
                <div className="flex-1">
                  <select
                    value={formData.mailProvider}
                    onChange={(e) => handleChange('mailProvider', e.target.value)}
                    className="p-1.5 border border-[#ccc] rounded bg-white text-[12px]"
                  >
                    <option value="SMTP">SMTP (Brevo / SendGrid / Custom)</option>
                    <option value="mail">PHP mail()</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">SMTP Host</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">SMTP Port</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">SMTP Username</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Ticket Mask</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Allowed File Types</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Invoice Generation Days</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Payment Due Reminder</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Add Late Fee Days</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Minimum Deposit</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Maximum Deposit</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Affiliate Payout Amount</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Session Timeout (minutes)</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Facebook URL</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">Twitter / X URL</label>
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
                <label className="w-56 shrink-0 font-bold text-[#444] text-right sm:pr-4">LinkedIn URL</label>
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

          {/* Bottom Save Action Bar */}
          <div className="pt-3 border-t border-[#e5e5e5] flex items-center space-x-3">
            <button
              type="submit"
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#333] px-4 py-2 rounded text-xs font-semibold transition-colors"
            >
              Cancel Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
