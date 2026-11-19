'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { User, CheckCircle2, Save, Building, Mail, Phone, MapPin } from 'lucide-react';

export default function ClientProfilePage() {
  const [formData, setFormData] = useState({
    firstName: 'Raju',
    lastName: 'Ahmed',
    companyName: 'SoftCents Systems Ltd.',
    email: 'admin@softcents.com',
    phoneNumber: '+880 1700 000000',
    address1: 'House 12, Road 4, Sector 3',
    city: 'Uttara, Dhaka',
    state: 'Dhaka',
    postcode: '1230',
    country: 'Bangladesh',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1000px] mx-auto px-4 py-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <User className="w-6 h-6 text-[#1A4D80]" />
            <span>My Account Details</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Keep your billing contact address and company identity up to date.
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Your account details have been saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address1}
                onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
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
