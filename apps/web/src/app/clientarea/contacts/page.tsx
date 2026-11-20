'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Save,
  Mail,
  Phone,
  Building,
  KeyRound,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function ContactsContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate') || searchParams.get('userid');

  // Filter contacts
  const initialContacts = useMemo(() => {
    const list = whmcsData?.contacts || [];
    if (impersonate) {
      const matched = list.filter((c: any) => String(c.userid) === String(impersonate));
      if (matched.length > 0) return matched;
    }
    return list;
  }, [impersonate]);

  const [contactsList, setContactsList] = useState<any[]>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState<string>('new');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Bangladesh',
    isSubaccount: false,
    permissions: {
      profile: true,
      products: true,
      invoices: true,
      tickets: true,
      domains: false,
      emails: true,
    },
    emailPrefs: {
      general: true,
      invoice: true,
      support: true,
      product: true,
      domain: false,
    },
  });

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    setSaveMsg(null);
    if (id === 'new') {
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        address1: '',
        city: '',
        state: '',
        postcode: '',
        country: 'Bangladesh',
        isSubaccount: false,
        permissions: {
          profile: true,
          products: true,
          invoices: true,
          tickets: true,
          domains: false,
          emails: true,
        },
        emailPrefs: {
          general: true,
          invoice: true,
          support: true,
          product: true,
          domain: false,
        },
      });
    } else {
      const c = contactsList.find((item) => String(item.id) === String(id));
      if (c) {
        setFormData({
          firstName: c.firstname || '',
          lastName: c.lastname || '',
          company: c.companyname || '',
          email: c.email || '',
          phone: c.phonenumber || '',
          address1: c.address1 || '',
          city: c.city || '',
          state: c.state || '',
          postcode: c.postcode || '',
          country: c.country === 'BD' ? 'Bangladesh' : c.country || 'Bangladesh',
          isSubaccount: c.subaccount === '1' || c.subaccount === 1,
          permissions: {
            profile: true,
            products: true,
            invoices: true,
            tickets: true,
            domains: false,
            emails: true,
          },
          emailPrefs: {
            general: true,
            invoice: true,
            support: true,
            product: true,
            domain: false,
          },
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) {
      alert('First Name and Email are required.');
      return;
    }

    if (selectedContactId === 'new') {
      const newContact = {
        id: `ct_${Date.now()}`,
        firstname: formData.firstName,
        lastname: formData.lastName,
        companyname: formData.company,
        email: formData.email,
        phonenumber: formData.phone,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country,
        subaccount: formData.isSubaccount ? '1' : '0',
      };
      setContactsList((prev) => [...prev, newContact]);
      setSelectedContactId(newContact.id);
      setSaveMsg('New contact created successfully!');
    } else {
      setContactsList((prev) =>
        prev.map((c) =>
          String(c.id) === String(selectedContactId)
            ? {
                ...c,
                firstname: formData.firstName,
                lastname: formData.lastName,
                companyname: formData.company,
                email: formData.email,
                phonenumber: formData.phone,
                address1: formData.address1,
                city: formData.city,
                state: formData.state,
                postcode: formData.postcode,
                country: formData.country,
                subaccount: formData.isSubaccount ? '1' : '0',
              }
            : c
        )
      );
      setSaveMsg('Contact details updated successfully!');
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContactsList((prev) => prev.filter((c) => String(c.id) !== String(selectedContactId)));
      setSelectedContactId('new');
      setSaveMsg('Contact deleted successfully.');
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  return (
    <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
            <span>Contacts &amp; Sub-Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize additional personnel to access your account, open support tickets, view invoices, and receive email copies.
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

      {saveMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT COLUMN: Contact Selector */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#1A4D80] text-white px-4 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Choose Contact</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono">
                {contactsList.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <button
                onClick={() => handleSelectContact('new')}
                className={`w-full text-left px-4 py-3 flex items-center space-x-2 transition-colors ${
                  selectedContactId === 'new'
                    ? 'bg-[#1A4D80] text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add New Contact</span>
              </button>

              {contactsList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectContact(String(c.id))}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedContactId === String(c.id)
                      ? 'bg-[#1A4D80] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate font-semibold">
                    {c.firstname} {c.lastname}
                  </div>
                  <div
                    className={`text-[11px] truncate ${
                      selectedContactId === String(c.id) ? 'text-white/80' : 'text-slate-500'
                    }`}
                  >
                    {c.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Contact Edit Form */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-6 text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {selectedContactId === 'new' ? 'Add New Contact Details' : 'Edit Contact Details'}
              </h2>
              {selectedContactId !== 'new' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Contact</span>
                </button>
              )}
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:border-[#1A4D80] focus:outline-none font-semibold"
                >
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="India">India</option>
                  <option value="Canada">Canada</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>
            </div>

            {/* Sub-account Access Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSubaccount}
                  onChange={(e) => setFormData({ ...formData, isSubaccount: e.target.checked })}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Activate Sub-Account Login Access
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Allow this contact to sign in to the SoftCents client area using their own password.
                  </span>
                </div>
              </label>

              {formData.isSubaccount && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800">Permissions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>Modify Master Account Profile</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>View &amp; Manage Products &amp; Services</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>View &amp; Pay Invoices</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>View &amp; Open Support Tickets</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>View &amp; Manage Domains</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span>View Email History</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Email Notification Preferences */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Email Notification Types</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>General Emails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Invoice &amp; Billing Emails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Support Ticket Emails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Product Service Emails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked />
                  <span>Domain Renewal Notices</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="submit"
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-6 py-2.5 rounded font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ClientContactsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Contacts...</div>}>
        <ContactsContent />
      </Suspense>
    </div>
  );
}
