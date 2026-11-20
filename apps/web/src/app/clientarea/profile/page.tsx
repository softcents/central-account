'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { User, CheckCircle2, Save, Building, Mail, Phone, MapPin, ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

const COUNTRIES = [
  'Bangladesh',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'India',
  'Malaysia',
  'Germany',
  'United Arab Emirates',
  'Saudi Arabia',
];

export default function ClientProfilePage() {
  const [formData, setFormData] = useState({
    firstName: 'Softcents',
    lastName: 'Customer',
    companyName: 'SoftCents Systems Ltd.',
    email: 'client@softcents.com',
    phoneNumber: '+880 1700 000000',
    taxId: 'TRAD/DNCC/012456/2024',
    address1: 'Gulshan-2, Road 45, House 12',
    address2: 'Apt 4B',
    city: 'Dhaka',
    state: 'Dhaka',
    postcode: '1212',
    country: 'Bangladesh',
  });

  const [saved, setSaved] = useState(false);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const imp = urlParams.get('impersonate') || urlParams.get('userid');
    let targetId = imp;

    const storedImp = localStorage.getItem('ci_impersonator_backup');
    if (!targetId && storedImp) {
      try {
        const parsed = JSON.parse(storedImp);
        targetId = parsed.targetUser?.whmcsId || parsed.targetUser?.id;
      } catch {}
    }

    if (targetId) {
      setActiveClientId(String(targetId));

      // Check if user had previously saved custom details locally
      const savedOverride = localStorage.getItem(`profile_override_${targetId}`);
      if (savedOverride) {
        try {
          setFormData(JSON.parse(savedOverride));
          return;
        } catch {}
      }

      const matched = (whmcsData?.clients || []).find(
        (c: any) => String(c.id) === String(targetId) || String(c.whmcsId) === String(targetId)
      );
      if (matched) {
        setFormData({
          firstName: matched.firstname || 'Customer',
          lastName: matched.lastname || '',
          companyName: matched.company || matched.companyname || '',
          email: matched.email || '',
          phoneNumber: matched.phone || matched.phonenumber || '',
          taxId: 'TRAD/DNCC/012456/2024',
          address1: matched.address1 || '',
          address2: '',
          city: matched.city || '',
          state: matched.state || '',
          postcode: matched.postcode || '',
          country: matched.country === 'BD' ? 'Bangladesh' : matched.country || 'Bangladesh',
        });
        return;
      }
    }

    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          firstName: u.profile?.first_name || u.name?.split(' ')[0] || prev.firstName,
          lastName: u.profile?.last_name || u.name?.split(' ').slice(1).join(' ') || prev.lastName,
          companyName: u.customerRegistration?.company_name || prev.companyName,
          email: u.email || prev.email,
          phoneNumber: u.profile?.phone_number || prev.phoneNumber,
        }));
      } catch {}
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof window !== 'undefined') {
      if (activeClientId) {
        localStorage.setItem(`profile_override_${activeClientId}`, JSON.stringify(formData));
      }
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          u.name = `${formData.firstName} ${formData.lastName}`.trim();
          if (u.profile) {
            u.profile.first_name = formData.firstName;
            u.profile.last_name = formData.lastName;
            u.profile.phone_number = formData.phoneNumber;
          }
          localStorage.setItem('auth_user', JSON.stringify(u));
        } catch {}
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-16">
      <ClientHeader />

      <main className="max-w-[1000px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
              <span>My Account Details</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Keep your contact information, billing address, and tax registration records up to date.
            </p>
          </div>

          <div>
            <Link
              href="/clientarea"
              className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-block"
            >
              &larr; Back to Client Area
            </Link>
          </div>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Your account and billing profile details have been saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Organization Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                <span>Email Address (Primary Login)</span>
                <span className="text-[10px] text-slate-400 font-normal flex items-center">
                  <Lock className="w-3 h-3 mr-0.5" /> Locked
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone / WhatsApp Number *</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tax ID / Trade License / VAT</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. TRAD/DNCC/012456/2024 or BIN/TIN"
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Street Address Line 1 *</label>
              <input
                type="text"
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={formData.address2}
                onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                placeholder="Apartment, suite, unit, building, floor"
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">State / Region / Division</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Postal / Zip Code</label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Country *</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80] font-semibold"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-6 py-2.5 rounded text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
