'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function BusinessListPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadBusinesses() {
      if (!accessToken) return;
      try {
        const res = await apiFetch<any[]>('/business', {}, accessToken);
        if (res.ok && Array.isArray(res.data)) {
          setBusinesses(res.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, [accessToken]);

  if (isLoading || loading) {
    return <div className="p-8 text-center text-slate-400">Loading business entities...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Business Entities (KYB)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise verification, trade license parsing, and organizational compliance
          </p>
        </div>

        <Link
          href="/business/create"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Business</span>
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <Building2 className="w-12 h-12 mx-auto text-slate-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Registered Businesses</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are not currently linked to any commercial organizations. Register your enterprise to
              initiate automated KYB verification.
            </p>
          </div>
          <Link
            href="/business/create"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
          >
            <span>Register Business</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map((m) => {
            const b = m.business;
            const status = b.status;
            const level = b.verification_level;

            return (
              <div
                key={b.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-snug">{b.legal_name}</h2>
                      <span className="text-xs text-slate-400">
                        {b.business_type} &bull; {b.country_code}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                    Role: {m.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Trade License</span>
                    <span className="font-mono text-slate-200">{b.trade_license_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">KYB Status</span>
                    <span
                      className={`font-semibold ${
                        status === 'VERIFIED'
                          ? 'text-emerald-400'
                          : status === 'KYC_PENDING'
                          ? 'text-amber-400'
                          : 'text-indigo-300'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Tier Level</span>
                    <span className="font-bold text-white">{level}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Registered Email</span>
                    <span className="text-slate-300 truncate block">{b.business_email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={`/business/verification?id=${b.id}`}
                    className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload License & Verify</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
