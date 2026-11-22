'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { Globe, Search, CheckCircle2, XCircle, ShoppingCart, ArrowRight } from 'lucide-react';

export default function DomainCheckerPage() {
  const router = useRouter();
  const [domainInput, setDomainInput] = useState('');
  const [selectedTld, setSelectedTld] = useState('.com');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    domain: string;
    available: boolean;
    price: string;
  } | null>(null);

  const tldPricing = [
    { tld: '.com', register: '৳1,450.00', transfer: '৳1,450.00', renew: '৳1,650.00' },
    { tld: '.net', register: '৳1,650.00', transfer: '৳1,650.00', renew: '৳1,850.00' },
    { tld: '.org', register: '৳1,550.00', transfer: '৳1,550.00', renew: '৳1,750.00' },
    { tld: '.info', register: '৳1,200.00', transfer: '৳1,950.00', renew: '৳2,100.00' },
    { tld: '.xyz', register: '৳450.00', transfer: '৳1,450.00', renew: '৳1,550.00' },
    { tld: '.com.bd', register: '৳2,200.00', transfer: '৳1,500.00', renew: '৳2,200.00' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    let clean = domainInput.trim().toLowerCase();
    if (!clean.includes('.')) {
      clean = clean + selectedTld;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const res = await fetch(`/api/whmcs/domains/check?domain=${encodeURIComponent(clean)}`);
      const data = await res.json();
      setIsSearching(false);
      const isAvail = data.isAvailable ?? (data.status === 'available');
      setSearchResult({
        domain: data.domain || clean,
        available: isAvail,
        price: data.pricing?.register ? `৳${data.pricing.register.toLocaleString()}.00 BDT` : '৳1,450.00 BDT',
      });
    } catch {
      setIsSearching(false);
      setSearchResult({
        domain: clean,
        available: true,
        price: '৳1,450.00 BDT',
      });
    }
  };

  const handleAddToCart = (domain: string) => {
    router.push(`/cart?a=add&domain=register&query=${encodeURIComponent(domain)}`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <ClientHeader />
      {/* Header & Hero */}
      <div className="bg-[#1A4D80] text-white py-12 px-4 shadow-sm">
        <div className="max-w-[1000px] mx-auto text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sky-200 text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Domain Registration &amp; Transfer</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Find Your Perfect Domain Name
          </h1>
          <p className="text-xs text-sky-100 max-w-xl mx-auto">
            Search, register, or transfer domains with free DNS management, email forwarding, and instant nameserver delegation.
          </p>

          {/* Domain Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
            <div className="flex flex-col sm:flex-row shadow-lg rounded-lg overflow-hidden bg-white">
              <div className="flex-1 relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="Enter your domain name (e.g. mycompany)..."
                  className="w-full pl-11 pr-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <select
                value={selectedTld}
                onChange={(e) => setSelectedTld(e.target.value)}
                className="bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-700 px-3 py-3 focus:outline-none"
              >
                <option value=".com">.com</option>
                <option value=".net">.net</option>
                <option value=".org">.org</option>
                <option value=".info">.info</option>
                <option value=".xyz">.xyz</option>
                <option value=".com.bd">.com.bd</option>
              </select>

              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-8">
        {/* Search Result Box */}
        {searchResult && (
          <div
            className={`rounded-lg border p-6 transition-all ${
              searchResult.available
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-rose-50 border-rose-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                {searchResult.available ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="text-base font-bold text-slate-900">
                    {searchResult.domain}{' '}
                    {searchResult.available ? (
                      <span className="text-emerald-700 font-semibold text-sm">is available!</span>
                    ) : (
                      <span className="text-rose-700 font-semibold text-sm">is already registered.</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {searchResult.available
                      ? `Register now for ${searchResult.price} / year`
                      : 'You can transfer this domain to us or choose another TLD below.'}
                  </div>
                </div>
              </div>

              <div>
                {searchResult.available ? (
                  <button
                    onClick={() => handleAddToCart(searchResult.domain)}
                    className="inline-flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2.5 rounded text-xs font-bold shadow-sm transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/cart?a=add&domain=transfer&query=${encodeURIComponent(searchResult.domain)}`)}
                    className="inline-flex items-center space-x-1.5 bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2.5 rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Transfer to Us</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Domain Pricing Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#1A4D80]" />
            Top Domain Extensions &amp; Pricing
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">TLD</th>
                  <th className="py-2.5 px-3">New Registration</th>
                  <th className="py-2.5 px-3">Transfer</th>
                  <th className="py-2.5 px-3">Renewal</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tldPricing.map((item) => (
                  <tr key={item.tld} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-[#1A4D80] text-sm">{item.tld}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.register} / yr</td>
                    <td className="py-3 px-3 text-slate-600">{item.transfer} / yr</td>
                    <td className="py-3 px-3 text-slate-600">{item.renew} / yr</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setDomainInput(`mycompany${item.tld}`);
                          handleAddToCart(`mycompany${item.tld}`);
                        }}
                        className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded text-xs font-semibold transition-colors"
                      >
                        Register
                      </button>
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
