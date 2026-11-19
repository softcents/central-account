'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export function ClientHeader() {
  const pathname = usePathname();
  const [dropdown, setDropdown] = useState<string | null>(null);

  const toggle = (name: string) => {
    setDropdown(dropdown === name ? null : name);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo & Nav items */}
        <div className="flex items-center space-x-6">
          <Link href="/clientarea" className="flex items-center">
            <img
              src="/whmcs/logo.png"
              alt="SoftCents Systems"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Twenty-One Main Menu */}
          <nav className="hidden md:flex items-center space-x-1 text-[13px] font-semibold text-slate-700">
            <Link
              href="/clientarea"
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
                <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                  <Link
                    href="/clientarea/services"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800"
                  >
                    <Box className="w-4 h-4 mr-2 text-[#007bff]" />
                    My Services
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-emerald-700 font-semibold"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Order New Services
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
                <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                  <Link
                    href="/clientarea/domains"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800"
                  >
                    <Globe className="w-4 h-4 mr-2 text-[#28a745]" />
                    My Domains
                  </Link>
                  <Link
                    href="/cart?a=add&domain=register"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2 text-slate-400" />
                    Register a New Domain
                  </Link>
                </div>
              )}
            </div>

            {/* Billing Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggle('billing')}
                className={`px-3 py-2 rounded flex items-center space-x-1 transition-colors ${
                  pathname.startsWith('/clientarea/invoices') || pathname.startsWith('/clientarea/addfunds')
                    ? 'text-[#1A4D80] bg-slate-50 font-bold'
                    : 'hover:text-[#1A4D80]'
                }`}
              >
                <span>Billing</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {dropdown === 'billing' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                  <Link
                    href="/clientarea/invoices"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800"
                  >
                    <CreditCard className="w-4 h-4 mr-2 text-[#f39c12]" />
                    My Invoices
                  </Link>
                  <Link
                    href="/clientarea/addfunds"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
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
                  pathname.startsWith('/clientarea/tickets') || pathname.startsWith('/support')
                    ? 'text-[#1A4D80] bg-slate-50 font-bold'
                    : 'hover:text-[#1A4D80]'
                }`}
              >
                <span>Support</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {dropdown === 'support' && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                  <Link
                    href="/clientarea/tickets"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-800"
                  >
                    <HelpCircle className="w-4 h-4 mr-2 text-[#d9534f]" />
                    Support Tickets
                  </Link>
                  <Link
                    href="/support/new"
                    onClick={() => setDropdown(null)}
                    className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2 text-slate-400" />
                    Open New Ticket
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Header items */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Cart button */}
          <Link
            href="/cart"
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
              <div className="w-7 h-7 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-xs">
                R
              </div>
              <span className="hidden sm:inline">Raju Ahmed</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {dropdown === 'user' && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">Raju Ahmed</div>
                  <div className="text-[11px] text-slate-500">SoftCents Systems Ltd.</div>
                </div>
                <Link
                  href="/clientarea/profile"
                  onClick={() => setDropdown(null)}
                  className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Account Details
                </Link>
                <Link
                  href="/clientarea/security"
                  onClick={() => setDropdown(null)}
                  className="flex items-center px-3 py-2 hover:bg-slate-50 text-slate-700"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Security Settings
                </Link>
                <Link
                  href="/identity"
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
                <Link
                  href="/login"
                  onClick={() => setDropdown(null)}
                  className="flex items-center px-3 py-2 hover:bg-rose-50 text-rose-600"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
