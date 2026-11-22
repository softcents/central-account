'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ChevronDown,
  User,
  ShieldCheck,
  CreditCard,
  LogOut,
  HelpCircle,
  Box,
  Globe,
  Settings,
  PlusCircle,
  FileText,
  Menu,
  X,
  Search,
  Phone,
  Share2,
  Mail,
  RefreshCw,
  Layers,
  Activity,
  Download,
  Bell,
  Lock,
  UserPlus,
} from 'lucide-react';
import { useActiveClient } from '@/hooks/useActiveClient';

export function ClientHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { clientId, client, impQuery } = useActiveClient();

  const [dropdown, setDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileDomainsOpen, setMobileDomainsOpen] = useState(false);
  const [mobileBillingOpen, setMobileBillingOpen] = useState(false);
  const [mobileSupportOpen, setMobileSupportOpen] = useState(false);
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  const [kbSearch, setKbSearch] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    const imp = localStorage.getItem('ci_impersonator_backup');
    setIsLoggedIn(Boolean(token || user || imp));
  }, []);

  const isClientArea = pathname.startsWith('/clientarea');

  const userName = client?.name || 'Softcents Customer';
  const companyName = client?.company || client?.companyname || 'SoftCents Systems Ltd.';
  const avatarLetter = (userName[0] || 'S').toUpperCase();

  const toggle = (name: string) => {
    setDropdown(dropdown === name ? null : name);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdown(null);
  }, [pathname]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('ci_impersonator_backup');
    } catch {}
    window.location.href = '/login';
  };

  const handleKbSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbSearch.trim()) return;
    router.push(`/knowledgebase?search=${encodeURIComponent(kbSearch.trim())}`);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* TOP BRAND & TOOLBAR BAR */}
      <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-4">
          <Link href={isClientArea ? `/clientarea${impQuery}` : '/'} className="flex items-center shrink-0">
            <img
              src="/whmcs/logo.png"
              alt="SoftCents Systems"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Center: Knowledgebase Search Form (Desktop) */}
        {!isClientArea && (
          <form onSubmit={handleKbSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                placeholder="Search our knowledgebase..."
                className="w-full bg-[#f8f9fa] border border-slate-300 rounded px-3 py-1.5 pl-9 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0d6efd] focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </form>
        )}

        {/* Right Header items: Cart & Account */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Cart button */}
          <Link
            href={`/cart${impQuery}`}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 relative"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#0d6efd] rounded-full"></span>
          </Link>

          {/* User Profile dropdown when in Client Area */}
          {isClientArea ? (
            <div className="relative">
              <button
                onClick={() => toggle('user')}
                className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-100 text-slate-700 font-semibold"
              >
                <div className="w-7 h-7 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {avatarLetter}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{userName}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 hidden sm:inline" />
              </button>
              {dropdown === 'user' && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="font-bold text-slate-900 truncate">{userName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{companyName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Client #{clientId}</div>
                  </div>
                  <Link
                    href={`/clientarea/profile${impQuery}`}
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    Account Details
                  </Link>
                  <Link
                    href={`/clientarea/contacts${impQuery}`}
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    Contacts / Sub-Accounts
                  </Link>
                  <Link
                    href={`/clientarea/emails${impQuery}`}
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <Mail className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    Email History
                  </Link>
                  <Link
                    href={`/clientarea/security${impQuery}`}
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    Security Settings
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-3 py-2 hover:bg-rose-50 text-rose-600"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Quick Account Link on Top Bar for Public */
            <div className="hidden sm:flex items-center space-x-2">
              {isLoggedIn ? (
                <Link
                  href={`/clientarea${impQuery}`}
                  className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors"
                >
                  Client Portal
                </Link>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Link
                    href="/login"
                    className="text-slate-700 hover:text-[#0d6efd] font-semibold px-2 py-1 transition-colors"
                  >
                    Login
                  </Link>
                  <span className="text-slate-300">|</span>
                  <Link
                    href="/register"
                    className="text-slate-700 hover:text-[#0d6efd] font-semibold px-2 py-1 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-[#1A4D80] hover:bg-slate-100 rounded md:hidden transition-colors"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>
        </div>
      </div>

      {/* BOTTOM MAIN NAVBAR (Twenty-One Desktop) */}
      <div className="hidden md:block bg-white border-t border-slate-100">
        <div className="max-w-[1240px] mx-auto px-4 flex items-center justify-between">
          {/* Left: Main Menu Links */}
          <nav className="flex items-center space-x-1 text-[13px] font-semibold text-slate-700 py-1">
            {isClientArea ? (
              /* CLIENT AREA MODE NAVBAR */
              <>
                <Link
                  href={`/clientarea${impQuery}`}
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname === '/clientarea'
                      ? 'text-[#1A4D80] bg-slate-50 font-bold'
                      : 'hover:text-[#1A4D80]'
                  }`}
                >
                  Home
                </Link>

                {/* Services Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggle('services')}
                    className={`px-3 py-2 rounded flex items-center space-x-1 transition-colors ${
                      pathname.startsWith('/clientarea/services')
                        ? 'text-[#1A4D80] bg-slate-50 font-bold'
                        : 'hover:text-[#1A4D80]'
                    }`}
                  >
                    <span>Services</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  {dropdown === 'services' && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                      <Link
                        href={`/clientarea/services${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                      >
                        <Box className="w-4 h-4 mr-2 text-[#007bff]" />
                        My Services
                      </Link>
                      <Link
                        href={`/cart${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-emerald-700 font-semibold"
                      >
                        <PlusCircle className="w-4 h-4 mr-2 text-emerald-600" />
                        Order New Services
                      </Link>
                      <Link
                        href={`/cart?gid=addons${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                        View Available Addons
                      </Link>
                    </div>
                  )}
                </div>

                {/* Domains Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggle('domains')}
                    className={`px-3 py-2 rounded flex items-center space-x-1 transition-colors ${
                      pathname.startsWith('/clientarea/domains')
                        ? 'text-[#1A4D80] bg-slate-50 font-bold'
                        : 'hover:text-[#1A4D80]'
                    }`}
                  >
                    <span>Domains</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  {dropdown === 'domains' && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                      <Link
                        href={`/clientarea/domains${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                      >
                        <Globe className="w-4 h-4 mr-2 text-[#28a745]" />
                        My Domains
                      </Link>
                      <Link
                        href={`/cart?a=renew${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2 text-teal-600" />
                        Renew Domains
                      </Link>
                      <Link
                        href={`/cart?a=add&domain=register${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <PlusCircle className="w-4 h-4 mr-2 text-emerald-600" />
                        Register a New Domain
                      </Link>
                      <Link
                        href={`/cart?a=add&domain=transfer${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Share2 className="w-4 h-4 mr-2 text-cyan-600" />
                        Transfer Domains to Us
                      </Link>
                      <Link
                        href={`/domainchecker${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Search className="w-4 h-4 mr-2 text-slate-400" />
                        WHOIS / Domain Search
                      </Link>
                    </div>
                  )}
                </div>

                {/* Billing Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggle('billing')}
                    className={`px-3 py-2 rounded flex items-center space-x-1 transition-colors ${
                      pathname.startsWith('/clientarea/invoices') || pathname.startsWith('/clientarea/quotes') || pathname.startsWith('/clientarea/addfunds')
                        ? 'text-[#1A4D80] bg-slate-50 font-bold'
                        : 'hover:text-[#1A4D80]'
                    }`}
                  >
                    <span>Billing</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  {dropdown === 'billing' && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                      <Link
                        href={`/clientarea/invoices${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                      >
                        <CreditCard className="w-4 h-4 mr-2 text-[#f39c12]" />
                        My Invoices
                      </Link>
                      <Link
                        href={`/clientarea/quotes${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                      >
                        <FileText className="w-4 h-4 mr-2 text-[#1A4D80]" />
                        My Quotes
                      </Link>
                      <Link
                        href={`/clientarea/masspay${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                        Mass Payment
                      </Link>
                      <Link
                        href={`/clientarea/addfunds${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-emerald-700 font-semibold"
                      >
                        <PlusCircle className="w-4 h-4 mr-2 text-emerald-600" />
                        Add Funds
                      </Link>
                    </div>
                  )}
                </div>

                {/* Support Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggle('support')}
                    className={`px-3 py-2 rounded flex items-center space-x-1 transition-colors ${
                      pathname.startsWith('/clientarea/tickets') || pathname.startsWith('/support') || pathname.startsWith('/announcements') || pathname.startsWith('/knowledgebase') || pathname.startsWith('/downloads') || pathname.startsWith('/networkissues')
                        ? 'text-[#1A4D80] bg-slate-50 font-bold'
                        : 'hover:text-[#1A4D80]'
                    }`}
                  >
                    <span>Support</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  {dropdown === 'support' && (
                    <div className="absolute left-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                      <Link
                        href={`/clientarea/tickets${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                      >
                        <HelpCircle className="w-4 h-4 mr-2 text-[#d9534f]" />
                        Support Tickets
                      </Link>
                      <Link
                        href={`/support/new${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        <PlusCircle className="w-4 h-4 mr-2 text-blue-600" />
                        Open New Ticket
                      </Link>
                      <Link
                        href={`/announcements${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Bell className="w-4 h-4 mr-2 text-amber-500" />
                        Announcements
                      </Link>
                      <Link
                        href={`/knowledgebase${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                        Knowledgebase
                      </Link>
                      <Link
                        href={`/downloads${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Download className="w-4 h-4 mr-2 text-emerald-500" />
                        Downloads
                      </Link>
                      <Link
                        href={`/networkissues${impQuery}`}
                        onClick={() => setDropdown(null)}
                        className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                      >
                        <Activity className="w-4 h-4 mr-2 text-rose-500" />
                        Network Status
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* PUBLIC STORE & PORTAL MODE NAVBAR (Exact WHMCS Twenty-One) */
              <>
                <Link
                  href="/"
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname === '/'
                      ? 'text-[#0d6efd] bg-slate-50 font-bold'
                      : 'hover:text-[#0d6efd]'
                  }`}
                >
                  Home
                </Link>

                {/* Store Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggle('store')}
                    className={`px-3 py-2 rounded flex items-center space-x-1 transition-colors ${
                      pathname.startsWith('/cart')
                        ? 'text-[#0d6efd] bg-slate-50 font-bold'
                        : 'hover:text-[#0d6efd]'
                    }`}
                  >
                    <span>Store</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>
                  {dropdown === 'store' && (
                    <div className="absolute left-0 top-full mt-1 w-72 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50 max-h-[480px] overflow-y-auto">
                      <Link
                        href="/cart"
                        onClick={() => setDropdown(null)}
                        className="block px-3.5 py-2 font-bold text-slate-900 hover:bg-slate-50 border-b border-slate-100"
                      >
                        Browse All
                      </Link>
                      <div className="py-1">
                        <Link href="/cart?gid=2" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Cloud PBX</Link>
                        <Link href="/cart?gid=15" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Bulk SMS- (Your IP Number To SMS)</Link>
                        <Link href="/cart?gid=3" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">USA Advance Linux Shared Hosting</Link>
                        <Link href="/cart?gid=6" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">BDIX Advance Linux Shared Hosting</Link>
                        <Link href="/cart?gid=5" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">IP Phone Number</Link>
                        <Link href="/cart?gid=7" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Singapore Advance Linux Shared Hosting</Link>
                        <Link href="/cart?gid=8" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Indian Advance Linux Shared Hosting</Link>
                        <Link href="/cart?gid=9" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">VPS SERVER (USA)</Link>
                        <Link href="/cart?gid=10" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">VPS SERVER (UK)</Link>
                        <Link href="/cart?gid=11" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">VPS SERVER (DE)</Link>
                        <Link href="/cart?gid=12" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">VPS SERVER (FR)</Link>
                        <Link href="/cart?gid=13" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">VPS SERVER (BD)</Link>
                        <Link href="/cart?gid=14" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Dedicated Server (BD)</Link>
                        <Link href="/cart?gid=16" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">IP Phone Namber (VIP)</Link>
                        <Link href="/cart?gid=17" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Voice SMS TOOL (Your IP To Voice)</Link>
                        <Link href="/cart?gid=18" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Location-Based SMS (Tower Targeting)</Link>
                        <Link href="/cart?gid=19" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Masking SMS</Link>
                        <Link href="/cart?gid=20" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Voice SMS</Link>
                        <Link href="/cart?gid=21" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Dedicated IP pbx</Link>
                        <Link href="/cart?gid=22" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">BDPBX</Link>
                        <Link href="/cart?gid=23" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-slate-700">Advance Cloud PBX</Link>
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <Link href="/cart?a=add&domain=register" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-[#0d6efd] font-semibold">
                          Register a New Domain
                        </Link>
                        <Link href="/cart?a=add&domain=transfer" onClick={() => setDropdown(null)} className="block px-3.5 py-1.5 hover:bg-slate-50 text-[#198754] font-semibold">
                          Transfer Domains to Us
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/announcements"
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname.startsWith('/announcements')
                      ? 'text-[#0d6efd] bg-slate-50 font-bold'
                      : 'hover:text-[#0d6efd]'
                  }`}
                >
                  Announcements
                </Link>

                <Link
                  href="/knowledgebase"
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname.startsWith('/knowledgebase')
                      ? 'text-[#0d6efd] bg-slate-50 font-bold'
                      : 'hover:text-[#0d6efd]'
                  }`}
                >
                  Knowledgebase
                </Link>

                <Link
                  href="/networkissues"
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname.startsWith('/networkissues')
                      ? 'text-[#0d6efd] bg-slate-50 font-bold'
                      : 'hover:text-[#0d6efd]'
                  }`}
                >
                  Network Status
                </Link>

                <Link
                  href="/clientarea/affiliates"
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname.startsWith('/clientarea/affiliates')
                      ? 'text-[#0d6efd] bg-slate-50 font-bold'
                      : 'hover:text-[#0d6efd]'
                  }`}
                >
                  Affiliates
                </Link>

                <Link
                  href="/contact"
                  className={`px-3 py-2 rounded transition-colors ${
                    pathname.startsWith('/contact')
                      ? 'text-[#0d6efd] bg-slate-50 font-bold'
                      : 'hover:text-[#0d6efd]'
                  }`}
                >
                  Contact Us
                </Link>
              </>
            )}
          </nav>

          {/* Right: Account Dropdown (Twenty-One Secondary Navbar) */}
          <div className="relative">
            <button
              onClick={() => toggle('account_menu')}
              className="px-3 py-2 rounded flex items-center space-x-1 transition-colors text-[13px] font-semibold text-slate-700 hover:text-[#0d6efd]"
            >
              <span>Account</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {dropdown === 'account_menu' && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                {isLoggedIn ? (
                  <>
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                      <div className="font-bold text-slate-900 truncate">{userName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{companyName}</div>
                    </div>
                    <Link
                      href={`/clientarea${impQuery}`}
                      onClick={() => setDropdown(null)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      Your Account
                    </Link>
                    <Link
                      href={`/clientarea/services${impQuery}`}
                      onClick={() => setDropdown(null)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-700"
                    >
                      Manage Services
                    </Link>
                    <Link
                      href={`/clientarea/domains${impQuery}`}
                      onClick={() => setDropdown(null)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-700"
                    >
                      Manage Domains
                    </Link>
                    <Link
                      href={`/clientarea/invoices${impQuery}`}
                      onClick={() => setDropdown(null)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-700"
                    >
                      Invoices
                    </Link>
                    <Link
                      href={`/clientarea/tickets${impQuery}`}
                      onClick={() => setDropdown(null)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-700"
                    >
                      Support Requests
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setDropdown(null)}
                      className="flex items-center px-3.5 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                    >
                      <Lock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setDropdown(null)}
                      className="flex items-center px-3.5 py-2 hover:bg-slate-50 text-slate-800 font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      Register
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <Link
                      href="/pwreset"
                      onClick={() => setDropdown(null)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-600"
                    >
                      Forgot Password?
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN ACCORDION MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl px-4 py-3 space-y-3 max-h-[calc(100vh-64px)] overflow-y-auto">
          {/* Mobile KB Search */}
          <form onSubmit={handleKbSearchSubmit} className="mb-2">
            <div className="relative w-full">
              <input
                type="text"
                value={kbSearch}
                onChange={(e) => setKbSearch(e.target.value)}
                placeholder="Search our knowledgebase..."
                className="w-full bg-[#f8f9fa] border border-slate-300 rounded px-3 py-2 pl-9 text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </form>

          {/* Mobile Navigation List */}
          <div className="space-y-1 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                pathname === '/' ? 'text-[#0d6efd] bg-slate-100 font-bold' : 'hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Store Accordion (Mobile) */}
            <div>
              <button
                onClick={() => setMobileStoreOpen(!mobileStoreOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
              >
                <span className="flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-2.5 text-[#0d6efd]" />
                  Store
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileStoreOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileStoreOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs max-h-60 overflow-y-auto">
                  <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-900 font-bold">Browse All</Link>
                  <Link href="/cart?gid=2" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-600">Cloud PBX</Link>
                  <Link href="/cart?gid=15" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-600">Bulk SMS- (Your IP Number To SMS)</Link>
                  <Link href="/cart?gid=3" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-600">USA Advance Linux Shared Hosting</Link>
                  <Link href="/cart?gid=6" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-600">BDIX Advance Linux Shared Hosting</Link>
                  <Link href="/cart?gid=5" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-600">IP Phone Number</Link>
                  <Link href="/cart?a=add&domain=register" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#0d6efd] font-bold">Register a New Domain</Link>
                  <Link href="/cart?a=add&domain=transfer" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#198754] font-bold">Transfer Domains to Us</Link>
                </div>
              )}
            </div>

            <Link href="/announcements" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
              Announcements
            </Link>
            <Link href="/knowledgebase" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
              Knowledgebase
            </Link>
            <Link href="/networkissues" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
              Network Status
            </Link>
            <Link href="/clientarea/affiliates" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
              Affiliates
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-slate-50">
              Contact Us
            </Link>

            {/* Mobile Account Section */}
            <div className="border-t border-slate-100 pt-3 mt-3">
              {isLoggedIn ? (
                <div className="space-y-1 text-xs">
                  <div className="px-3 py-1 font-bold text-slate-900">{userName}</div>
                  <Link href={`/clientarea${impQuery}`} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded hover:bg-slate-50 text-slate-700">
                    Your Account
                  </Link>
                  <Link href={`/clientarea/services${impQuery}`} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded hover:bg-slate-50 text-slate-700">
                    Manage Services
                  </Link>
                  <Link href={`/clientarea/domains${impQuery}`} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded hover:bg-slate-50 text-slate-700">
                    Manage Domains
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-1.5 rounded hover:bg-rose-50 text-rose-600 font-semibold">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg bg-[#0d6efd] text-white font-bold text-center">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-center mt-2">
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
