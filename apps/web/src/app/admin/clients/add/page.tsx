'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Mail,
  Lock,
  Building,
  MapPin,
  Phone,
  Globe,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminAddClientPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('BD');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [currency, setCurrency] = useState('BDT');
  const [sendEmail, setSendEmail] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create user via register/admin API
      const res = await apiFetch<any>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password: password || 'TempPass@123',
            firstName,
            lastName,
            phoneNumber,
            companyName,
          }),
        },
        token,
      );

      if (res.ok) {
        setNotice('Client added successfully! Redirecting to client directory...');
        setTimeout(() => {
          router.push('/admin/clients');
        }, 1500);
      } else {
        setError(res.error || 'Failed to create client');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans text-[#333] space-y-4 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between pb-2 border-b border-[#ddd]">
        <div>
          <div className="text-[11px] text-[#666] flex items-center space-x-1">
            <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <Link href="/admin/clients" className="text-[#1A4D80] hover:underline">
              Clients
            </Link>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">Add New Client</span>
          </div>
          <h1 className="text-xl font-normal text-[#333] mt-1">Add New Client</h1>
        </div>

        <Link
          href="/admin/clients"
          className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clients</span>
        </Link>
      </div>

      {notice && (
        <div className="bg-[#dff0d8] border border-[#d6e9c6] text-[#3c763d] px-4 py-2.5 rounded text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="bg-[#f2dede] border border-[#ebccd1] text-[#a94442] px-4 py-2.5 rounded text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* WHMCS Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Personal Information */}
        <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
          <div
            className="px-4 py-2 font-bold text-xs text-white"
            style={{ backgroundColor: '#1A4D80' }}
          >
            Personal Information
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#555] mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tanvir"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Hasan"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Ltd."
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.com"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#555] mb-1">Account Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure client password"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Billing Address */}
        <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
          <div
            className="px-4 py-2 font-bold text-xs text-white"
            style={{ backgroundColor: '#1A4D80' }}
          >
            Billing Address
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#555] mb-1">Address 1</label>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="House / Street"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">Address 2</label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="Apartment / Suite"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dhaka"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">State / Region</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Dhaka Division"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">Postcode / ZIP</label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="1205"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#555] mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              >
                <option value="BD">Bangladesh</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="IN">India</option>
                <option value="CA">Canada</option>
                <option value="AE">United Arab Emirates</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#555] mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+8801700000000"
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Billing & Additional Preferences */}
        <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
          <div
            className="px-4 py-2 font-bold text-xs text-white"
            style={{ backgroundColor: '#1A4D80' }}
          >
            Preferences
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#555] mb-1">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1A4D80]"
              >
                <option value="BDT">BDT (৳ BDT)</option>
                <option value="USD">USD ($ USD)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="sendEmail"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded border-[#ccc] text-[#1A4D80] focus:ring-0"
              />
              <label htmlFor="sendEmail" className="font-semibold text-[#555]">
                Send Client Signup Welcome Email
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold text-xs px-5 py-2.5 rounded shadow-sm flex items-center space-x-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{submitting ? 'Creating Client...' : 'Add Client'}</span>
          </button>

          <Link
            href="/admin/clients"
            className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-4 py-2 rounded transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
