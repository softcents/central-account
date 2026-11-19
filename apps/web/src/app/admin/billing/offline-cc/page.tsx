'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, ChevronRight } from 'lucide-react';

export default function OfflineCCPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/invoices" className="text-[#1A4D80] hover:underline font-semibold">
          Billing
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Offline Credit Card Processing</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/offlinecc.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Offline Credit Card Processing
            </h1>
            <p className="text-xs text-slate-500">
              Manual capture and processing of offline merchant credit card charges
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded border border-slate-200 shadow-sm text-center text-xs text-slate-500">
        <CreditCard className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">No cards due for offline processing</p>
        <p>All online merchant gateways are processing card payments automatically.</p>
      </div>
    </div>
  );
}
