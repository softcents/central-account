'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Globe,
  MessageSquare,
  CreditCard,
  Search,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  LogOut,
  ShoppingBag,
} from 'lucide-react';

export default function ClientAreaHome() {
  const [domainSearch, setDomainSearch] = useState('');

  const services = [
    {
      id: 1,
      product: 'Standard Cloud VPS - 2 vCPU, 4GB RAM',
      domain: 'server1.softcents.com',
      pricing: '৳1,500.00 BDT Monthly',
      nextDue: '2026-12-01',
      status: 'Active',
    },
    {
      id: 2,
      product: 'cPanel NVMe Web Hosting - Starter',
      domain: 'mytestsite.com',
      pricing: '৳450.00 BDT Monthly',
      nextDue: '2026-11-28',
      status: 'Active',
    },
  ];

  const unpaidInvoices = [
    {
      id: 464,
      date: '2026-11-19',
      dueDate: '2026-11-26',
      total: '৳1,500.00 BDT',
      status: 'Unpaid',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      {/* WHMCS Twenty-One Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/clientarea" className="flex items-center">
              <img
                src="/whmcs/logo.png"
                alt="SoftCents Systems"
                className="h-8 w-auto object-contain"
              />
            </Link>

            {/* Menu Links */}
            <nav className="hidden md:flex items-center space-x-1 text-[13px] font-semibold text-slate-700">
              <Link href="/clientarea" className="px-3 py-2 text-[#1A4D80] hover:text-[#1A4D80]">
                Home
              </Link>
              <Link href="/clientarea?action=services" className="px-3 py-2 hover:text-[#1A4D80]">
                Services
              </Link>
              <Link href="/clientarea?action=domains" className="px-3 py-2 hover:text-[#1A4D80]">
                Domains
              </Link>
              <Link href="/clientarea?action=invoices" className="px-3 py-2 hover:text-[#1A4D80]">
                Billing
              </Link>
              <Link href="/support" className="px-3 py-2 hover:text-[#1A4D80]">
                Support
              </Link>
            </nav>
          </div>

          {/* Right Header items */}
          <div className="flex items-center space-x-3 text-xs">
            <Link
              href="/cart"
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </Link>

            {/* User Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1.5 p-1.5 rounded hover:bg-slate-100 text-slate-700 font-semibold">
                <div className="w-7 h-7 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-xs">
                  R
                </div>
                <span>Raju Ahmed</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1240px] mx-auto px-4 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome Back, Raju!</h1>
            <p className="text-xs text-slate-500">
              SoftCents Systems Ltd. Client Portal & Management Console
            </p>
          </div>
          <div className="text-xs font-semibold">
            <Link
              href="/cart"
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded shadow-sm inline-block"
            >
              + Order New Services
            </Link>
          </div>
        </div>

        {/* 4 WHMCS Twenty-One Tiles (Services, Domains, Tickets, Invoices) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Services Tile */}
          <Link
            href="/clientarea?action=services"
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <Box className="w-7 h-7 text-[#007bff]" />
              <div className="text-2xl font-bold text-slate-900">2</div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Services
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#007bff]"></div>
          </Link>

          {/* Domains Tile */}
          <Link
            href="/clientarea?action=domains"
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-7 h-7 text-[#28a745]" />
              <div className="text-2xl font-bold text-slate-900">1</div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Domains
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#28a745]"></div>
          </Link>

          {/* Tickets Tile */}
          <Link
            href="/support"
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-7 h-7 text-[#dc3545]" />
              <div className="text-2xl font-bold text-slate-900">0</div>
            </div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Tickets
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#dc3545]"></div>
          </Link>

          {/* Invoices Tile */}
          <Link
            href="/clientarea?action=invoices"
            className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="w-7 h-7 text-[#f0ad4e]" />
              <div className="text-2xl font-bold text-slate-900">1</div>
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
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <span className="font-bold text-amber-900">
                  You have 1 unpaid invoice due on 26/11/2026.
                </span>
                <span className="text-amber-800 ml-1">
                  Pay now to avoid service disruption or automatic suspension.
                </span>
              </div>
            </div>
            <Link
              href="/viewinvoice.php?id=464"
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1.5 rounded font-bold transition-colors"
            >
              Pay Now (৳1,500.00 BDT) &rarr;
            </Link>
          </div>
        )}

        {/* Domain Search Banner */}
        <div className="bg-[#1A4D80] text-white p-6 rounded-lg shadow-sm">
          <h2 className="text-base font-bold mb-1">Find your new domain name</h2>
          <p className="text-xs text-white/80 mb-3">
            Register .com, .net, .org, or .com.bd domains with instant DNS provisioning
          </p>
          <div className="flex max-w-xl bg-white rounded overflow-hidden p-1">
            <input
              type="text"
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              placeholder="Enter your desired domain name..."
              className="flex-1 px-3 py-2 text-xs text-slate-800 focus:outline-none"
            />
            <button className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2 rounded text-xs font-bold transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Active Products & Services */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span>Your Active Products/Services</span>
            <Link
              href="/clientarea?action=services"
              className="text-[#1A4D80] hover:underline font-semibold"
            >
              View All &rarr;
            </Link>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-4">Product / Service</th>
                <th className="py-2.5 px-4">Domain</th>
                <th className="py-2.5 px-4">Pricing</th>
                <th className="py-2.5 px-4">Next Due Date</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{s.product}</td>
                  <td className="py-3 px-4 text-[#1A4D80] font-medium">{s.domain}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{s.pricing}</td>
                  <td className="py-3 px-4 text-slate-600">{s.nextDue}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded text-[11px] font-semibold">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
