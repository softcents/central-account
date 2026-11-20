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
  const [showMailProviderModal, setShowMailProviderModal] = useState(false);

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

    // Domains Tab (1:1 from screenshot https://prnt.sc/7TA2qdZZ83jl)
    allowClientRegister: true,
    allowTransfer: true,
    allowOwnDomain: true,
    enableRenewalOrders: true,
    autoRenewOnPayment: true,
    autoRenewRequiresProduct: true,
    defaultAutoRenewalSetting: true,
    createToDoListEntries: true,
    allowIdnDomains: false,
    domainGraceAndRedemptionFees: 'enabled',
    domainGraceAndRedemptionFeeBilling: 'existing',
    defaultNameserver1: 'ns12.softcents.com',
    defaultNameserver2: 'ns13.softcents.com',
    defaultNameserver3: '',
    defaultNameserver4: '',
    defaultNameserver5: '',
    useClientsDetails: true,
    contactFirstName: '',
    contactLastName: '',
    contactCompanyName: '',
    contactEmailAddress: '',
    contactAddress1: '',
    contactAddress2: '',
    contactCity: '',
    contactStateRegion: '',
    contactPostcode: '',
    contactCountry: 'Bangladesh',
    contactPhoneNumber: '',
    contactPhoneCountryCode: '+880',

    // Mail Tab (1:1 from screenshot https://prnt.sc/e4rz5W_xwfFh)
    mailProvider: 'SMTP',
    disableEmailSending: false,
    disableRfc3834: false,
    globalEmailSignature: '',
    globalEmailCss: `.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td,h1,img{line-height:100%}h1,h2{display:block;font-family:Helvetica;font-style:normal;font-weight:700}#outlook a{padding:0}.ExternalClass,.ReadMsgBody{width:100%}a,blockquote,body,li,p,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic;border:0;height:auto;outline:0;text-decoration:none}table{border-collapse:collapse!important}#bodyCell,#bodyTable,body{height:100%!important;margin:0;padding:0;width:100%!important}#bodyCell{padding:20px;}#templateContainer{width:600px;border:1px solid #ddd;background-color:#fff}#bodyTable,body{background-color:#FAFAFA}h1{color:#202020!important;font-size:26px;letter-spacing:normal;text-align:left;margin:0 0 10px}h2{color:#404040!important;font-size:20px;line-height:100%;letter-spacing:normal;text-align:left;margin:0 0 10px}h3,h4{display:block;font-style:italic;font-weight:400;letter-spacing:normal;text-align:left;margin:0 0 10px;font-family:Helvetica;line-height:100%}h3{color:#606060!important;font-size:16px}h4{color:grey!important;font-size:14px}.headerContent{background-color:#f8f8f8;border-bottom:1px solid #ddd;color:#505050;font-family:Helvetica;font-size:20px;font-weight:700;line-height:100%;text-align:left;vertical-align:middle;padding:0}.bodyContent,.footerContent{font-family:Helvetica;line-height:150%;text-align:left;}.footerContent{text-align:center}.bodyContent pre{padding:15px;background-color:#444;color:#f8f8f8;border:0}.bodyContent pre code{white-space:pre;word-break:normal;word-wrap:normal}.bodyContent table{margin:10px 0;background-color:#fff;border:1px solid #ddd}.bodyContent table th{padding:4px 10px;background-color:#f8f8f8;border:1px solid #ddd;font-weight:700;text-align:center}.bodyContent table td{padding:3px 8px;border:1px solid #ddd}.table-responsive{border:0}.bodyContent a{word-break:break-all}.headerContent a .yshortcuts,.headerContent a:link,.headerContent a:visited{color:#1f5d8c;font-weight:400;text-decoration:underline}#headerImage{height:auto;max-width:600px;padding:20px}#templateBody{background-color:#fff}.bodyContent{color:#505050;font-size:14px;padding:20px}.bodyContent a .yshortcuts,.bodyContent a:link,.bodyContent a:visited{color:#1f5d8c;font-weight:400;text-decoration:underline}.bodyContent a:hover{text-decoration:none}.bodyContent img{display:inline;height:auto;max-width:560px}.footerContent{color:grey;font-size:12px;padding:20px}.footerContent a .yshortcuts,.footerContent a span,.footerContent a:link,.footerContent a:visited{color:#606060;font-weight:400;text-decoration:underline}@media only screen and (max-width:640px){h1,h2,h3,h4{line-height:100%!important}#templateContainer{max-width:600px!important;width:100%!important}#templateContainer,body{width:100%!important}a,blockquote,body,li,p,table,td{-webkit-text-size-adjust:none!important}body{min-width:100%!important}#bodyCell{padding:10px!important}h1{font-size:24px!important}h2{font-size:20px!important}h3{font-size:18px!important}h4{font-size:16px!important}#templatePreheader{display:none!important}.headerContent{font-size:20px!important;line-height:125%!important}.footerContent{font-size:14px!important;line-height:115%!important}.footerContent a{display:block!important}.hide-mobile{display:none;}}`,
    clientEmailHeader: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset={$charset}" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <style type="text/css">
            [EmailCSS]
        </style>
    </head>
    <body leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0">
        <center>
            <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
                <tr>
                    <td align="center" valign="top" id="bodyCell">
                        <table border="0" cellpadding="0" cellspacing="0" id="templateContainer">
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateHeader">
                                        <tr>
                                            <td valign="top" class="headerContent">
                                                <a href="{$company_domain}">
                                                    {if $company_logo_url}
                                                        <img src="{$company_logo_url}" style="max-width:600px;padding:20px 20px 0 20px" id="headerImage" alt="{$company_name}" />
                                                    {else}
                                                        {$company_name}
                                                    {/if}
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateBody">
                                        <tr>
                                            <td valign="top" class="bodyContent">`,
    clientEmailFooter: `</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" valign="top">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="templateFooter">
                                        <tr>
                                            <td valign="top" class="footerContent">
                                                 <a href="{$company_domain}">visit our website</a>
                                                <span class="hide-mobile"> | </span>
                                                <a href="{$whmcs_url}">log in to your account</a>
                                                <span class="hide-mobile"> | </span>
                                                <a href="{$whmcs_url}submitticket.php">get support</a> <br />
                                                Copyright © {$company_name}, All rights reserved.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </center>
    </body>
