'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import whmcsData from '@/data/whmcs_sync.json';

function decodeHtml(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&bull;/g, '•');
}
import {
  Search,
  Globe,
  Server,
  BookOpen,
  Download,
  LifeBuoy,
  Home,
  Box,
  MessageSquare,
  CreditCard,
  Megaphone,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [domainSearch, setDomainSearch] = useState('');

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainSearch.trim()) return;
    router.push(`/domainchecker?domain=${encodeURIComponent(domainSearch.trim())}`);
  };

  const handleDomainTransfer = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!domainSearch.trim()) {
      router.push('/cart?a=add&domain=transfer');
    } else {
      router.push(`/cart?a=add&domain=transfer&sld=${encodeURIComponent(domainSearch.trim())}`);
    }
  };

  const productCategories = [
    ...(whmcsData?.productGroups || [])
      .filter((g: any) => g.hidden !== '1')
      .sort((a: any, b: any) => parseInt(a.order || '999') - parseInt(b.order || '999'))
      .map((g: any) => ({
        id: g.id,
        title: decodeHtml(g.name),
        description: decodeHtml(g.tagline || g.headline || g.name),
        link: `/cart?gid=${g.id}`,
        buttonText: 'Browse Products',
      })),
    {
      id: 'reg-domain',
      title: 'Register a New Domain',
      description: 'Secure your domain name by registering it today',
      link: '/cart?a=add&domain=register',
      buttonText: 'Domain Search',
    },
    {
      id: 'transfer-domain',
      title: 'Transfer Your Domain',
      description: 'Transfer now to extend your domain by 1 year',
      link: '/cart?a=add&domain=transfer',
      buttonText: 'Transfer Your Domain',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex flex-col justify-between">
      <ClientHeader />

      {/* Master Breadcrumb */}
      <nav className="border-b border-slate-200/80 bg-transparent" aria-label="breadcrumb">
        <div className="max-w-[1240px] mx-auto px-4 py-2.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Portal Home</span>
        </div>
      </nav>

      {/* Home Domain Search Hero (.home-domain-search) */}
      <section className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 tracking-tight">
            Secure your domain name
          </h2>
          <form onSubmit={handleDomainSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                name="domain"
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                placeholder="eg. example.com"
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded text-sm text-slate-800 focus:outline-none focus:border-[#0d6efd] shadow-2xs"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial bg-[#0d6efd] hover:bg-[#0b5ed7] text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors shadow-xs"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleDomainTransfer}
                  className="flex-1 sm:flex-initial bg-[#198754] hover:bg-[#157347] text-white px-6 py-2.5 rounded font-semibold text-sm transition-colors shadow-xs"
                >
                  Transfer
                </button>
              </div>
            </div>
            <div className="text-right mt-2">
              <Link href="/cart?a=add&domain=register" className="text-xs text-[#0d6efd] hover:underline font-medium">
                View all pricing
              </Link>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1240px] mx-auto px-4 py-8 flex-1 w-full space-y-12">
        {/* SECTION: Browse our Products/Services */}
        <section>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8 tracking-tight">
            Browse our Products/Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-slate-200 rounded p-6 sm:p-8 text-center flex flex-col justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 min-h-[36px]">
                    {cat.description}
                  </p>
                </div>
                <Link
                  href={cat.link}
                  className="border border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white rounded py-2 text-xs font-semibold block transition-colors shadow-2xs"
                >
                  {cat.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: How can we help today (WHMCS Action Icon Buttons) */}
        <section>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8 tracking-tight">
            How can we help today
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Announcements */}
            <Link
              href="/announcements"
              className="bg-white border-t-[3px] border-[#00aba9] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <Megaphone className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#00aba9] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Announcements</span>
            </Link>

            {/* Network Status */}
            <Link
              href="/networkissues"
              className="bg-white border-t-[3px] border-[#c0392b] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <Server className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#c0392b] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Network Status</span>
            </Link>

            {/* Knowledgebase */}
            <Link
              href="/knowledgebase"
              className="bg-white border-t-[3px] border-[#f1c40f] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#f1c40f] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Knowledgebase</span>
            </Link>

            {/* Downloads */}
            <Link
              href="/downloads"
              className="bg-white border-t-[3px] border-[#7f8c8d] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <Download className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#7f8c8d] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Downloads</span>
            </Link>

            {/* Submit a Ticket */}
            <Link
              href="/support/new"
              className="col-span-2 sm:col-span-1 bg-white border-t-[3px] border-[#5cb85c] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <LifeBuoy className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#5cb85c] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Submit a Ticket</span>
            </Link>
          </div>
        </section>

        {/* SECTION: Your Account */}
        <section>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8 tracking-tight">
            Your Account
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Your Account */}
            <Link
              href="/clientarea"
              className="bg-white border-t-[3px] border-[#2c3e50] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <Home className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#2c3e50] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Your Account</span>
            </Link>

            {/* Manage Services */}
            <Link
              href="/clientarea/services"
              className="bg-white border-t-[3px] border-[#2c3e50] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <Box className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#2c3e50] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Manage Services</span>
            </Link>

            {/* Manage Domains */}
            <Link
              href="/clientarea/domains"
              className="bg-white border-t-[3px] border-[#2c3e50] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <Globe className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#2c3e50] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Manage Domains</span>
            </Link>

            {/* Support Requests */}
            <Link
              href="/clientarea/tickets"
              className="bg-white border-t-[3px] border-[#2c3e50] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <MessageSquare className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#2c3e50] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Support Requests</span>
            </Link>

            {/* Make a Payment */}
            <Link
              href="/clientarea/invoices"
              className="col-span-2 sm:col-span-1 bg-white border-t-[3px] border-[#2c3e50] border-x border-b border-slate-200 rounded p-4 text-center group hover:bg-slate-50 transition-all shadow-2xs flex flex-col items-center justify-center min-h-[120px]"
            >
              <div className="my-2 transition-transform duration-300 group-hover:scale-110">
                <CreditCard className="w-8 h-8 text-[#c3cfd8] group-hover:text-[#2c3e50] transition-colors" />
              </div>
              <span className="text-xs font-semibold text-slate-700 mt-1">Make a Payment</span>
            </Link>
          </div>
        </section>
      </main>

      <WhmcsFooter />
    </div>
  );
}
