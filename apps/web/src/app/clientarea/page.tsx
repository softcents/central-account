'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  Box,
  Globe,
  MessageSquare,
  CreditCard,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  ShoppingBag,
  ArrowRight,
  Server,
  CheckCircle2,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

function ClientAreaHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [domainSearch, setDomainSearch] = useState('');

  // Handle WHMCS legacy query parameters like ?action=services, ?action=invoices, etc.
  const action = searchParams.get('action');
  const impersonateParam = searchParams.get('impersonate') || searchParams.get('userid');

  const impQuery = impersonateParam ? `?impersonate=${encodeURIComponent(impersonateParam)}` : '';

  useEffect(() => {
    if (!action) return;
    if (action === 'services' || action === 'products') {
      router.replace(`/clientarea/services${impQuery}`);
    } else if (action === 'domains') {
      router.replace(`/clientarea/domains${impQuery}`);
    } else if (action === 'invoices') {
      router.replace(`/clientarea/invoices${impQuery}`);
    } else if (action === 'tickets' || action === 'support') {
      router.replace(`/clientarea/tickets${impQuery}`);
    } else if (action === 'addfunds') {
      router.replace(`/clientarea/addfunds${impQuery}`);
    } else if (action === 'security') {
      router.replace(`/clientarea/security${impQuery}`);
    } else if (action === 'profile' || action === 'details') {
      router.replace(`/clientarea/profile${impQuery}`);
    } else if (action === 'affiliates') {
      router.replace(`/clientarea/affiliates${impQuery}`);
    }
  }, [action, impQuery, router]);

  // Determine active client identity
  const [clientInfo, setClientInfo] = useState<{
    id: string | null;
    name: string;
    company: string;
  }>({
    id: impersonateParam || null,
    name: 'Customer',
    company: 'SoftCents Systems Ltd.',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetId = impersonateParam;
    if (!targetId) {
      const storedImp = localStorage.getItem('ci_impersonator_backup');
      if (storedImp) {
        try {
          const parsed = JSON.parse(storedImp);
          targetId = parsed.targetUser?.whmcsId || parsed.targetUser?.id;
        } catch {}
      }
    }

    if (targetId) {
      const matched = (whmcsData?.clients || []).find(
        (c: any) => String(c.id) === String(targetId) || String(c.whmcsId) === String(targetId)
      );
      if (matched) {
        setClientInfo({
          id: String(matched.id),
          name: matched.name || `${matched.firstname || ''} ${matched.lastname || ''}`.trim() || 'Customer',
          company: matched.company || matched.companyname || 'Softcents Telecom Ltd',
        });
        return;
      }
    }

    // Check auth user from local storage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const name = u.profile?.first_name
          ? `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
          : (u.name || u.email);

        // Check if user email matches any WHMCS client
        const matched = (whmcsData?.clients || []).find(
          (c: any) => c.email && u.email && c.email.toLowerCase() === u.email.toLowerCase()
        );

        setClientInfo({
          id: matched ? String(matched.id) : u.id || null,
          name: name || matched?.name || 'Customer',
          company: matched?.company || matched?.companyname || u.customerRegistration?.company_name || 'SoftCents Systems Ltd.',
        });
        return;
      } catch {}
    }

    // Default primary customer view
    const defaultClient = (whmcsData?.clients || []).find((c: any) => String(c.id) === '177') || (whmcsData?.clients || [])[0];
    if (defaultClient) {
      setClientInfo({
        id: String(defaultClient.id),
        name: defaultClient.name || `${defaultClient.firstname || ''} ${defaultClient.lastname || ''}`.trim(),
        company: defaultClient.company || defaultClient.companyname || 'Softcents Telecom Ltd',
      });
    }
  }, [impersonateParam]);

  // Compute active services
  const allServices = (whmcsData?.services || []) as any[];
  let clientServices = allServices;
  if (clientInfo.id) {
    const matched = allServices.filter((s: any) => String(s.userid) === String(clientInfo.id));
    if (matched.length > 0) {
      clientServices = matched;
    }
  }

  const activeServices = clientServices.filter(
    (s: any) => (s.domainstatus || '').toLowerCase() === 'active'
  );
  const displayServices = activeServices.length > 0 ? activeServices.slice(0, 10) : clientServices.slice(0, 10);

  // Compute domains
  const allDomains = (whmcsData?.domains || []) as any[];
  let clientDomains = allDomains;
  if (clientInfo.id) {
    const matched = allDomains.filter((d: any) => String(d.userid) === String(clientInfo.id));
    if (matched.length > 0) {
      clientDomains = matched;
    }
  }

  // Compute tickets
  const allTickets = (whmcsData?.tickets || []) as any[];
  let clientTickets = allTickets;
  if (clientInfo.id) {
    const matched = allTickets.filter((t: any) => String(t.userid) === String(clientInfo.id));
    if (matched.length > 0) {
      clientTickets = matched;
    }
  }
  const openTicketsCount = clientTickets.filter(
    (t: any) => (t.status || '').toLowerCase() !== 'closed'
  ).length;

  // Compute invoices
  const allInvoices = (whmcsData?.invoices || []) as any[];
  let clientInvoices = allInvoices;
  if (clientInfo.id) {
    const matched = allInvoices.filter((i: any) => String(i.userid) === String(clientInfo.id));
    if (matched.length > 0) {
      clientInvoices = matched;
    }
  }
  const unpaidInvoices = clientInvoices.filter(
    (inv: any) => (inv.status || '').toLowerCase() === 'unpaid'
  );

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainSearch.trim()) return;
    router.push(`/domainchecker?domain=${encodeURIComponent(domainSearch.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1240px] mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome Back, {clientInfo.name}!
            </h1>
            <p className="text-xs text-slate-500">
              {clientInfo.company} &bull; Client Portal &amp; Management Console
            </p>
          </div>
          <div className="text-xs font-semibold">
            <Link
              href="/cart"
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded shadow-sm inline-block transition-colors"
            >
              + Order New Services
            </Link>
          </div>
        </div>

        {/* 4 WHMCS Twenty-One Tiles (Services, Domains, Tickets, Invoices) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Services Tile */}
          <Link
            href={`/clientarea/services${impQuery}`}
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <Box className="w-7 h-7 text-[#007bff]" />
              <div className="text-2xl font-bold text-slate-900">
                {activeServices.length > 0 ? activeServices.length : clientServices.length}
              </div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Services
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#007bff]"></div>
          </Link>

          {/* Domains Tile */}
          <Link
            href={`/clientarea/domains${impQuery}`}
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-7 h-7 text-[#28a745]" />
              <div className="text-2xl font-bold text-slate-900">{clientDomains.length}</div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Domains
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#28a745]"></div>
          </Link>

          {/* Tickets Tile */}
          <Link
            href={`/clientarea/tickets${impQuery}`}
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-7 h-7 text-[#dc3545]" />
              <div className="text-2xl font-bold text-slate-900">{openTicketsCount}</div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Tickets
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#dc3545]"></div>
          </Link>

          {/* Invoices Tile */}
          <Link
            href={`/clientarea/invoices${impQuery}`}
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-7 h-7 text-[#f0ad4e]" />
              <div className="text-2xl font-bold text-slate-900">{unpaidInvoices.length}</div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Unpaid Invoices
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f0ad4e]"></div>
          </Link>
        </div>

        {/* Unpaid Invoice Alert Banner */}
        {unpaidInvoices.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-amber-900">
                  You have {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''} (Invoice #{unpaidInvoices[0].id} due on {unpaidInvoices[0].duedate || '-'}).
                </span>
                <span className="text-amber-800 ml-1">
                  Pay now to avoid service disruption or automatic suspension.
                </span>
              </div>
            </div>
            <Link
              href={`/viewinvoice.php?id=${unpaidInvoices[0].id}`}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1.5 rounded font-bold transition-colors inline-block"
            >
              Pay Now (৳{parseFloat(unpaidInvoices[0].total || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT) &rarr;
            </Link>
          </div>
        )}

        {/* Domain Search Banner */}
        <div className="bg-[#1A4D80] text-white p-6 rounded-lg shadow-sm">
          <h2 className="text-base font-bold mb-1">Find your new domain name</h2>
          <p className="text-xs text-white/80 mb-3">
            Register .com, .net, .org, or .com.bd domains with instant DNS provisioning
          </p>
          <form onSubmit={handleDomainSubmit} className="flex max-w-xl bg-white rounded overflow-hidden p-1">
            <input
              type="text"
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              placeholder="Enter your desired domain name..."
              className="flex-1 px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2 rounded text-xs font-bold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Active Products & Services */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Box className="w-4 h-4 text-[#007bff]" />
              <span>Your Active Products/Services ({displayServices.length})</span>
            </span>
            <Link
              href={`/clientarea/services${impQuery}`}
              className="text-[#1A4D80] hover:underline font-semibold"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-4">Product / Service</th>
                  <th className="py-2.5 px-4">Domain / Server</th>
                  <th className="py-2.5 px-4">Pricing</th>
                  <th className="py-2.5 px-4">Next Due Date</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayServices.length > 0 ? (
                  displayServices.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        <div>{s.package || s.product_name}</div>
                        {s.group_name && (
                          <div className="text-[11px] font-normal text-slate-500">
                            {s.group_name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {s.domain ? (
                          <span className="text-[#1A4D80] font-medium">{s.domain}</span>
                        ) : s.server_name ? (
                          <span className="text-slate-600 font-mono text-[11px]">{s.server_name}</span>
                        ) : s.username ? (
                          <span className="text-slate-600 text-[11px]">User: {s.username}</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {s.billingcycle === 'Free Account' || parseFloat(s.amount || '0') === 0
                          ? 'Free'
                          : `৳${parseFloat(s.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} BDT ${s.billingcycle || ''}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {s.nextduedate_display || (s.nextduedate && s.nextduedate !== '0000-00-00' ? s.nextduedate : '-')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            (s.domainstatus || '').toLowerCase() === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (s.domainstatus || '').toLowerCase() === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.domainstatus || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/clientarea/services?search=${encodeURIComponent(s.domain || s.product_name || s.id)}${impersonateParam ? `&impersonate=${encodeURIComponent(impersonateParam)}` : ''}`}
                          className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded text-[11px] font-semibold transition-colors inline-block"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <Box className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No active products or services found.</p>
                      <p className="text-xs text-slate-400 mt-1">Order your first cloud VPS, web hosting, or VoIP service today.</p>
                      <Link
                        href="/cart"
                        className="mt-3 inline-block bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1.5 rounded text-xs font-bold transition-colors"
                      >
                        + Order New Service
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ClientAreaHome() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-slate-400 text-xs">Loading Client Portal...</div>}>
      <ClientAreaHomeContent />
    </Suspense>
  );
}
