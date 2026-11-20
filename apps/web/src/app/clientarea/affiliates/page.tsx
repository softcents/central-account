'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AffiliatesClientPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://account.softcents.com/aff.php?aff=168';
  const balance = 0.0;
  const payoutThreshold = 5000.0;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referrals = [
    {
      id: 1,
      date: '2026-11-15',
      service: 'cPanel NVMe Web Hosting - Starter',
      amount: '৳450.00',
      commission: '৳0.00',
      status: 'Active',
    },
    {
      id: 2,
      date: '2026-11-10',
      service: 'Standard Cloud VPS - 2 vCPU',
      amount: '৳1,500.00',
      commission: '৳0.00',
      status: 'Active',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            /{' '}
            <Link href="/clientarea" className="text-[#1A4D80] hover:underline">
              Client Area
            </Link>{' '}
            / Affiliates
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1A4D80]" />
            Affiliate Program
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Refer clients to SoftCents Systems and earn recurring commissions on web hosting, cloud VPS, and PBX subscriptions.
          </p>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-8">
        {/* Referral Link Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-2">
            Your Unique Referral Link:
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center space-x-1.5 bg-[#1A4D80] hover:bg-[#143d66] text-white px-4 py-2 rounded text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Share this link on your website, social media, or via email. Cookies are stored for 90 days.
          </p>
        </div>

        {/* 4 Stat Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="text-slate-400 text-xs font-semibold uppercase">Total Clicks</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">24</div>
            <div className="text-[11px] text-slate-500 mt-1">Visitors referred</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="text-slate-400 text-xs font-semibold uppercase">Signups</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">2</div>
            <div className="text-[11px] text-slate-500 mt-1">Paid accounts created</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="text-slate-400 text-xs font-semibold uppercase">Conversion Rate</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">8.33%</div>
            <div className="text-[11px] text-slate-500 mt-1">Clicks to signup</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
            <div className="text-slate-400 text-xs font-semibold uppercase">Available Balance</div>
            <div className="text-2xl font-bold text-[#1A4D80] mt-1">৳0.00 BDT</div>
            <div className="text-[11px] text-slate-500 mt-1">Min payout: ৳5,000.00</div>
          </div>
        </div>

        {/* Payout Status Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              You need a minimum balance of <strong>৳5,000.00 BDT</strong> before you can request a commission payout.
            </span>
          </div>
          <button
            disabled={balance < payoutThreshold}
            onClick={() => alert('Payout request sent to billing department.')}
            className="bg-slate-300 text-slate-600 cursor-not-allowed px-4 py-2 rounded text-xs font-semibold shrink-0"
          >
            Request Payout
          </button>
        </div>

        {/* Referrals Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
            Referred Signups &amp; History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Package / Service</th>
                  <th className="py-2.5 px-3">Order Amount</th>
                  <th className="py-2.5 px-3">Commission Earned</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-600">{ref.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{ref.service}</td>
                    <td className="py-3 px-3 text-slate-700">{ref.amount}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{ref.commission}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
