'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  ShieldCheck,
  MessageSquare,
  PhoneCall,
  Globe,
  Settings,
  CheckCircle2,
  ExternalLink,
  Power,
  Zap,
  TrendingUp,
  Key,
  Search,
  Check,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  Tag,
  Briefcase,
  Bell,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function AdminAddonsHubPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const addonModules = [
    {
      id: 'DomainsReseller',
      name: 'Domains Reseller',
      category: 'Domains',
      version: 'v2.3.0',
      status: 'Active',
      description: 'Domain reseller API automation, automated registrations, transfers, renewal hooks, and DNS zone management.',
      icon: Globe,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      href: '/admin/addons/DomainsReseller',
    },
    {
      id: 'RegistrationAlert',
      name: 'Registration Email Alert',
      category: 'Alerts & Email',
      version: 'v2.1',
      status: 'Active',
      description: 'Instant notification dispatch to administrators upon new user registration and account onboarding.',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/admin/addons/RegistrationAlert',
    },
    {
      id: 'SOFTCENTS_SMS',
      name: 'SOFTCENTS SMS',
      category: 'Messaging',
      version: 'v1.7',
      status: 'Active',
      description: 'Masked and non-masked SMS dispatch gateway for OTP verification, invoice alerts, overdue reminders, and server provisioning.',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/addons/SOFTCENTS_SMS',
    },
    {
      id: 'advanced_client_verification',
      name: 'Advanced Client Verification',
      category: 'Identity & KYC',
      version: 'v2.2',
      status: 'Active',
      description: 'Bangladesh Smart NID verification, OCR extraction, Face biometric liveness, and mandatory Trade License KYB.',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/admin/addons/advanced_client_verification',
    },
    {
      id: 'bdhost_wa',
      name: 'Bdhost WhatsApp Pro',
      category: 'Messaging',
      version: 'v8.4',
      status: 'Active',
      description: 'Automated multi-device WhatsApp notification gateway for invoice generation, payment confirmations, and support tickets.',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/admin/addons/bdhost_wa',
    },
    {
      id: 'dynamiccoupon',
      name: 'Dynamic Coupon',
      category: 'Marketing',
      version: 'v1.1',
      status: 'Active',
      description: 'Automated dynamic promo code generator with redemption limits, cycle constraints, and custom promotional banners.',
      icon: Tag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/admin/addons/dynamiccoupon',
    },
    {
      id: 'expiredproducts',
      name: 'Expired Products Manager',
      category: 'Automation',
      version: 'v1.8',
      status: 'Active',
      description: 'Automated post-expiration product lifecycle manager, grace period reminders, and scheduled server termination.',
      icon: Clock,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: '/admin/addons/expiredproducts',
    },
    {
      id: 'forceclientactive',
      name: 'Force Client Active',
      category: 'Client Management',
      version: 'v1.0',
      status: 'Active',
      description: 'Administrative override mechanism ensuring client accounts remain active across automated billing sweeps.',
      icon: CheckCircle2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/admin/addons/forceclientactive',
    },
    {
      id: 'italk_balance',
      name: 'iTalk Balance',
      category: 'Telephony & PBX',
      version: 'v3.0',
      status: 'Active',
      description: 'Real-time Cloud PBX balance lookup, VoIP balance syncer, and automated low-balance customer notifications.',
      icon: PhoneCall,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/admin/addons/italk_balance',
    },
    {
      id: 'italk_recharge',
      name: 'Multi-Provider Auto Recharge',
      category: 'Telephony & PBX',
      version: 'v6.5',
      status: 'Active',
      description: 'Automated balance top-up switch across upstream SIP carriers with real-time conversion rates.',
      icon: Zap,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      href: '/admin/addons/italk_recharge',
    },
    {
      id: 'price_updater',
      name: 'Price Updater Pro',
      category: 'Billing & Rates',
      version: 'v1.1',
      status: 'Active',
      description: 'Bulk product and addon price modifier supporting percentage-based adjustments and automated USD/BDT exchange rates.',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/admin/addons/price_updater',
    },
    {
      id: 'project_management',
      name: 'Project Management',
      category: 'Operations',
      version: 'v2.3.2',
      status: 'Active',
      description: 'Complete task management, staff assignment, time tracking, billable hour logging (৳100/hr), and client portal dashboard.',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/admin/addons/project_management',
    },
    {
      id: 'scrolling_notice',
      name: 'Scrolling Notice Manager',
      category: 'Client Area',
      version: 'v2.1',
      status: 'Active',
      description: 'Scrolling announcement ticker and marquee banner configured for client portal headers.',
      icon: Layers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/admin/addons/scrolling_notice',
    },
    {
      id: 'suiten_genrenew',
      name: 'Service Renewal',
      category: 'Billing & Rates',
      version: 'v1.4',
      status: 'Active',
      description: 'Advance renewal invoice generator allowing clients to renew active hosting and PBX subscriptions before due dates.',
      icon: RefreshCw,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      href: '/admin/addons/suiten_genrenew',
    },
    {
      id: 'tld_price_updater',
      name: 'Domain & TLD Price Updater',
      category: 'Domains',
      version: 'v1.0',
      status: 'Active',
      description: 'Automated registrar cost sync for .com, .net, .org, and .bd TLDs with configurable profit margins.',
      icon: Globe,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/admin/addons/tld_price_updater',
    },
    {
      id: 'unblockip',
      name: 'ip Unblocker',
      category: 'Security & Network',
      version: 'v1.1',
      status: 'Active',
      description: 'Server-side ConfigServer Security & Firewall (CSF) and cPanel IP address unban tool accessible by admins and clients.',
      icon: Lock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/admin/addons/unblockip',
    },
    {
      id: 'whois',
      name: 'WHOIS for clientarea',
      category: 'Domains',
      version: 'v1.0',
      status: 'Active',
      description: 'Integrated domain WHOIS lookup tool embedded into the client area for immediate domain availability and ownership checks.',
      icon: Search,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      href: '/admin/addons/whois',
    },
  ];

  const categories = ['ALL', 'Messaging', 'Domains', 'Telephony & PBX', 'Billing & Rates', 'Identity & KYC', 'Client Management', 'Operations'];

  const filteredAddons = addonModules.filter((addon) => {
    const matchesSearch =
      addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      addon.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'ALL' ||
      addon.category.toLowerCase().includes(filterCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="font-sans text-[#333] space-y-4">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ddd] gap-2">
        <div>
          <div className="text-[11px] text-[#666] flex items-center space-x-1">
            <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">Addons</span>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">Addon Modules Hub</span>
          </div>
          <h1 className="text-xl font-normal text-[#333] mt-1">
            Addon Modules Management ({addonModules.length})
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/settings"
            className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Addons</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#ddd] rounded shadow-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-[#555] mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                filterCategory === cat
                  ? 'bg-[#1A4D80] text-white'
                  : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search Addon Module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] placeholder-[#999] focus:outline-none focus:border-[#1A4D80]"
          />
        </div>
      </div>

      {/* Addon Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredAddons.map((addon) => {
          const IconComponent = addon.icon;
          return (
            <div
              key={addon.id}
              className="bg-white border border-[#ddd] rounded shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg ${addon.bgColor} ${addon.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#333] hover:text-[#1A4D80]">
                        <Link href={addon.href}>{addon.name}</Link>
                      </h3>
                      <span className="text-[10px] text-[#777] font-mono">{addon.id}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#5cb85c] text-white">
                    {addon.status}
                  </span>
                </div>

                <p className="text-xs text-[#666] line-clamp-3 mb-3 leading-relaxed">
                  {addon.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#888] pt-2 border-t border-[#eee]">
                  <span>Category: <strong className="text-[#555]">{addon.category}</strong></span>
                  <span className="font-mono bg-[#f5f5f5] px-1.5 py-0.5 rounded border border-[#e0e0e0]">{addon.version}</span>
                </div>
              </div>

              <div className="bg-[#f9fafb] border-t border-[#eee] px-4 py-2 flex items-center justify-between text-xs">
                <span className="text-[#666] text-[11px] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5cb85c]" />
                  <span>Licensed</span>
                </span>

                <Link
                  href={addon.href}
                  className="bg-[#1A4D80] hover:bg-[#163f68] text-white font-semibold px-3 py-1 rounded text-xs transition-colors flex items-center space-x-1"
                >
                  <span>Launch Module</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
