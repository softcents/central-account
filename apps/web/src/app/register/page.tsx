'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Globe, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Country {
  code: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'BD', name: 'Bangladesh' },
  ]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: 'US',
    termsAccepted: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    verificationUrl?: string;
  } | null>(null);

  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await apiFetch<Country[]>('/countries');
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          setCountries(res.data);
        }
      } catch {
        // Fallback already in initial state
      }
    }
    loadCountries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.termsAccepted) {
      setError('You must accept the terms of service and privacy policy');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        verificationUrl?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errMsg =
          (res.data as any)?.message ||
          (Array.isArray((res.data as any)?.errors) ? (res.data as any).errors[0] : 'Registration failed');
        setError(errMsg);
      } else {
        // Immediately navigate to the email verification page view
        if (res.data.verificationUrl) {
          try {
            const urlObj = new URL(res.data.verificationUrl, window.location.origin);
            router.push(urlObj.pathname + urlObj.search);
            return;
          } catch {
            // fallback
          }
        }
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err: any) {
      setError('Network or server connection failed. Please ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Central ID</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise identity, secured with Argon2id & TOTP
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-black/40">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successInfo ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-start space-x-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-emerald-200">Account Created!</h4>
                  <p className="mt-1">{successInfo.message}</p>
                </div>
              </div>

              {successInfo.verificationUrl && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div className="text-slate-400 mb-2 font-medium">Instant Verification Link:</div>
                  <a
                    href={successInfo.verificationUrl}
                    className="inline-flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 font-medium underline break-all"
                  >
                    <span>Click here to complete email verification</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Link
                  href="/verify-email"
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm text-center shadow-lg shadow-indigo-600/25 transition-all"
                >
                  Go to Verification Page
                </Link>
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm text-center transition-all"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Country
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all appearance-none cursor-pointer"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Min. 8 characters with uppercase, lowercase, and number/symbol.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="mt-1 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-400">
                    I agree to the{' '}
                    <span className="text-slate-200 underline">Terms of Service</span> and{' '}
                    <span className="text-slate-200 underline">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>{isLoading ? 'Creating Account...' : 'Register'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
