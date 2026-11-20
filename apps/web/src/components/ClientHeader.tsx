'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useActiveClient } from '@/hooks/useActiveClient';

export function ClientHeader() {
  const pathname = usePathname();
  const { clientId, client, impQuery } = useActiveClient();

  const [dropdown, setDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileDomainsOpen, setMobileDomainsOpen] = useState(false);
  const [mobileBillingOpen, setMobileBillingOpen] = useState(false);
  const [mobileSupportOpen, setMobileSupportOpen] = useState(false);

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

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo & Nav items */}
        <div className="flex items-center space-x-6">
          <Link href={`/clientarea${impQuery}`} className="flex items-center shrink-0">
            <img
              src="/whmcs/logo.png"
              alt="SoftCents Systems"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>

          {/* Twenty-One Desktop Main Menu */}
          <nav className="hidden md:flex items-center space-x-1 text-[13px] font-semibold text-slate-700">
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
          </nav>
        </div>

        {/* Right Header items */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Cart button */}
          <Link
            href={`/cart${impQuery}`}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 relative"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </Link>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => toggle('user')}
              className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-100 text-slate-700 font-semibold"
            >
              <div className="w-7 h-7 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
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
                <Link
                  href={`/identity${impQuery}`}
                  onClick={() => setDropdown(null)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 font-bold text-[#1A4D80]"
                >
                  <span className="flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                    Identity Verify (KYC)
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono">
                    Verified
                  </span>
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

      {/* Mobile Slide-down Accordion Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-xl px-4 py-3 space-y-3 max-h-[calc(100vh-64px)] overflow-y-auto">
          {/* Mobile Navigation List */}
          <div className="space-y-1 text-sm font-semibold text-slate-700">
            {/* Home */}
            <Link
              href={`/clientarea${impQuery}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                pathname === '/clientarea'
                  ? 'text-[#1A4D80] bg-slate-100 font-bold'
                  : 'hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Services Accordion */}
            <div>
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
              >
                <span className="flex items-center">
                  <Box className="w-4 h-4 mr-2.5 text-[#007bff]" />
                  Services
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileServicesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileServicesOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <Link
                    href={`/clientarea/services${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    My Products &amp; Services
                  </Link>
                  <Link
                    href={`/cart${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-emerald-700 font-semibold hover:text-emerald-800"
                  >
                    + Order New Services
                  </Link>
                  <Link
                    href={`/cart?gid=addons${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    View Available Addons
                  </Link>
                </div>
              )}
            </div>

            {/* Domains Accordion */}
            <div>
              <button
                onClick={() => setMobileDomainsOpen(!mobileDomainsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
              >
                <span className="flex items-center">
                  <Globe className="w-4 h-4 mr-2.5 text-[#28a745]" />
                  Domains
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileDomainsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileDomainsOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <Link
                    href={`/clientarea/domains${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    My Domains
                  </Link>
                  <Link
                    href={`/cart?a=renew${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Renew Domains
                  </Link>
                  <Link
                    href={`/cart?a=add&domain=register${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    + Register New Domain
                  </Link>
                  <Link
                    href={`/cart?a=add&domain=transfer${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Transfer Domains to Us
                  </Link>
                  <Link
                    href={`/domainchecker${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Domain Search
                  </Link>
                </div>
              )}
            </div>

            {/* Billing Accordion */}
            <div>
              <button
                onClick={() => setMobileBillingOpen(!mobileBillingOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
              >
                <span className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2.5 text-[#f39c12]" />
                  Billing
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileBillingOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileBillingOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <Link
                    href={`/clientarea/invoices${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    My Invoices
                  </Link>
                  <Link
                    href={`/clientarea/quotes${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    My Quotes
                  </Link>
                  <Link
                    href={`/clientarea/masspay${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Mass Payment
                  </Link>
                  <Link
                    href={`/clientarea/addfunds${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-emerald-700 font-semibold hover:text-emerald-800"
                  >
                    + Add Funds Deposit
                  </Link>
                </div>
              )}
            </div>

            {/* Support Accordion */}
            <div>
              <button
                onClick={() => setMobileSupportOpen(!mobileSupportOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
              >
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 mr-2.5 text-[#d9534f]" />
                  Support
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileSupportOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {mobileSupportOpen && (
                <div className="pl-9 pr-2 py-1 space-y-1 text-xs">
                  <Link
                    href={`/clientarea/tickets${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Support Tickets
                  </Link>
                  <Link
                    href={`/support/new${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    + Open New Ticket
                  </Link>
                  <Link
                    href={`/announcements${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Announcements
                  </Link>
                  <Link
                    href={`/knowledgebase${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Knowledgebase
                  </Link>
                  <Link
                    href={`/downloads${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Downloads
                  </Link>
                  <Link
                    href={`/networkissues${impQuery}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1.5 text-slate-700 hover:text-[#1A4D80]"
                  >
                    Network Status
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile User Profile Section */}
            <div className="border-t border-slate-100 pt-3 mt-3">
              <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg mb-2">
                <div className="w-8 h-8 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {avatarLetter}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-900 truncate text-xs">{userName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{companyName}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <Link
                  href={`/clientarea/profile${impQuery}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Account Details
                </Link>
                <Link
                  href={`/clientarea/contacts${impQuery}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Contacts / Sub-Accounts
                </Link>
                <Link
                  href={`/clientarea/emails${impQuery}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <Mail className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Email History
                </Link>
                <Link
                  href={`/clientarea/security${impQuery}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Security Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
