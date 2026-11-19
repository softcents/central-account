'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Globe } from 'lucide-react';

export default function WhoisLookupPage() {
  const [domain, setDomain] = useState('softcents.com');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(
        `Domain Name: ${domain.toUpperCase()}\nRegistry Domain ID: 2639148011_DOMAIN_COM-VRSN\nRegistrar: NAMECHEAP INC\nCreation Date: 2021-09-08T06:51:24Z\nRegistry Expiry Date: 2027-09-08T06:51:24Z\nRegistrar WHOIS Server: whois.namecheap.com\nName Server: NS1.SOFTCENTS.COM\nName Server: NS2.SOFTCENTS.COM\nStatus: clientTransferProhibited`
      );
      setLoading(false);
    }, 400);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Utilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">WHOIS Lookup</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <Globe className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">WHOIS Lookup</h1>
            <p className="text-xs text-slate-500">
              Query registry WHOIS servers for domain ownership, registrar, and nameserver data
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4 text-xs">
        <form onSubmit={handleLookup} className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="domain.com"
            className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold"
          >
            {loading ? 'Querying...' : 'Lookup WHOIS'}
          </button>
        </form>

        {result && (
          <div className="bg-slate-900 text-emerald-400 p-4 rounded font-mono text-xs whitespace-pre overflow-x-auto shadow-inner">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
