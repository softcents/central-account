'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, AlertCircle, ArrowRight, Globe, Mail, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CreateBusinessPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [countries, setCountries] = useState<any[]>([
    { code: 'BD', name: 'Bangladesh' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
  ]);

  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    businessType: 'LLC',
    countryCode: 'BD',
    address: '',
    businessEmail: '',
    website: '',
    tradeLicenseNumber: '',
    licenseIssueDate: '',
    licenseExpiryDate: '',
    issuingAuthority: '',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await apiFetch<any[]>('/countries');
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          setCountries(res.data);
        }
      } catch {
        // ignore
      }
    }
    loadCountries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        '/business',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        },
        accessToken,
      );

      if (res.ok && res.data?.id) {
        router.push(`/business/verification?id=${res.data.id}`);
      } else {
        setError(res.data?.message || 'Failed to register business entity');
      }
    } catch {
      setError('Connection to business verification server failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Register Business Entity</h1>
        <p className="text-sm text-slate-400 mt-1">
          Provide legal entity details to initiate organizational KYB verification
        </p>
      </div>

      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Legal Entity Name *
              </label>
              <input
                type="text"
                required
                placeholder="Acme Global Corporation Ltd."
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Trade / DBA Name
              </label>
              <input
                type="text"
                placeholder="Acme Solutions"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Business Type *
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="LLC">Limited Liability Company (LLC)</option>
                <option value="CORPORATION">Private / Public Corporation</option>
                <option value="PARTNERSHIP">General / Limited Partnership</option>
                <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Jurisdiction / Country *
              </label>
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Trade License / Reg Number *
              </label>
              <input
                type="text"
                required
                placeholder="TRD-12345678"
                value={formData.tradeLicenseNumber}
                onChange={(e) => setFormData({ ...formData, tradeLicenseNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Issuing Government Authority
              </label>
              <input
                type="text"
                placeholder="Registrar of Joint Stock Companies / City Corp"
                value={formData.issuingAuthority}
                onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Corporate Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="compliance@acme.com"
                value={formData.businessEmail}
                onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Website
              </label>
              <input
                type="url"
                placeholder="https://acme.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Registered Physical Address *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Full registered headquarters address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>{isSubmitting ? 'Creating Entity...' : 'Proceed to Document Upload'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
