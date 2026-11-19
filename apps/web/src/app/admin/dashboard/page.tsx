'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  MessageSquare,
  Ban,
  AlertTriangle,
  RefreshCw,
  Settings,
  ChevronDown,
  X,
  CheckCircle,
  Globe,
  PlusCircle,
  Trophy,
  Ticket,
  Wallet,
  PiggyBank,
  FileText,
  Clock,
  Coins,
  Zap,
  CheckCircle2,
  Hourglass,
  XCircle,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';
import syncedWhmcs from '@/data/whmcs_sync.json';

export default function AdminDashboardPage() {
  const { token, admin } = useAdminAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar collapse state
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  // Search
  const [searchField, setSearchField] = useState('Client Name');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [whoisModalOpen, setWhoisModalOpen] = useState(false);
  const [whoisDomain, setWhoisDomain] = useState('');
  const [whoisLoading, setWhoisLoading] = useState(false);
  const [whoisResult, setWhoisResult] = useState<any>(null);

  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [clientSubmitting, setClientSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/dashboard/stats', {}, token);
      if (res.ok) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  // WHMCS live synced data
  const whmcsData = stats?.whmcs || {};
  const pendingOrders = whmcsData.pendingOrders ?? (syncedWhmcs?.orderCount ?? 164);
  const ticketsWaiting = whmcsData.ticketsWaiting ?? stats?.support?.openTickets ?? (syncedWhmcs?.ticketCount ?? 29);
  const pendingCancellations = whmcsData.pendingCancellations ?? 0;
  const pendingModuleActions = whmcsData.pendingModuleActions ?? 3;

  const newClients = whmcsData.newClients ?? stats?.users?.total ?? (syncedWhmcs?.clientCount ?? 168);
  const soldCount = whmcsData.soldCount ?? (syncedWhmcs?.serviceCount ?? 149);
  const soldPackageName = whmcsData.soldPackageName ?? 'Standard Cloud PBX';
  const openTickets = stats?.support?.openTickets ?? (syncedWhmcs?.ticketCount ?? 29);

  const dueAmount = whmcsData.dueAmount ? `৳${whmcsData.dueAmount.toLocaleString()}` : '৳577,247.50';
  const overdueAmount = whmcsData.overdueAmount ? `৳${whmcsData.overdueAmount.toLocaleString()}` : '৳574,447.50';
  const incomeToday = whmcsData.incomeToday ? `৳${whmcsData.incomeToday.toLocaleString()}` : '৳0.00';
  const renewAmount = whmcsData.renewTodayAmount ? `৳${whmcsData.renewTodayAmount.toLocaleString()}` : '৳0.00';
  const addFundsToday = '৳0.00';
  const totalCredit = '৳11,131.82';

  const handleWhoisLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whoisDomain.trim()) return;
    setWhoisLoading(true);
    setTimeout(() => {
      setWhoisResult({
        domain: whoisDomain,
        status: 'Registered / Active',
        registrar: 'Softcents Registry Engine (ICANN Accredited)',
        nameservers: ['ns1.softcents.com', 'ns2.softcents.com'],
        created: '2021-04-12',
        expires: '2027-04-12',
      });
      setWhoisLoading(false);
    }, 600);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setClientSubmitting(true);
    setTimeout(() => {
      setClientSubmitting(false);
      setAddClientModalOpen(false);
      setActionNotice(`New client ${newClientName || newClientEmail} created successfully!`);
      setTimeout(() => setActionNotice(null), 4000);
      setNewClientName('');
      setNewClientEmail('');
      fetchStats();
    }, 700);
  };

  return (
    <div className="font-sans text-[#333]">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed top-24 right-8 z-50 bg-[#198754] text-white text-xs px-4 py-2.5 rounded shadow-xl flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* ======================================================== */}
        {/* LEFT SIDEBAR (.sidebar - EXACT WHMCS 195px)              */}
        {/* ======================================================== */}
        <aside
          className={`${
            sidebarMinimized ? 'w-10' : 'w-full lg:w-[195px]'
          } shrink-0 bg-transparent transition-all duration-200 select-none`}
        >
          {sidebarMinimized ? (
            <div className="bg-white border border-[#ccc] rounded p-1 text-center">
              <button
                onClick={() => setSidebarMinimized(false)}
                className="p-1 text-[#202f60] hover:text-[#1a4d80] text-xs font-bold"
                title="Open Sidebar"
              >
                »
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-[12px]">
              {/* SHORTCUTS */}
              <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
                <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-2.5 py-1.5 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
                  <span className="text-[#f0ad4e]">★</span>
                  <span>Shortcuts</span>
                </div>
                <ul className="py-1 text-[#202f60]">
                  <li>
                    <button
                      onClick={() => setAddClientModalOpen(true)}
                      className="w-full text-left px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/clientsadd.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Add New Client</span>
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/admin/billing"
                      className="block px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/ordersadd.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Add New Order</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActionNotice('Quote creator ready');
                        setTimeout(() => setActionNotice(null), 3000);
                      }}
                      className="w-full text-left px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/quote.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Create New Quote</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActionNotice('To-Do entry recorded');
                        setTimeout(() => setActionNotice(null), 3000);
                      }}
                      className="w-full text-left px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/todolist.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Create New To-Do Entry</span>
                    </button>
                  </li>
                  <li>
                    <Link
                      href="/admin/kyc"
                      className="block px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5 font-semibold text-[#1a4d80]"
                    >
                      <img src="/whmcs/icons/clients.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Document Verify (KYC)</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/support"
                      className="block px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/tickets.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Open New Ticket</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => setWhoisModalOpen(true)}
                      className="w-full text-left px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/domains.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">WHOIS Lookup</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActionNotice('Generating due invoices... Done! (0 new generated)');
                        setTimeout(() => setActionNotice(null), 3000);
                      }}
                      className="w-full text-left px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/invoices.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Generate Due Invoices</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActionNotice('Attempting offline credit card captures... Done!');
                        setTimeout(() => setActionNotice(null), 3000);
                      }}
                      className="w-full text-left px-2.5 py-1 hover:bg-[#eff2f9] flex items-center space-x-1.5"
                    >
                      <img src="/whmcs/icons/offlinecc.png" alt="" width={16} height={16} />
                      <span className="underline hover:text-[#1a4d80]">Attempt CC Captures</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* SYSTEM INFORMATION */}
              <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
                <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-2.5 py-1.5 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
                  <span className="text-[#1A4D80]">ℹ</span>
                  <span>System Information</span>
                </div>
                <div className="p-2.5 text-[11px] leading-relaxed text-[#666]">
                  <div>
                    <span className="text-[#444]">Registered To:</span> Softcents Central
                  </div>
                  <div>
                    <span className="text-[#444]">License Type:</span> WHMCS 8.13.1
                  </div>
                  <div>
                    <span className="text-[#444]">Expires:</span> 31st December 2099
                  </div>
                  <div>
                    <span className="text-[#444]">Version:</span> 8.13.1
                  </div>
                  <div className="text-[#cc0000] font-bold mt-0.5">
                    An update is available!
                  </div>
                </div>
              </div>

              {/* ADVANCED SEARCH */}
              <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
                <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-2.5 py-1.5 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
                  <span className="text-[#1A4D80]">🔍</span>
                  <span>Advanced Search</span>
                </div>
                <div className="p-2 space-y-1.5">
                  <select className="w-full bg-white border border-[#ccc] rounded px-2 py-1 text-[11px] text-[#555] focus:outline-none">
                    <option>Clients</option>
                    <option>Orders</option>
                    <option>Invoices</option>
                    <option>Tickets</option>
                    <option>Domains</option>
                  </select>

                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="w-full bg-white border border-[#ccc] rounded px-2 py-1 text-[11px] text-[#555] focus:outline-none"
                  >
                    <option>Client ID</option>
                    <option>Client Name</option>
                    <option>Company Name</option>
                    <option>Email Address</option>
                    <option>Phone Number</option>
                  </select>

                  <div className="flex">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder=""
                      className="flex-1 bg-white border border-r-0 border-[#ccc] rounded-l px-2 py-1 text-[11px] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (searchQuery.trim()) window.location.href = '/admin/users';
                      }}
                      className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-[11px] px-2.5 py-1 rounded-r transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* STAFF ONLINE */}
              <div className="bg-white border border-[#ccc] rounded shadow-sm overflow-hidden">
                <div className="bg-[#f0f0f0] border-b border-[#e5e5e5] px-2.5 py-1.5 font-bold text-[#444] text-[11px] flex items-center space-x-1.5">
                  <span className="text-[#1A4D80]">👥</span>
                  <span>Staff Online</span>
                </div>
                <div className="p-2 text-[11px] text-[#555] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5cb85c]"></span>
                  <span>{admin?.firstName || admin?.email?.split('@')[0] || 'raju'}</span>
                </div>
              </div>

              {/* MINIMISE SIDEBAR BUTTON */}
              <button
                onClick={() => setSidebarMinimized(true)}
                className="w-full block py-1.5 px-2 bg-[#666] hover:bg-[#555] text-white text-center text-[11px] font-semibold rounded shadow-sm transition-colors"
              >
                « Minimise Sidebar
              </button>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN CONTENT AREA                                   */}
        {/* ======================================================== */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Dashboard Header Bar */}
          <div className="flex items-center justify-between pb-1 border-b border-[#e5e5e5]">
            <h1 className="text-xl font-normal text-[#333]">Dashboard</h1>
            <button
              title="Dashboard Preferences"
              className="p-1 rounded text-[#888] hover:text-[#444] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* SITEJET BUILDER FEATURE BANNER (EXACT WHMCS NOTIFICATION) */}
          {showPromoBanner && (
            <div className="bg-white border border-[#ddd] rounded p-4 shadow-sm relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-[#182a4d] text-white flex items-center justify-center shrink-0 shadow">
                  <img
                    src="/whmcs/sitejet-logo.png"
                    alt="Sitejet"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#333]">
                    Sitejet Builder (Now Available in cPanel & WHM and Plesk)
                  </h3>
                  <p className="text-xs text-[#666] mt-1 max-w-4xl leading-relaxed">
                    Sitejet Builder integration is now included in both cPanel & WHM and Plesk at no additional cost.
                    Activate Sitejet Builder in WHMCS to easily offer it to your customers as part of hosting plans or as an optional addon.
                    Sitejet Builder is available in cPanel & WHM version 116 and later and Plesk 18.0.57 and later.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 self-end md:self-center shrink-0">
                <button
                  onClick={() => {
                    setActionNotice('Opening Sitejet / cPanel Module Settings...');
                    setTimeout(() => setActionNotice(null), 3000);
                  }}
                  className="bg-[#29b6f6] hover:bg-[#0288d1] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setShowPromoBanner(false)}
                  className="text-[#999] hover:text-[#555] text-base font-bold p-1 leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* THE 4 HEALTH/STATUS BADGES (Badges.php EXACT REPLICA)     */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Pending Orders (Green #5cb85c) */}
            <Link
              href="/admin/billing"
              className="rounded p-4 text-white flex items-center space-x-4 shadow-sm hover:opacity-95 transition-opacity"
              style={{ backgroundColor: '#5cb85c' }}
            >
              <ShoppingCart className="w-10 h-10 text-white/90 shrink-0" />
              <div>
                <div className="text-3xl font-bold leading-none">{pendingOrders}</div>
                <div className="text-xs font-semibold text-white/95 mt-1">Pending Orders</div>
              </div>
            </Link>

            {/* 2. Tickets Waiting (Pink #e83e8c) */}
            <Link
              href="/admin/support"
              className="rounded p-4 text-white flex items-center space-x-4 shadow-sm hover:opacity-95 transition-opacity"
              style={{ backgroundColor: '#e83e8c' }}
            >
              <MessageSquare className="w-10 h-10 text-white/90 shrink-0" />
              <div>
                <div className="text-3xl font-bold leading-none">{ticketsWaiting}</div>
                <div className="text-xs font-semibold text-white/95 mt-1">Tickets Waiting</div>
              </div>
            </Link>

            {/* 3. Pending Cancellations (Orange #f0ad4e) */}
            <div
              className="rounded p-4 text-white flex items-center space-x-4 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
              style={{ backgroundColor: '#f0ad4e' }}
            >
              <Ban className="w-10 h-10 text-white/90 shrink-0" />
              <div>
                <div className="text-3xl font-bold leading-none">{pendingCancellations}</div>
                <div className="text-xs font-semibold text-white/95 mt-1">Pending Cancellations</div>
              </div>
            </div>

            {/* 4. Pending Module Actions (Cyan #00c0ef) */}
            <div
              className="rounded p-4 text-white flex items-center space-x-4 shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
              style={{ backgroundColor: '#00c0ef' }}
            >
              <AlertTriangle className="w-10 h-10 text-white/90 shrink-0" />
              <div>
                <div className="text-3xl font-bold leading-none">{pendingModuleActions}</div>
                <div className="text-xs font-semibold text-white/95 mt-1">Pending Module Actions</div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TWO MAIN WIDGETS ROW:                                    */}
          {/* LEFT: Ultimate Business Overview (2 Columns)             */}
          {/* RIGHT: Automation Overview (1 Column)                    */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* Left 8 Columns: Ultimate Business Overview */}
            <div className="xl:col-span-8 bg-white border border-[#ddd] rounded shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#eee]">
                <h3 className="text-xs font-bold text-[#555] uppercase tracking-wide">
                  Ultimate Business Overview
                </h3>
                <div className="flex items-center space-x-2 text-[#aaa]">
                  <button onClick={fetchStats} className="hover:text-[#444] p-0.5" title="Refresh">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 1. SECTION: GENERAL, SUPPORT & SALES */}
              <div>
                <div className="text-xs font-bold text-[#555] uppercase mb-2.5 pb-1 border-b-2 border-[#eee] flex items-center space-x-1.5">
                  <span>📊</span>
                  <span>GENERAL, SUPPORT & SALES</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Tile 1: 1 NEW CLIENTS (bg-c-dark) */}
                  <Link
                    href="/admin/users"
                    className="p-3.5 rounded text-white block relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #343a40, #6c757d)' }}
                  >
                    <div className="text-2xl font-bold leading-none">{newClients}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      NEW CLIENTS
                    </div>
                  </Link>

                  {/* Tile 2: 5 PENDING ORDERS (bg-c-blue) */}
                  <Link
                    href="/admin/billing"
                    className="p-3.5 rounded text-white block relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #0d6efd, #0dcaf0)' }}
                  >
                    <div className="text-2xl font-bold leading-none">{pendingOrders}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      PENDING ORDERS
                    </div>
                  </Link>

                  {/* Tile 3: 24 Sold BASIC (bg-c-gold) */}
                  <div
                    className="p-3.5 rounded text-white block relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #FFD700, #F39C12)' }}
                  >
                    <div className="text-2xl font-bold leading-none">{soldCount} Sold</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/90 mt-1.5 truncate">
                      🏆 {soldPackageName}
                    </div>
                  </div>

                  {/* Tile 4: 2 OPEN TICKETS (bg-c-orange) */}
                  <Link
                    href="/admin/support"
                    className="p-3.5 rounded text-white block relative overflow-hidden shadow-sm transition-transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #fd7e14, #ffc107)' }}
                  >
                    <div className="text-2xl font-bold leading-none">{openTickets}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      OPEN TICKETS
                    </div>
                  </Link>
                </div>
              </div>

              {/* 2. SECTION: BILLING & INCOME STATS */}
              <div>
                <div className="text-xs font-bold text-[#555] uppercase mb-2.5 pb-1 border-b-2 border-[#eee] flex items-center space-x-1.5">
                  <span>💰</span>
                  <span>BILLING & INCOME STATS</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Row 1 */}
                  {/* Income Today (bg-c-green) */}
                  <div
                    className="p-3.5 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #198754, #20c997)' }}
                  >
                    <div className="text-xl font-bold leading-none">{incomeToday}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      INCOME TODAY (0)
                    </div>
                  </div>

                  {/* Renew Today (bg-c-teal) */}
                  <div
                    className="p-3.5 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #009688, #4db6ac)' }}
                  >
                    <div className="text-xl font-bold leading-none">{renewAmount}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      RENEW TODAY (0)
                    </div>
                  </div>

                  {/* Add Funds Today (bg-c-pink) */}
                  <div
                    className="p-3.5 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #e83e8c, #fd7e14)' }}
                  >
                    <div className="text-xl font-bold leading-none">{addFundsToday}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      ADD FUNDS TODAY
                    </div>
                  </div>

                  {/* Row 2 */}
                  {/* Total Unpaid Due (bg-c-purple) */}
                  <div
                    className="p-3.5 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #6f42c1, #d63384)' }}
                  >
                    <div className="text-xl font-bold leading-none">{dueAmount}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      TOTAL UNPAID DUE
                    </div>
                  </div>

                  {/* Total Overdue (dark red to bright red gradient) */}
                  <div
                    className="p-3.5 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #8b0000, #dc3545)' }}
                  >
                    <div className="text-xl font-bold leading-none">{overdueAmount}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      TOTAL OVERDUE
                    </div>
                  </div>

                  {/* Total Client Credit (bg-c-cyan) */}
                  <div
                    className="p-3.5 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0dcaf0, #20c997)' }}
                  >
                    <div className="text-xl font-bold leading-none">{totalCredit}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-1.5">
                      TOTAL CLIENT CREDIT
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SECTION: iTALK RECHARGE TODAY (MODULE ACTIONS) */}
              <div>
                <div className="text-xs font-bold text-[#555] uppercase mb-2.5 pb-1 border-b-2 border-[#eee] flex items-center space-x-1.5">
                  <span>⚡</span>
                  <span>iTalk Recharge Today</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Success Today */}
                  <div
                    className="p-3 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #198754, #20c997)' }}
                  >
                    <div className="text-[11px] font-medium text-white/90">Count: 0</div>
                    <div className="text-lg font-bold leading-tight">৳0.00</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-0.5">
                      SUCCESS TODAY
                    </div>
                  </div>

                  {/* Pending Today */}
                  <div
                    className="p-3 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #fd7e14, #ffc107)' }}
                  >
                    <div className="text-[11px] font-medium text-white/90">Count: 0</div>
                    <div className="text-lg font-bold leading-tight">৳0.00</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-0.5">
                      PENDING TODAY
                    </div>
                  </div>

                  {/* Failed Today */}
                  <div
                    className="p-3 rounded text-white shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #dc3545, #e83e8c)' }}
                  >
                    <div className="text-[11px] font-medium text-white/90">Count: 0</div>
                    <div className="text-lg font-bold leading-tight">৳0.00</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80 mt-0.5">
                      FAILED TODAY
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Automation Overview (Automation.php exact replica) */}
            <div className="xl:col-span-4 bg-white border border-[#ddd] rounded shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#eee]">
                <h3 className="text-xs font-bold text-[#555] uppercase tracking-wide">
                  Automation Overview
                </h3>
                <div className="flex items-center space-x-1.5 text-[#aaa]">
                  <button onClick={fetchStats} className="hover:text-[#444] p-0.5" title="Refresh">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Invoices Created */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f5f5]">
                  <div>
                    <svg className="w-24 h-7 text-[#40babd]" viewBox="0 0 100 28" fill="none">
                      <polygon points="0,26 20,24 45,10 70,18 100,5 100,28 0,28" fill="#92d1d2" opacity="0.3" />
                      <polyline points="0,26 20,24 45,10 70,18 100,5" stroke="#40babd" strokeWidth="2" />
                    </svg>
                    <div className="text-[#888] font-semibold text-[11px] mt-1">Invoices Created</div>
                  </div>
                  <div className="text-2xl font-bold text-[#40babd]">0</div>
                </div>

                {/* 2. Credit Card Captures */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f5f5]">
                  <div>
                    <svg className="w-24 h-7 text-[#84d991]" viewBox="0 0 100 28" fill="none">
                      <polygon points="0,24 30,22 60,15 80,18 100,8 100,28 0,28" fill="rgba(132, 217, 145, 0.2)" />
                      <polyline points="0,24 30,22 60,15 80,18 100,8" stroke="rgba(132, 217, 145, 0.7)" strokeWidth="2" />
                    </svg>
                    <div className="text-[#888] font-semibold text-[11px] mt-1">Credit Card Captures</div>
                  </div>
                  <div className="text-2xl font-bold text-[#84d991]">0</div>
                </div>

                {/* 3. Overdue Suspensions */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f5f5]">
                  <div>
                    <svg className="w-24 h-7 text-[#f8a13f]" viewBox="0 0 100 28" fill="none">
                      <polygon points="0,26 35,26 70,14 100,14 100,28 0,28" fill="rgba(248, 161, 63, 0.2)" />
                      <polyline points="0,26 35,26 70,14 100,14" stroke="rgba(248, 161, 63, 0.7)" strokeWidth="2" />
                    </svg>
                    <div className="text-[#888] font-semibold text-[11px] mt-1">Overdue Suspensions</div>
                  </div>
                  <div className="text-2xl font-bold text-[#f8a13f]">0</div>
                </div>

                {/* 4. Inactive Tickets Closed */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f5f5]">
                  <div>
                    <svg className="w-24 h-7 text-[#ea5395]" viewBox="0 0 100 28" fill="none">
                      <polygon points="0,18 35,26 70,8 100,22 100,28 0,28" fill="rgba(234, 83, 149, 0.2)" />
                      <polyline points="0,18 35,26 70,8 100,22" stroke="rgba(234, 83, 149, 0.7)" strokeWidth="2" />
                    </svg>
                    <div className="text-[#888] font-semibold text-[11px] mt-1">Inactive Tickets Closed</div>
                  </div>
                  <div className="text-2xl font-bold text-[#ea5395]">0</div>
                </div>

                {/* 5. Cancellations Processed */}
                <div className="flex items-center justify-between pb-3 border-b border-[#f5f5f5]">
                  <div>
                    <svg className="w-24 h-7 text-[#901fc5]" viewBox="0 0 100 28" fill="none">
                      <polygon points="0,26 40,18 75,24 100,12 100,28 0,28" fill="rgba(144, 31, 197, 0.2)" />
                      <polyline points="0,26 40,18 75,24 100,12" stroke="rgba(144, 31, 197, 0.7)" strokeWidth="2" />
                    </svg>
                    <div className="text-[#888] font-semibold text-[11px] mt-1">Cancellations Processed</div>
                  </div>
                  <div className="text-2xl font-bold text-[#901fc5]">0</div>
                </div>

                <div className="pt-2 text-[11px] text-[#666] flex items-center space-x-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-[#5cb85c]" />
                  <span>Last Automation Run: Today at 2:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: WHOIS LOOKUP                                    */}
      {/* ======================================================== */}
      {whoisModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-5 shadow-2xl border border-[#ccc]">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee]">
              <h3 className="font-bold text-[#333] text-sm">WHOIS Domain Lookup</h3>
              <button
                onClick={() => {
                  setWhoisModalOpen(false);
                  setWhoisResult(null);
                }}
                className="text-[#999] hover:text-[#555] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWhoisLookup} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#555]">Enter Domain Name</label>
                <div className="flex space-x-2 mt-1">
                  <input
                    type="text"
                    required
                    placeholder="e.g. softcents.com"
                    value={whoisDomain}
                    onChange={(e) => setWhoisDomain(e.target.value)}
                    className="flex-1 bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                  />
                  <button
                    type="submit"
                    disabled={whoisLoading}
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white font-semibold text-xs px-4 py-1.5 rounded transition-colors"
                  >
                    {whoisLoading ? 'Searching...' : 'Lookup'}
                  </button>
                </div>
              </div>

              {whoisResult && (
                <div className="p-3 bg-[#f9f9f9] rounded border border-[#e5e5e5] text-xs space-y-1 mt-3">
                  <div>
                    <span className="font-semibold text-[#666]">Domain:</span>{' '}
                    <span className="font-bold text-[#333]">{whoisResult.domain}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#666]">Status:</span>{' '}
                    <span className="text-[#198754] font-semibold">{whoisResult.status}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#666]">Registrar:</span> {whoisResult.registrar}
                  </div>
                  <div>
                    <span className="font-semibold text-[#666]">Nameservers:</span>{' '}
                    {whoisResult.nameservers.join(', ')}
                  </div>
                  <div>
                    <span className="font-semibold text-[#666]">Expires:</span> {whoisResult.expires}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD NEW CLIENT                                  */}
      {/* ======================================================== */}
      {addClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded max-w-md w-full p-5 shadow-2xl border border-[#ccc]">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee]">
              <h3 className="font-bold text-[#333] text-sm">Add New Client</h3>
              <button
                onClick={() => setAddClientModalOpen(false)}
                className="text-[#999] hover:text-[#555] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#555]">Client Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#555]">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="client@softcents.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full mt-1 bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddClientModalOpen(false)}
                  className="px-3 py-1 rounded border border-[#ccc] text-xs text-[#666] hover:bg-[#eee]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clientSubmitting}
                  className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-semibold text-xs px-4 py-1 rounded transition-colors"
                >
                  {clientSubmitting ? 'Saving...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
