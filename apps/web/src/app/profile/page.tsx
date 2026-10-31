'use client';

import React, { useEffect, useState } from 'react';
import { User, ShieldCheck, Mail, Phone, Globe, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('BD');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/users/me', {}, token);
      if (res.ok) {
        setProfileData(res.data);
        if (res.data.profile) {
          setFirstName(res.data.profile.first_name || '');
          setLastName(res.data.profile.last_name || '');
          setPhoneNumber(res.data.profile.phone_number || '');
          setCountryCode(res.data.profile.country_code || 'BD');
        }
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await apiFetch<any>(
        '/users/me/profile',
        {
          method: 'PATCH',
          body: JSON.stringify({ firstName, lastName, phoneNumber, countryCode }),
        },
        token,
      );

      if (res.ok) {
        setSuccessMsg('Profile information updated successfully.');
        fetchProfile();
      } else {
        throw new Error(res.data?.message || 'Failed to update profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Personal Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal identity credentials and contact information.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Summary Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
            {firstName ? firstName[0] : user?.email ? user.email[0].toUpperCase() : 'U'}
          </div>

          <div>
            <div className="text-base font-bold text-white">
              {firstName || lastName ? `${firstName} ${lastName}` : 'Unconfigured Name'}
            </div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">KYC Status:</span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <span>{profileData?.verification?.verification_level || 'LEVEL_0'}</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email Verified:</span>
              <span className="text-emerald-400 font-medium">
                {profileData?.emailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Edit Form */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-sm font-semibold text-white mb-4">Edit Personal Details</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Country Code</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="BD, US, GB, etc."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+880 1712-000000"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
