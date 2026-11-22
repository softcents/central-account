'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  User,
  CheckCircle2,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Lock,
  CreditCard,
  Globe,
  FileText,
  Users,
  KeyRound,
  History,
  Check,
  AlertCircle,
  HelpCircle,
  Radio,
  FileCheck2,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';
import COUNTRIES from '@/data/countries.json';

function ProfileContent() {
  const searchParams = useSearchParams();
  const impUser = searchParams?.get('impersonate') || searchParams?.get('userid');

  const [activeClientId, setActiveClientId] = useState<string>('177');
  const [impQuery, setImpQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstname: 'Softcents',
    lastname: 'Enterprise',
    companyname: 'Softcents Telecom Ltd',
    email: 'client.test@softcents.com',
    phonenumber: '01711000111',
    address1: 'Gulshan-2, Dhaka',
    address2: '',
    city: 'Dhaka',
    state: 'Dhaka',
    postcode: '1212',
    country: 'BD',
    tax_id: '',
    defaultgateway: 'piprapay',
    billingcid: '0',
    language: 'english',
    marketing_emails_opt_in: true,
    email_preferences: {
      general: 1,
      invoice: 1,
      support: 1,
      product: 1,
      domain: 1,
      affiliate: 1,
    },
    customfields: {
      'Identity Document Type': 'Smart NID',
      'NID Namber': '1234567890',
      'Your Whatsapp No': '01711000111',
      'Permanent Full Address': 'Gulshan-2, Dhaka',
    } as Record<string, string>,
  });

  const [contacts, setContacts] = useState<any[]>([]);

  // Load client data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetId = impUser;
    const storedImp = localStorage.getItem('ci_impersonator_backup');
    if (!targetId && storedImp) {
      try {
        const parsed = JSON.parse(storedImp);
        targetId = parsed.targetUser?.whmcsId || parsed.targetUser?.id;
      } catch {}
    }

    if (!targetId) {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          targetId = u.whmcsId || u.id;
        } catch {}
      }
    }

    const cid = targetId ? String(targetId) : '177';
    setActiveClientId(cid);
    setImpQuery(`?impersonate=${encodeURIComponent(cid)}`);

    // Available contacts for this client
    const userContacts = (whmcsData?.contacts || []).filter(
      (c: any) => String(c.userid) === String(cid)
    );
    setContacts(userContacts);

    // Check local override first
    const savedOverride = localStorage.getItem(`profile_override_${cid}`);
    if (savedOverride) {
      try {
        const parsed = JSON.parse(savedOverride);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          email_preferences: { ...prev.email_preferences, ...(parsed.email_preferences || {}) },
          customfields: { ...prev.customfields, ...(parsed.customfields || {}) },
        }));
        return;
      } catch {}
    }

    // Load from synced whmcsData
    const matched = (whmcsData?.clients || []).find(
      (c: any) => String(c.id) === cid || String(c.whmcsId) === cid
    );

    if (matched) {
      setFormData({
        firstname: matched.firstname || '',
        lastname: matched.lastname || '',
        companyname: matched.companyname || matched.company || '',
        email: matched.email || '',
        phonenumber: matched.phonenumber || matched.phone || '',
        address1: matched.address1 || '',
        address2: matched.address2 || '',
        city: matched.city || '',
        state: matched.state || '',
        postcode: matched.postcode || '',
        country: matched.country || 'BD',
        tax_id: matched.tax_id || '',
        defaultgateway: matched.defaultgateway || 'piprapay',
        billingcid: String(matched.billingcid || '0'),
        language: matched.language || 'english',
        marketing_emails_opt_in: Boolean(matched.marketing_emails_opt_in ?? true),
        email_preferences: matched.email_preferences || {
          general: 1,
          invoice: 1,
          support: 1,
          product: 1,
          domain: 1,
          affiliate: 1,
        },
        customfields: {
          'Identity Document Type': matched.customfields?.['Identity Document Type'] || 'Smart NID',
          'NID Namber': matched.customfields?.['NID Namber'] || '',
          'Your Whatsapp No': matched.customfields?.['Your Whatsapp No'] || matched.phonenumber || '',
          'Permanent Full Address': matched.customfields?.['Permanent Full Address'] || matched.address1 || '',
          ...(matched.customfields || {}),
        },
      });
    }
  }, [impUser]);

  const handleCustomFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customfields: {
        ...prev.customfields,
        [name]: value,
      },
    }));
  };

  const handleEmailPreferenceToggle = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      email_preferences: {
        ...prev.email_preferences,
        [key]: (prev.email_preferences as any)[key] ? 0 : 1,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Save to local storage for instant sync across tabs
      if (typeof window !== 'undefined') {
        localStorage.setItem(`profile_override_${activeClientId}`, JSON.stringify(formData));

        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            const u = JSON.parse(storedUser);
            u.name = `${formData.firstname} ${formData.lastname}`.trim();
            if (u.profile) {
              u.profile.first_name = formData.firstname;
              u.profile.last_name = formData.lastname;
              u.profile.phone_number = formData.phonenumber;
            }
            localStorage.setItem('auth_user', JSON.stringify(u));
          } catch {}
        }
      }

      // 2. Persist to API route
      const res = await fetch('/api/client/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeClientId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save changes on server');
      }

      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSaved(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving profile changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-20">
      <ClientHeader />

      <main className="max-w-[1200px] mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
              <Link href={`/clientarea${impQuery}`} className="hover:text-[#1A4D80]">
                Portal Home
              </Link>
              <span>/</span>
              <Link href={`/clientarea${impQuery}`} className="hover:text-[#1A4D80]">
                Client Area
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">My Details</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <User className="w-6 h-6 text-[#1A4D80]" />
              <span>My Details</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and update your personal information, address, preferences, and identity verification details.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/clientarea${impQuery}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Quick Tabs Menu (WHMCS Twenty-One Sidebar / Sub-nav) */}
        <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold">
          <Link
            href={`/clientarea/profile${impQuery}`}
            className="px-4 py-2 border-b-2 border-[#1A4D80] text-[#1A4D80] bg-white rounded-t font-bold flex items-center space-x-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>My Details</span>
          </Link>
          <Link
            href={`/clientarea/contacts${impQuery}`}
            className="px-4 py-2 text-slate-600 hover:text-[#1A4D80] hover:bg-slate-100 rounded-t flex items-center space-x-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts / Sub-Accounts</span>
          </Link>
          <Link
            href={`/clientarea/security${impQuery}`}
            className="px-4 py-2 text-slate-600 hover:text-[#1A4D80] hover:bg-slate-100 rounded-t flex items-center space-x-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password / Security</span>
          </Link>
          <Link
            href={`/clientarea/emails${impQuery}`}
            className="px-4 py-2 text-slate-600 hover:text-[#1A4D80] hover:bg-slate-100 rounded-t flex items-center space-x-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Email History</span>
          </Link>
        </div>

        {/* Success Alert Banner */}
        {saved && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-md flex items-center space-x-2 text-sm shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">Changes Saved Successfully</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 rounded-md flex items-center space-x-2 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Main Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal & Contact Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <User className="w-4 h-4 text-[#1A4D80]" />
                <span>Personal Information</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">* Required Fields</span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Company Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.companyname}
                    onChange={(e) => setFormData({ ...formData, companyname: e.target.value })}
                    placeholder="Company or Organization"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  To modify your account primary email address, please contact support.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Address & Phone */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#1A4D80]" />
                <span>Address Details</span>
              </h2>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Street Address 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  placeholder="Street address, P.O. Box, company name"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Street Address 2 <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  State / Region / Division <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Dhaka, Chittagong, Sylhet"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Postcode / ZIP Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  placeholder="e.g. 1212"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phonenumber}
                    onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })}
                    placeholder="e.g. 01711000111"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Account Preferences */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-[#1A4D80]" />
                <span>Billing & Account Preferences</span>
              </h2>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={formData.defaultgateway}
                  onChange={(e) => setFormData({ ...formData, defaultgateway: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                >
                  <option value="">Default</option>
                  <option value="piprapay">
                    SoftCents System Billing (bKash / Nagad / Rocket / Upay / Cards / Net Banking)
                  </option>
                  <option value="banktransfer">Direct Bank Transfer / Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Default Billing Contact</label>
                <select
                  value={formData.billingcid}
                  onChange={(e) => setFormData({ ...formData, billingcid: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                >
                  <option value="0">Use Default Details</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstname} {contact.lastname} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                >
                  <option value="default">Default</option>
                  <option value="english">English</option>
                  <option value="bengali">বাংলা (Bengali)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Tax ID / VAT / Trade License <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="e.g. TRAD/DNCC/012456/2024 or BIN/TIN"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: WHMCS Custom Client Fields */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-[#1A4D80]" />
                <span>Identity & Verification Information</span>
              </h2>
              <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                WHMCS Verified
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Identity Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.customfields['Identity Document Type'] || 'Smart NID'}
                  onChange={(e) => handleCustomFieldChange('Identity Document Type', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                >
                  <option value="Smart NID">Smart NID</option>
                  <option value="Old Nid">Old Nid</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving Licence">Driving Licence</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  NID Namber <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customfields['NID Namber'] || ''}
                  onChange={(e) => handleCustomFieldChange('NID Namber', e.target.value)}
                  placeholder="Enter your NID or Document number"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Your Whatsapp No <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customfields['Your Whatsapp No'] || ''}
                  onChange={(e) => handleCustomFieldChange('Your Whatsapp No', e.target.value)}
                  placeholder="e.g. 01711000111"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  Permanent Full Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.customfields['Permanent Full Address'] || ''}
                  onChange={(e) => handleCustomFieldChange('Permanent Full Address', e.target.value)}
                  placeholder="Example: House 06, 26, Road 10/A, Dhanmondi, Dhaka 1205, BANGLADESH"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80] focus:border-[#1A4D80]"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Example: House 06, 26, Road 10/A, Dhanmondi, Dhaka 1205, BANGLADESH
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Email Notification Preferences */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#1A4D80]" />
                <span>Email Notifications</span>
              </h2>
            </div>

            <div className="p-5 text-xs space-y-3">
              <p className="text-slate-600 mb-2">
                Select the types of email notifications you wish to receive from our billing platform:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.email_preferences.general)}
                    onChange={() => handleEmailPreferenceToggle('general')}
                    className="mt-0.5 rounded text-[#1A4D80] focus:ring-[#1A4D80]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">General Emails</span>
                    <span className="text-slate-500 text-[11px]">
                      General announcements and password reminders
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.email_preferences.invoice)}
                    onChange={() => handleEmailPreferenceToggle('invoice')}
                    className="mt-0.5 rounded text-[#1A4D80] focus:ring-[#1A4D80]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Invoice Emails</span>
                    <span className="text-slate-500 text-[11px]">
                      Invoices, billing notifications & payment receipts
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.email_preferences.support)}
                    onChange={() => handleEmailPreferenceToggle('support')}
                    className="mt-0.5 rounded text-[#1A4D80] focus:ring-[#1A4D80]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Support Emails</span>
                    <span className="text-slate-500 text-[11px]">
                      Support ticket notifications & technical updates
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.email_preferences.product)}
                    onChange={() => handleEmailPreferenceToggle('product')}
                    className="mt-0.5 rounded text-[#1A4D80] focus:ring-[#1A4D80]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Product Emails</span>
                    <span className="text-slate-500 text-[11px]">
                      Order confirmations, service provisioning & welcome emails
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.email_preferences.domain)}
                    onChange={() => handleEmailPreferenceToggle('domain')}
                    className="mt-0.5 rounded text-[#1A4D80] focus:ring-[#1A4D80]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Domain Emails</span>
                    <span className="text-slate-500 text-[11px]">
                      Domain renewal notices & registration confirmations
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2 rounded hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.email_preferences.affiliate)}
                    onChange={() => handleEmailPreferenceToggle('affiliate')}
                    className="mt-0.5 rounded text-[#1A4D80] focus:ring-[#1A4D80]"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block">Affiliate Emails</span>
                    <span className="text-slate-500 text-[11px]">
                      Monthly affiliate referral reports & commission payout notices
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 6: Marketing Email Opt-In */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Join our mailing list</span>
              </h2>
            </div>

            <div className="p-5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="max-w-2xl text-slate-600">
                <p>
                  We would like to send you occasional news, information and special offers by email.
                  Choose whether you want to join our mailing list. You can unsubscribe at any time.
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      marketing_emails_opt_in: !formData.marketing_emails_opt_in,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.marketing_emails_opt_in ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.marketing_emails_opt_in ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="font-bold text-slate-700">
                  {formData.marketing_emails_opt_in ? 'Subscribed' : 'Unsubscribed'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-[#1A4D80] hover:bg-[#143d66] text-white px-8 py-2.5 rounded text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function ClientProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1A4D80] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