</html>`,
    systemEmailsFromName: 'SoftCents Systems Admin',
    systemEmailsFromEmail: 'no-reply@billing.softcents.com',
    bccMessages: '',
    presalesFormDestination: '1',
    presalesContactFormEmail: 'sales@softcents.com',
    smtpHost: 'mail.softcents.com',
    smtpPort: '25',
    smtpUsername: 'no-reply@softcents.com',
    smtpPassword: '••••••••••••••••',
    smtpSsl: 'ssl',

    // Support Tab (1:1 from screenshot https://prnt.sc/m_9apRirnsE2)
    supportModule: '',
    ticketMask: '%A%A%A-%n%n%n%n%n%n',
    ticketReplyListOrder: 'ASC',
    ticketReplyEmailLimit: '10',
    showClientOnlyDepartments: false,
    clientTicketsRequireLogin: true,
    knowledgebaseSuggestions: true,
    attachmentThumbnailPreviews: true,
    supportTicketRating: true,
    autoAddCarbonCopyRecipients: true,
    preventEmailReopening: false,
    updateLastReplyTimestamp: 'always',
    disableReplyEmailLogging: false,
    ticketAllowedFileTypes: '.jpg,.gif,.jpeg,.png,.txt,.pdf',
    serviceStatusRequireLogin: true,
    includeProductDownloads: false,
    allowInsecureImports: false,
    reopenExistingTicketsIfImportingFails: true,

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

          {/* TAB 4: DOMAINS (EXACT 1:1 TO SCREENSHOT https://prnt.sc/7TA2qdZZ83jl) */}
          {activeSubtab === 'domains' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* Domain Registration Options */}
              <div className="flex flex-col sm:flex-row items-start gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-0.5">
                  Domain Registration Options
                </label>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allow_register"
                      checked={formData.allowClientRegister}
                      onChange={(e) => handleChange('allowClientRegister', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <label htmlFor="allow_register" className="text-[12px] text-[#444] cursor-pointer">
                      Allow clients to register domains with you
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allow_transfer"
                      checked={formData.allowTransfer}
                      onChange={(e) => handleChange('allowTransfer', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <label htmlFor="allow_transfer" className="text-[12px] text-[#444] cursor-pointer">
                      Allow clients to transfer a domain to you
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allow_own_domain"
                      checked={formData.allowOwnDomain}
                      onChange={(e) => handleChange('allowOwnDomain', e.target.checked)}
                      className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                    />
                    <label htmlFor="allow_own_domain" className="text-[12px] text-[#444] cursor-pointer">
                      Allow clients to use their own domain
                    </label>
                  </div>
                </div>
              </div>

              {/* Enable Renewal Orders */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Enable Renewal Orders
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_renewal_orders"
                    checked={formData.enableRenewalOrders}
                    onChange={(e) => handleChange('enableRenewalOrders', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="enable_renewal_orders" className="text-[12px] text-[#444] cursor-pointer">
                    Check to show the Domain Renewals cart category allowing clients to place renewal orders early if they wish
                  </label>
                </div>
              </div>

              {/* Auto Renew on Payment */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Auto Renew on Payment
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_renew_payment"
                    checked={formData.autoRenewOnPayment}
                    onChange={(e) => handleChange('autoRenewOnPayment', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="auto_renew_payment" className="text-[12px] text-[#444] cursor-pointer">
                    Automatically renew domains which are set to a supported registrar when they are paid for
                  </label>
                </div>
              </div>

              {/* Auto Renew Requires Product */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Auto Renew Requires Product
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_renew_req_product"
                    checked={formData.autoRenewRequiresProduct}
                    onChange={(e) => handleChange('autoRenewRequiresProduct', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="auto_renew_req_product" className="text-[12px] text-[#444] cursor-pointer">
                    Only auto renew free domains that have a corresponding active product/service for the same domain
                  </label>
                </div>
              </div>

              {/* Default Auto Renewal Setting */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Default Auto Renewal Setting
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="default_auto_renewal"
                    checked={formData.defaultAutoRenewalSetting}
                    onChange={(e) => handleChange('defaultAutoRenewalSetting', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="default_auto_renewal" className="text-[12px] text-[#444] cursor-pointer">
                    This can be changed per domain, but sets the default of whether invoices should auto generate for expiring domains
                  </label>
                </div>
              </div>

              {/* Create To-Do List Entries */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Create To-Do List Entries
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="create_todo_entries"
                    checked={formData.createToDoListEntries}
                    onChange={(e) => handleChange('createToDoListEntries', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="create_todo_entries" className="text-[12px] text-[#444] cursor-pointer">
                    Check to create To-Do list entries for new or failed domain actions that require manual intervention
                  </label>
                </div>
              </div>

              {/* Allow IDN Domains */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Allow IDN Domains
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_idn_domains"
                    checked={formData.allowIdnDomains}
                    onChange={(e) => handleChange('allowIdnDomains', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="allow_idn_domains" className="text-[12px] text-[#444] cursor-pointer">
                    Check to enable Internationalized Domain Names (IDN) support.
                  </label>
                </div>
              </div>

              {/* Domain Grace and Redemption Fees */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Domain Grace and Redemption Fees
                </label>
                <div className="flex-1 flex items-center space-x-4">
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer text-[12px] text-[#444]">
                    <input
                      type="radio"
                      name="grace_redemption_fees"
                      value="enabled"
                      checked={formData.domainGraceAndRedemptionFees === 'enabled'}
                      onChange={() => handleChange('domainGraceAndRedemptionFees', 'enabled')}
                      className="text-[#1A4D80] focus:ring-[#1A4D80]"
                    />
                    <span>Enabled</span>
                  </label>
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer text-[12px] text-[#444]">
                    <input
                      type="radio"
                      name="grace_redemption_fees"
                      value="disabled"
                      checked={formData.domainGraceAndRedemptionFees === 'disabled'}
                      onChange={() => handleChange('domainGraceAndRedemptionFees', 'disabled')}
                      className="text-[#1A4D80] focus:ring-[#1A4D80]"
                    />
                    <span>Disabled</span>
                  </label>
                </div>
              </div>

              {/* Domain Grace and Redemption Fee Billing */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-0.5">
                  Domain Grace and Redemption Fee Billing
                </label>
                <div className="flex-1 space-y-1.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-[12px] text-[#444]">
                    <input
                      type="radio"
                      name="grace_billing"
                      value="existing"
                      checked={formData.domainGraceAndRedemptionFeeBilling === 'existing'}
                      onChange={() => handleChange('domainGraceAndRedemptionFeeBilling', 'existing')}
                      className="text-[#1A4D80] focus:ring-[#1A4D80]"
                    />
                    <span>Add Grace and Redemption Fees to existing invoice</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-[12px] text-[#444]">
                    <input
                      type="radio"
                      name="grace_billing"
                      value="new"
                      checked={formData.domainGraceAndRedemptionFeeBilling === 'new'}
                      onChange={() => handleChange('domainGraceAndRedemptionFeeBilling', 'new')}
                      className="text-[#1A4D80] focus:ring-[#1A4D80]"
                    />
                    <span>Generate a new invoice for the domain renewal including any Grace and Redemption Fees</span>
                  </label>
                </div>
              </div>

              {/* Default Nameserver 1 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Default Nameserver 1
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.defaultNameserver1}
                    onChange={(e) => handleChange('defaultNameserver1', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Default Nameserver 2 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Default Nameserver 2
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.defaultNameserver2}
                    onChange={(e) => handleChange('defaultNameserver2', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Default Nameserver 3 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Default Nameserver 3
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.defaultNameserver3}
                    onChange={(e) => handleChange('defaultNameserver3', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Default Nameserver 4 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Default Nameserver 4
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.defaultNameserver4}
                    onChange={(e) => handleChange('defaultNameserver4', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Default Nameserver 5 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Default Nameserver 5
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.defaultNameserver5}
                    onChange={(e) => handleChange('defaultNameserver5', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Use Clients Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Use Clients Details
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use_clients_details"
                    checked={formData.useClientsDetails}
                    onChange={(e) => handleChange('useClientsDetails', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="use_clients_details" className="text-[12px] text-[#444] cursor-pointer">
                    Check to use clients details for the Billing/Admin/Tech contacts
                  </label>
                </div>
              </div>

              {/* Contact Details Fields */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  First Name
                </label>
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.contactFirstName}
                    onChange={(e) => handleChange('contactFirstName', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">Default Billing/Admin/Tech Contact Details</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Last Name
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactLastName}
                    onChange={(e) => handleChange('contactLastName', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Company Name
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactCompanyName}
                    onChange={(e) => handleChange('contactCompanyName', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Email Address
                </label>
                <div className="flex-1">
                  <input
                    type="email"
                    value={formData.contactEmailAddress}
                    onChange={(e) => handleChange('contactEmailAddress', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Address 1
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactAddress1}
                    onChange={(e) => handleChange('contactAddress1', e.target.value)}
                    className="w-80 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Address 2
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactAddress2}
                    onChange={(e) => handleChange('contactAddress2', e.target.value)}
                    className="w-80 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  City
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactCity}
                    onChange={(e) => handleChange('contactCity', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  State/Region
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactStateRegion}
                    onChange={(e) => handleChange('contactStateRegion', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Postcode
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.contactPostcode}
                    onChange={(e) => handleChange('contactPostcode', e.target.value)}
                    className="w-36 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Country
                </label>
                <div className="flex-1">
                  <select
                    value={formData.contactCountry}
                    onChange={(e) => handleChange('contactCountry', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Phone Number
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="w-16 p-1.5 border border-[#ccc] rounded bg-[#f5f5f5] text-[12px] text-center font-medium text-[#555]">
                    {formData.contactPhoneCountryCode}
                  </div>
                  <input
                    type="text"
                    value={formData.contactPhoneNumber}
                    onChange={(e) => handleChange('contactPhoneNumber', e.target.value)}
                    placeholder=""
                    className="w-56 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MAIL (EXACT 1:1 TO SCREENSHOT https://prnt.sc/e4rz5W_xwfFh) */}
          {activeSubtab === 'mail' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* Mail Provider */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Mail Provider
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="w-32 p-1.5 border border-[#ccc] rounded bg-white text-[12px] font-semibold text-[#333] text-center">
                    {formData.mailProvider}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMailProviderModal(true)}
                    className="bg-white hover:bg-[#f5f5f5] text-[#333] border border-[#ccc] px-3 py-1.5 rounded text-xs font-normal shadow-xs transition-colors"
                  >
                    Configure Mail Provider
                  </button>
                </div>
              </div>

              {/* Disable Email Sending */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Disable Email Sending
                </label>
                <div className="flex-1 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleChange('disableEmailSending', !formData.disableEmailSending)}
                    className={`px-3 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      formData.disableEmailSending
                        ? 'bg-[#d9534f] text-white border-[#d43f3a]'
                        : 'bg-[#f0f0f0] text-[#777] border-[#ccc]'
                    }`}
                  >
                    {formData.disableEmailSending ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-[12px] text-[#555]">
                    Disables all outgoing emails within WHMCS.
                  </span>
                </div>
              </div>

              {/* Disable RFC3834 Headers */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Disable RFC3834 Headers
                </label>
                <div className="flex-1 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleChange('disableRfc3834', !formData.disableRfc3834)}
                    className={`px-3 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      formData.disableRfc3834
                        ? 'bg-[#d9534f] text-white border-[#d43f3a]'
                        : 'bg-[#f0f0f0] text-[#777] border-[#ccc]'
                    }`}
                  >
                    {formData.disableRfc3834 ? 'ON' : 'OFF'}
                  </button>
                  <span className="text-[12px] text-[#555]">
                    Outgoing Support emails have a header that prevents circular responses between autoresponders (RFC-3834). This option disables that behavior.
                  </span>
                </div>
              </div>

              {/* Global Email Signature */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  Global Email Signature
                </label>
                <div className="flex-1">
                  <textarea
                    rows={4}
                    value={formData.globalEmailSignature}
                    onChange={(e) => handleChange('globalEmailSignature', e.target.value)}
                    className="w-full sm:max-w-2xl p-2 border border-[#ccc] rounded bg-white text-[12px] font-sans focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Global Email CSS Styling */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  Global Email CSS Styling
                </label>
                <div className="flex-1">
                  <textarea
                    rows={6}
                    value={formData.globalEmailCss}
                    onChange={(e) => handleChange('globalEmailCss', e.target.value)}
                    className="w-full sm:max-w-2xl p-2 border border-[#ccc] rounded bg-white text-[11px] font-mono leading-relaxed focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* Client Email Header Content */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  Client Email Header Content
                </label>
                <div className="flex-1 space-y-1">
                  <textarea
                    rows={8}
                    value={formData.clientEmailHeader}
                    onChange={(e) => handleChange('clientEmailHeader', e.target.value)}
                    className="w-full sm:max-w-2xl p-2 border border-[#ccc] rounded bg-white text-[11px] font-mono leading-relaxed focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777]">
                    Any text you enter here will be prefixed to the top of all client email templates sent out by the system. HTML is accepted.
                  </div>
                </div>
              </div>

              {/* Client Email Footer Content */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  Client Email Footer Content
                </label>
                <div className="flex-1 space-y-1">
                  <textarea
                    rows={8}
                    value={formData.clientEmailFooter}
                    onChange={(e) => handleChange('clientEmailFooter', e.target.value)}
                    className="w-full sm:max-w-2xl p-2 border border-[#ccc] rounded bg-white text-[11px] font-mono leading-relaxed focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777]">
                    Any text you enter here will be added to the bottom of all client email templates sent out by the system. HTML is accepted.
                  </div>
                </div>
              </div>

              {/* System Emails From Name */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  System Emails From Name
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.systemEmailsFromName}
                    onChange={(e) => handleChange('systemEmailsFromName', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* System Emails From Email */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  System Emails From Email
                </label>
                <div className="flex-1">
                  <input
                    type="email"
                    value={formData.systemEmailsFromEmail}
                    onChange={(e) => handleChange('systemEmailsFromEmail', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* BCC Messages */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  BCC Messages
                </label>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={formData.bccMessages}
                    onChange={(e) => handleChange('bccMessages', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777]">
                    If you want copies of all emails sent by the system sent to an address of yours enter the address here. You may enter multiple addresses seperated by a comma (,)
                  </div>
                </div>
              </div>

              {/* Presales Form Destination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Presales Form Destination
                </label>
                <div className="flex-1">
                  <select
                    value={formData.presalesFormDestination}
                    onChange={(e) => handleChange('presalesFormDestination', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="">Choose a Department - OR - Send to email address below</option>
                    <option value="1">Sales Department</option>
                    <option value="2">Technical Support</option>
                    <option value="3">Site Migration</option>
                  </select>
                </div>
              </div>

              {/* Presales Contact Form Email */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Presales Contact Form Email
                </label>
                <div className="flex-1">
                  <input
                    type="email"
                    value={formData.presalesContactFormEmail}
                    onChange={(e) => handleChange('presalesContactFormEmail', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT (EXACT 1:1 TO SCREENSHOT https://prnt.sc/m_9apRirnsE2) */}
          {activeSubtab === 'support' && (
            <div className="space-y-3.5 border border-[#e5e5e5] rounded p-4 bg-[#fafafa]/50">
              {/* Support Module */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Support Module
                </label>
                <div className="flex-1">
                  <select
                    value={formData.supportModule}
                    onChange={(e) => handleChange('supportModule', e.target.value)}
                    className="w-64 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="">WHMCS Built-in System</option>
                    <option value="kayako">Kayako</option>
                  </select>
                </div>
              </div>

              {/* Support Ticket Mask Format */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-1">
                  Support Ticket Mask Format
                </label>
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={formData.ticketMask}
                    onChange={(e) => handleChange('ticketMask', e.target.value)}
                    className="w-72 p-1.5 border border-[#ccc] rounded bg-white text-[12px] font-mono focus:outline-none focus:border-[#1A4D80]"
                  />
                  <div className="text-[11px] text-[#777]">
                    Key: %A - Uppercase letter | %a - Lowercase letter | %n - Number | %y - Year | %m - Month | %d - Day | %i - Ticket ID
                  </div>
                </div>
              </div>

              {/* Ticket Reply List Order */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Ticket Reply List Order
                </label>
                <div className="flex-1">
                  <select
                    value={formData.ticketReplyListOrder}
                    onChange={(e) => handleChange('ticketReplyListOrder', e.target.value)}
                    className="w-64 p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="ASC">Ascending (Oldest to Newest)</option>
                    <option value="DESC">Descending (Newest to Oldest)</option>
                  </select>
                </div>
              </div>

              {/* Ticket Reply Email Limit */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Ticket Reply Email Limit
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={formData.ticketReplyEmailLimit}
                    onChange={(e) => handleChange('ticketReplyEmailLimit', e.target.value)}
                    className="w-20 p-1.5 border border-[#ccc] rounded bg-white text-[12px] text-center focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[12px] text-[#555]">
                    Email sending limit per 15 minutes
                  </span>
                </div>
              </div>

              {/* Show Client Only Departments */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Show Client Only Departments
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_client_only_depts"
                    checked={formData.showClientOnlyDepartments}
                    onChange={(e) => handleChange('showClientOnlyDepartments', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="show_client_only_depts" className="text-[12px] text-[#444] cursor-pointer">
                    Check to show client only departments to guests (not logged in visitors)
                  </label>
                </div>
              </div>

              {/* Client Tickets Require Login */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Client Tickets Require Login
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="client_tickets_req_login"
                    checked={formData.clientTicketsRequireLogin}
                    onChange={(e) => handleChange('clientTicketsRequireLogin', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="client_tickets_req_login" className="text-[12px] text-[#444] cursor-pointer">
                    Require login by the owning client for viewing tickets assigned to a client
                  </label>
                </div>
              </div>

              {/* Knowledgebase Suggestions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Knowledgebase Suggestions
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="kb_suggestions"
                    checked={formData.knowledgebaseSuggestions}
                    onChange={(e) => handleChange('knowledgebaseSuggestions', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="kb_suggestions" className="text-[12px] text-[#444] cursor-pointer">
                    Show suggested KB articles to a user as they enter a support ticket message
                  </label>
                </div>
              </div>

              {/* Attachment Thumbnail Previews */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Attachment Thumbnail Previews
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="attachment_thumbnails"
                    checked={formData.attachmentThumbnailPreviews}
                    onChange={(e) => handleChange('attachmentThumbnailPreviews', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="attachment_thumbnails" className="text-[12px] text-[#444] cursor-pointer">
                    Check to enable thumbnail previews of image attachments (requires GD)
                  </label>
                </div>
              </div>

              {/* Support Ticket Rating */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Support Ticket Rating
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="support_ticket_rating"
                    checked={formData.supportTicketRating}
                    onChange={(e) => handleChange('supportTicketRating', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="support_ticket_rating" className="text-[12px] text-[#444] cursor-pointer">
                    Allow users to rate support ticket replies from staff
                  </label>
                </div>
              </div>

              {/* Auto Add Carbon Copy Recipients */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Auto Add Carbon Copy Recipients
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_add_cc_recipients"
                    checked={formData.autoAddCarbonCopyRecipients}
                    onChange={(e) => handleChange('autoAddCarbonCopyRecipients', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="auto_add_cc_recipients" className="text-[12px] text-[#444] cursor-pointer">
                    Read and add carbon copy recipients from incoming emails for tickets opened via email
                  </label>
                </div>
              </div>

              {/* Prevent Email Reopening */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Prevent Email Reopening
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="prevent_email_reopening"
                    checked={formData.preventEmailReopening}
                    onChange={(e) => handleChange('preventEmailReopening', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="prevent_email_reopening" className="text-[12px] text-[#444] cursor-pointer">
                    Check to prevent email replies from re-opening closed tickets and to send an email advising to open a new ticket or update the existing ticket for clients.
                  </label>
                </div>
              </div>

              {/* Update Last Reply Timestamp */}
              <div className="flex flex-col sm:flex-row items-start gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4 pt-0.5">
                  Update Last Reply Timestamp
                </label>
                <div className="flex-1 flex items-center space-x-4">
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer text-[12px] text-[#444]">
                    <input
                      type="radio"
                      name="update_last_reply"
                      value="always"
                      checked={formData.updateLastReplyTimestamp === 'always'}
                      onChange={() => handleChange('updateLastReplyTimestamp', 'always')}
                      className="text-[#1A4D80] focus:ring-[#1A4D80]"
                    />
                    <span>Every time a reply is made (Default)</span>
                  </label>
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer text-[12px] text-[#444]">
                    <input
                      type="radio"
                      name="update_last_reply"
                      value="status_change"
                      checked={formData.updateLastReplyTimestamp === 'status_change'}
                      onChange={() => handleChange('updateLastReplyTimestamp', 'status_change')}
                      className="text-[#1A4D80] focus:ring-[#1A4D80]"
                    />
                    <span>Every time for staff replies, only on a change of status for clients</span>
                  </label>
                </div>
              </div>

              {/* Disable Reply Email Logging */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Disable Reply Email Logging
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="disable_reply_logging"
                    checked={formData.disableReplyEmailLogging}
                    onChange={(e) => handleChange('disableReplyEmailLogging', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="disable_reply_logging" className="text-[12px] text-[#444] cursor-pointer">
                    Do not create email log entry for ticket replies (text is already logged in ticket so saves disk space)
                  </label>
                </div>
              </div>

              {/* Allowed File Attachment Types */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Allowed File Attachment Types
                </label>
                <div className="flex-1 flex items-center space-x-3">
                  <input
                    type="text"
                    value={formData.ticketAllowedFileTypes}
                    onChange={(e) => handleChange('ticketAllowedFileTypes', e.target.value)}
                    className="w-full sm:w-[380px] p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <span className="text-[11px] text-[#777]">
                    Seperate multiple extensions with a comma
                  </span>
                </div>
              </div>

              {/* Service Status Require Login */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Service Status Require Login
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service_status_req_login"
                    checked={formData.serviceStatusRequireLogin}
                    onChange={(e) => handleChange('serviceStatusRequireLogin', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="service_status_req_login" className="text-[12px] text-[#444] cursor-pointer">
                    Require a login to view the server status & network issues pages
                  </label>
                </div>
              </div>

              {/* Include Product Downloads */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Include Product Downloads
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inc_product_dls"
                    checked={formData.includeProductDownloads}
                    onChange={(e) => handleChange('includeProductDownloads', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="inc_product_dls" className="text-[12px] text-[#444] cursor-pointer">
                    Check to include Product Associated Downloads in the Downloads Directory
                  </label>
                </div>
              </div>

              {/* Allow Insecure Imports */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Allow Insecure Imports
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_insecure_imports"
                    checked={formData.allowInsecureImports}
                    onChange={(e) => handleChange('allowInsecureImports', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="allow_insecure_imports" className="text-[12px] text-[#444] cursor-pointer">
                    Check to allow imports into existing tickets where the sender is unregistered, not added as a CC recipient or not associated with the Client.
                  </label>
                </div>
              </div>

              {/* Reopen Existing Tickets if Importing Fails */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t border-[#eee]">
                <label className="w-64 shrink-0 font-bold text-[#444] text-right sm:pr-4">
                  Reopen Existing Tickets if Importing Fails
                </label>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="reopen_failed_import"
                    checked={formData.reopenExistingTicketsIfImportingFails}
                    onChange={(e) => handleChange('reopenExistingTicketsIfImportingFails', e.target.checked)}
                    className="w-4 h-4 text-[#1A4D80] rounded border-gray-300"
                  />
                  <label htmlFor="reopen_failed_import" className="text-[12px] text-[#444] cursor-pointer">
                    Check to allow reopening of existing tickets when an unimported reply is received. A notice will be provided in the ticket.
                  </label>
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

      {/* Configure Mail Provider Modal */}
      {showMailProviderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#ccc] shadow-2xl max-w-md w-full overflow-hidden text-[#333]">
            <div className="bg-[#1A4D80] text-white px-4 py-2.5 flex items-center justify-between">
              <span className="font-semibold text-xs">Configure Mail Provider</span>
              <button
                type="button"
                onClick={() => setShowMailProviderModal(false)}
                className="text-white/80 hover:text-white text-base leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-[12px]">
              <div>
                <label className="block font-bold text-[#444] mb-1">Mail Type</label>
                <select
                  value={formData.mailProvider}
                  onChange={(e) => handleChange('mailProvider', e.target.value)}
                  className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                >
                  <option value="SMTP">SMTP (Recommended)</option>
                  <option value="mail">PHP mail()</option>
                  <option value="Mailgun">Mailgun API</option>
                  <option value="SendGrid">SendGrid API</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#444] mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={formData.smtpHost}
                  onChange={(e) => handleChange('smtpHost', e.target.value)}
                  className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#444] mb-1">SMTP Port</label>
                  <input
                    type="text"
                    value={formData.smtpPort}
                    onChange={(e) => handleChange('smtpPort', e.target.value)}
                    className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#444] mb-1">SSL Type</label>
                  <select
                    value={formData.smtpSsl}
                    onChange={(e) => handleChange('smtpSsl', e.target.value)}
                    className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                  >
                    <option value="none">None</option>
                    <option value="ssl">SSL</option>
                    <option value="tls">TLS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#444] mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={formData.smtpUsername}
                  onChange={(e) => handleChange('smtpUsername', e.target.value)}
                  className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#444] mb-1">SMTP Password</label>
                <input
                  type="password"
                  value={formData.smtpPassword}
                  onChange={(e) => handleChange('smtpPassword', e.target.value)}
                  className="w-full p-1.5 border border-[#ccc] rounded bg-white text-[12px] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>
            </div>
            <div className="bg-[#f7f7f7] border-t border-[#e5e5e5] px-4 py-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowMailProviderModal(false)}
                className="bg-white hover:bg-[#eee] border border-[#ccc] text-[#444] px-3 py-1 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMailProviderModal(false);
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 3000);
                }}
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded text-xs font-semibold"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
