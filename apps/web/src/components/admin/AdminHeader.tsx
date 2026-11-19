'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Settings,
  HelpCircle,
  Wrench,
  Download,
  Plus,
  ChevronDown,
  User,
  LogOut,
  AlertTriangle,
  X,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminSearch } from '@/context/AdminSearchContext';

export function AdminHeader() {
  const { admin, logout } = useAdminAuth();
  const { searchQuery, setSearchQuery, clearSearch } = useAdminSearch();
  const router = useRouter();
  const pathname = usePathname();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      router.push('/admin/users');
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full shadow-md font-sans text-[13px] select-none">
      {/* 1. WHMCS CUSTOM TOP STATS BAR (admin_top_stats.php exact replica) */}
      <div
        id="customTopStatsBar"
        className="w-full text-center py-1.5 px-3 whitespace-nowrap overflow-x-auto flex items-center justify-center gap-1 text-[11px] font-semibold text-white shadow-inner"
        style={{ backgroundColor: '#1a4d80', borderBottom: '1px solid #143d66' }}
      >
        <Link
          href="/admin/users"
          style={{ backgroundColor: '#34495e' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          1 New Clients
        </Link>

        <Link
          href="/admin/billing"
          style={{ backgroundColor: '#5cb85c' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          5 Orders
        </Link>

        <Link
          href="/admin/billing"
          style={{ backgroundColor: '#009688' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          🔄 0 Renew (৳0.00)
        </Link>

        <Link
          href="/admin/support"
          style={{ backgroundColor: '#17a2b8' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          2 Tickets
        </Link>

        <Link
          href="/admin/audit"
          style={{ backgroundColor: '#e83e8c' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          9 Errors Today
        </Link>

        <Link
          href="/admin/billing"
          style={{ backgroundColor: '#6f42c1' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          Due: ৳577,247.50
        </Link>

        <Link
          href="/admin/billing"
          style={{ backgroundColor: '#dc3545' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          Overdue: ৳574,447.50
        </Link>

        <Link
          href="/admin/billing"
          style={{ backgroundColor: '#007bff' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          0 Paid Today
        </Link>

        <Link
          href="/admin/billing"
          style={{ backgroundColor: '#28a745' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white hover:opacity-90 transition-opacity"
        >
          Income: ৳0.00
        </Link>

        <span
          style={{ backgroundColor: '#8e44ad' }}
          className="inline-block mx-0.5 px-2 py-0.5 rounded text-white"
        >
          ⚡ ✔ 0 (৳0.00) | ⏳ 0 (৳0.00) | ❌ 0 (৳0.00)
        </span>
      </div>

      {/* 2. WHMCS MAIN NAVIGATION BAR (.navigation exact replica) */}
      <div
        className="w-full h-11 px-4 flex items-center justify-between text-white border-b border-[#143d66]"
        style={{ backgroundColor: '#1A4D80' }}
      >
        {/* Left: WHMCS Logo + Nav Links */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center mr-3 hover:opacity-95">
            <img
              src="/whmcs/logo.png"
              alt="WHMCS"
              className="h-7 w-auto object-contain brightness-105"
            />
          </Link>

          {/* Quick Plus Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('plus')}
              className={`p-1.5 rounded hover:bg-black/20 text-white font-bold transition-colors ${
                activeDropdown === 'plus' ? 'bg-black/30' : ''
              }`}
              title="Add New"
            >
              <Plus className="w-4 h-4" />
            </button>
            {activeDropdown === 'plus' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/clients/add"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/clientsadd.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Add New Client
                </Link>
                <Link
                  href="/admin/orders/add"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/ordersadd.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Add New Order
                </Link>
                <Link
                  href="/admin/invoices?action=create"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/invoicesedit.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Create Invoice
                </Link>
                <Link
                  href="/admin/support?action=open"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/ticketsopen.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Open New Ticket
                </Link>
              </div>
            )}
          </div>

          {/* Clients Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('clients')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'clients' ? 'bg-black/30' : ''
              }`}
            >
              <span>Clients</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'clients' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/clients"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/clients.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  View/Search Clients
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 text-slate-600"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  View/Search Users
                </Link>
                <Link
                  href="/admin/clients/add"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/clientsadd.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Add New Client
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/clients/services"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Products/Services
                </Link>
                <Link
                  href="/admin/clients/domains"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/domains.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Domain Registrations
                </Link>
                <Link
                  href="/admin/clients/cancellations"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/delete.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Cancellation Requests
                </Link>
                <Link
                  href="/admin/clients/affiliates"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/affiliates.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Manage Affiliates
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/kyc"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 font-bold text-[#1A4D80]"
                >
                  <span>Document Verify (KYC)</span>
                  <span className="text-[10px] bg-[#5cb85c] text-white px-1.5 py-0.2 rounded font-mono">Module</span>
                </Link>
                <Link
                  href="/admin/kyb"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-600"
                >
                  Business KYB Verification
                </Link>
              </div>
            )}
          </div>

          {/* Orders Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('orders')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'orders' ? 'bg-black/30' : ''
              }`}
            >
              <span>Orders</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'orders' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/orders"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/orders.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  List All Orders
                </Link>
                <Link
                  href="/admin/orders/add"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/ordersadd.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Add New Order
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/orders?status=Pending"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-amber-700 font-medium"
                >
                  Pending Orders (5)
                </Link>
                <Link
                  href="/admin/orders?status=Active"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-emerald-700"
                >
                  Active Orders
                </Link>
                <Link
                  href="/admin/orders?status=Cancelled"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-rose-700"
                >
                  Cancelled Orders
                </Link>
              </div>
            )}
          </div>

          {/* Billing Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('billing')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'billing' ? 'bg-black/30' : ''
              }`}
            >
              <span>Billing</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'billing' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/transactions"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/income.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Transactions List
                </Link>
                <Link
                  href="/admin/invoices"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/invoices.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Invoices
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/billing/billable-items"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/billableitems.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Billable Items
                </Link>
                <Link
                  href="/admin/billing/gateway-log"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Gateway Log
                </Link>
                <Link
                  href="/admin/billing/offline-cc"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/offlinecc.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Offline CC Processing
                </Link>
              </div>
            )}
          </div>

          {/* Support Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('support')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'support' ? 'bg-black/30' : ''
              }`}
            >
              <span>Support</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'support' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/support"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/tickets.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Support Tickets
                </Link>
                <Link
                  href="/admin/support?action=open"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/ticketsopen.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Open New Ticket
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/support/predefined-replies"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/ticketspredefined.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Predefined Replies
                </Link>
                <Link
                  href="/admin/support/announcements"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Announcements
                </Link>
                <Link
                  href="/admin/support/downloads"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Downloads
                </Link>
                <Link
                  href="/admin/support/kb"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Knowledgebase
                </Link>
              </div>
            )}
          </div>

          {/* Reports Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => toggleDropdown('reports')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'reports' ? 'bg-black/30' : ''
              }`}
            >
              <span>Reports</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'reports' && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/reports"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 font-semibold"
                >
                  <img src="/whmcs/icons/reports.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Reports Overview
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/reports?tab=daily"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Daily Performance
                </Link>
                <Link
                  href="/admin/reports?tab=monthly"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Monthly Transactions
                </Link>
              </div>
            )}
          </div>

          {/* Utilities Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => toggleDropdown('utilities')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'utilities' ? 'bg-black/30' : ''
              }`}
            >
              <span>Utilities</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'utilities' && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/utilities/whmcs-sync"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 font-bold text-[#1A4D80]"
                >
                  <img src="/whmcs/icons/navrotate.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  <span>WHMCS Live Sync Console</span>
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/utilities/automation-status"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Automation Status
                </Link>
                <Link
                  href="/admin/utilities/activity-log"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  System Activity Log
                </Link>
                <Link
                  href="/admin/utilities/module-queue"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Module Queue
                </Link>
                <Link
                  href="/admin/utilities/todo"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100"
                >
                  <img src="/whmcs/icons/todolist.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  To-Do List
                </Link>
                <Link
                  href="/admin/utilities/whois"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  WHOIS Lookup
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/queues"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-600"
                >
                  BullMQ Queue Workers
                </Link>
                <Link
                  href="/admin/utilities/cleanup"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  System Cleanup
                </Link>
                <Link
                  href="/admin/utilities/database"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  Database Status
                </Link>
                <Link
                  href="/admin/utilities/phpinfo"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100"
                >
                  PHP Info
                </Link>
              </div>
            )}
          </div>

          {/* Addons Dropdown - 1:1 WHMCS Modules from billing.softcents.com */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => toggleDropdown('addons')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'addons' ? 'bg-black/30' : ''
              }`}
            >
              <span>Addons</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'addons' && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50 max-h-[85vh] overflow-y-auto">
                <Link
                  href="/admin/addons/DomainsReseller"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Domains Reseller
                </Link>
                <Link
                  href="/admin/addons/RegistrationAlert"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Registration Email Alert
                </Link>
                <Link
                  href="/admin/addons/SOFTCENTS_SMS"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  SOFTCENTS SMS
                </Link>
                <Link
                  href="/admin/addons/advanced_client_verification"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Advanced Client Verification
                </Link>
                <Link
                  href="/admin/addons/bdhost_wa"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Bdhost WhatsApp Pro
                </Link>
                <Link
                  href="/admin/addons/dynamiccoupon"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Dynamic Coupon
                </Link>
                <Link
                  href="/admin/addons/expiredproducts"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Expired Products Manager
                </Link>
                <Link
                  href="/admin/addons/forceclientactive"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Force Client Active
                </Link>
                <Link
                  href="/admin/addons/italk_balance"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  iTalk Balance
                </Link>
                <Link
                  href="/admin/addons/italk_recharge"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Multi-Provider Auto Recharge
                </Link>
                <Link
                  href="/admin/addons/price_updater"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Price Updater Pro
                </Link>
                <Link
                  href="/admin/addons/project_management"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Project Management
                </Link>
                <Link
                  href="/admin/addons/scrolling_notice"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Scrolling Notice Manager
                </Link>
                <Link
                  href="/admin/addons/suiten_genrenew"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Service Renewal
                </Link>
                <Link
                  href="/admin/addons/tld_price_updater"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  Domain & TLD Price Updater
                </Link>
                <Link
                  href="/admin/addons/unblockip"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  ip Unblocker
                </Link>
                <Link
                  href="/admin/addons/whois"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700 hover:text-[#1A4D80]"
                >
                  WHOIS for clientarea
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/addons"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 font-bold text-[#1A4D80]"
                >
                  <img src="/whmcs/icons/addonmodules.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  <span>Addon Modules Hub</span>
                </Link>
              </div>
            )}
          </div>

          {/* Setup / Configuration Dropdown */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => toggleDropdown('setup')}
              className={`px-2.5 py-1.5 rounded hover:bg-black/20 text-white font-medium flex items-center space-x-1 text-xs transition-colors ${
                activeDropdown === 'setup' ? 'bg-black/30' : ''
              }`}
            >
              <span>Setup</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'setup' && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-1 text-xs z-50">
                <Link
                  href="/admin/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 font-bold text-slate-800"
                >
                  <img src="/whmcs/icons/config.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  General Settings
                </Link>
                <Link
                  href="/admin/servers"
                  onClick={() => setActiveDropdown(null)}
                  className="flex items-center px-3 py-1.5 hover:bg-slate-100 text-[#1A4D80] font-semibold"
                >
                  <img src="/whmcs/icons/income.png" className="w-3.5 h-3.5 mr-2" alt="" />
                  Servers & Provisioning (6)
                </Link>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/admin/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  Automation Settings
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  Payment Gateways (PipraPay)
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  Staff Administrators
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Nav: Icons, Search, User profile */}
        <div className="flex items-center space-x-3 text-white/90">
          {/* Search Toggle */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1 hover:text-white hover:bg-black/20 rounded transition-colors"
              title="IntelliSearch"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchOpen && (
              <form
                onSubmit={handleSearchSubmit}
                className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-800 rounded shadow-2xl p-2 border border-slate-200 z-50 flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="IntelliSearch (Users, Invoices, NID)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-600"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-[#1A4D80] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#143d66]"
                >
                  Go
                </button>
              </form>
            )}
          </div>

          {/* Automation Status Cog */}
          <Link
            href="/admin/queues"
            className="p-1 hover:text-white hover:bg-black/20 rounded transition-colors"
            title="Automation Status"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Wrench Configuration */}
          <Link
            href="/admin/settings"
            className="p-1 hover:text-white hover:bg-black/20 rounded transition-colors"
            title="System Settings"
          >
            <Wrench className="w-4 h-4" />
          </Link>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('user')}
              className="flex items-center space-x-1.5 p-1 rounded hover:bg-black/20 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs uppercase">
                {admin?.firstName?.[0] || admin?.email?.[0] || 'R'}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">
                {admin?.firstName || admin?.email?.split('@')[0] || 'raju'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            {activeDropdown === 'user' && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white text-slate-800 rounded shadow-xl border border-slate-200 py-2 text-xs z-50">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <div className="font-bold text-slate-900 truncate">
                    {admin?.firstName || 'Raju'} {admin?.lastName || ''}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{admin?.email}</div>
                </div>
                <Link
                  href="/admin/settings"
                  onClick={() => setActiveDropdown(null)}
                  className="block px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  My Account
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 font-medium flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            onClick={() => window.open('https://help.softcents.com', '_blank')}
            className="p-1 hover:text-white hover:bg-black/20 rounded transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. WHMCS GLOBAL ADMIN WARNING BANNER (OPCACHE WARNING STYLE) */}
      {showWarning && (
        <div
          className="w-full py-1.5 px-4 text-center text-xs flex items-center justify-center space-x-2 border-b"
          style={{
            backgroundColor: '#fcf8e3',
            borderColor: '#faebcc',
            color: '#8a6d3b',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>The OPcache PHP extension is enabled.</strong> This extension can cause problems with cached data use and PHP script execution in WHMCS. We recommend disabling OPcache.{' '}
            <span className="underline cursor-pointer hover:text-amber-950 font-medium">Learn More.</span>
          </span>
          <button
            onClick={() => setShowWarning(false)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-3 text-sm leading-none"
          >
            ×
          </button>
        </div>
      )}
    </header>
  );
}
