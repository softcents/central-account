'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import {
  ShoppingBag,
  Server,
  Globe,
  PhoneCall,
  Phone,
  Cpu,
  HardDrive,
  MessageSquare,
  Mic,
  Radio,
  Sparkles,
  Layers,
  Search,
  Check,
  ArrowRight,
  CreditCard,
  Trash2,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  User,
  Mail,
  Plus,
  Grid,
  List,
  RefreshCw,
  AlertCircle,
  Share2,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';
import { useActiveClient } from '@/hooks/useActiveClient';

interface CartItem {
  id: string;
  name: string;
  groupName: string;
  price: number;
  setupFee: number;
  cycle: string;
  displayPrice: string;
}

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

function getCategoryIcon(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('cloud pbx') || lower.includes('pbx')) return PhoneCall;
  if (lower.includes('bulk sms') || lower.includes('masking') || lower.includes('sms')) return MessageSquare;
  if (lower.includes('voice')) return Mic;
  if (lower.includes('vip')) return Sparkles;
  if (lower.includes('ip phone') || lower.includes('number')) return Phone;
  if (lower.includes('vps')) return Cpu;
  if (lower.includes('dedicated')) return HardDrive;
  if (lower.includes('bdix')) return Globe;
  if (lower.includes('hosting')) return Server;
  if (lower.includes('location') || lower.includes('tower')) return Radio;
  return Layers;
}

function getProductPricing(p: any) {
  const m = parseFloat(p.monthly || '-1');
  const a = parseFloat(p.annually || '-1');
  const q = parseFloat(p.quarterly || '-1');
  const s = parseFloat(p.semiannually || '-1');
  const setup = parseFloat(p.msetupfee || '0');

  if (p.paytype === 'free') {
    return {
      displayPrice: 'Free',
      priceVal: 0,
      cycle: '',
      setupFee: 0,
      isFree: true,
    };
  }

  if (p.paytype === 'onetime') {
    const priceVal = m >= 0 ? m : 0;
    return {
      displayPrice: `৳${priceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`,
      priceVal,
      cycle: 'One Time',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  }

  // recurring
  if (m >= 0) {
    if (m === 0) {
      return {
        displayPrice: 'Free',
        priceVal: 0,
        cycle: 'First Month Free',
        setupFee: setup > 0 ? setup : 0,
        isFree: true,
      };
    }
    return {
      displayPrice: `৳${m.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`,
      priceVal: m,
      cycle: 'Monthly',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  } else if (a >= 0) {
    return {
      displayPrice: `৳${a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`,
      priceVal: a,
      cycle: 'Annually',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  } else if (q >= 0) {
    return {
      displayPrice: `৳${q.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`,
      priceVal: q,
      cycle: 'Quarterly',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  } else if (s >= 0) {
    return {
      displayPrice: `৳${s.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`,
      priceVal: s,
      cycle: 'Semi-Annually',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  }

  return {
    displayPrice: 'Contact Sales',
    priceVal: 0,
    cycle: '',
    setupFee: 0,
    isFree: false,
  };
}

function parseFeatures(desc?: string | null): string[] {
  if (!desc) return [];
  const clean = desc.replace(/\\n/g, '\n').replace(/\r/g, '');
  return clean
    .split('\n')
    .map((line) => decodeHtml(line).trim())
    .filter((line) => line.length > 0 && !line.startsWith('http'));
}

function CartInner() {
  const searchParams = useSearchParams();
  const rawGid = searchParams.get('gid');
  const rawGroup = searchParams.get('group');
  const rawPid = searchParams.get('pid');
  const action = searchParams.get('a');
  const domainAction = searchParams.get('domain');

  const { clientId, client, impQuery, domains } = useActiveClient();

  const isRenewView = action === 'renew';
  const isTransferView = action === 'add' && domainAction === 'transfer';
  const isAddonsView = rawGid === 'addons';

  const [transferDomain, setTransferDomain] = useState('');
  const [transferEpp, setTransferEpp] = useState('');
  const [manualRenewDomain, setManualRenewDomain] = useState('');

  // Load all synced product groups & products
  const allGroups = useMemo(() => {
    const list = whmcsData.productGroups || [];
    return [...list].sort((a: any, b: any) => {
      const orderA = parseInt(a.order || '999', 10);
      const orderB = parseInt(b.order || '999', 10);
      return orderA - orderB;
    });
  }, []);

  const allProducts = useMemo(() => {
    return whmcsData.products || [];
  }, []);

  // Compute product counts per group
  const groupCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allProducts) {
      if (p.retired !== '1') {
        map[p.gid] = (map[p.gid] || 0) + 1;
      }
    }
    return map;
  }, [allProducts]);

  // Determine initial selected group
  const defaultGroup = useMemo(() => {
    if (rawGid) {
      const found = allGroups.find((g: any) => String(g.id) === String(rawGid));
      if (found) return found;
    }
    if (rawGroup) {
      const found = allGroups.find(
        (g: any) =>
          g.slug === rawGroup ||
          g.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === rawGroup.toLowerCase()
      );
      if (found) return found;
    }
    if (rawPid) {
      const p = allProducts.find((item: any) => String(item.id) === String(rawPid));
      if (p) {
        const found = allGroups.find((g: any) => String(g.id) === String(p.gid));
        if (found) return found;
      }
    }
    // Default to first non-hidden group
    return allGroups.find((g: any) => g.hidden !== '1') || allGroups[0];
  }, [allGroups, allProducts, rawGid, rawGroup, rawPid]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroup ? String(defaultGroup.id) : '2'
  );

  // When query params change, update selected group
  useEffect(() => {
    if (defaultGroup) {
      setSelectedGroupId(String(defaultGroup.id));
    }
  }, [defaultGroup]);

  const currentGroup = useMemo(() => {
    return (
      allGroups.find((g: any) => String(g.id) === String(selectedGroupId)) ||
      allGroups[0]
    );
  }, [allGroups, selectedGroupId]);

  // Filter products for currently selected group
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Reset search and pagination when changing category
  const handleGroupSelect = (gid: string) => {
    setSelectedGroupId(gid);
    setSearchTerm('');
    setPage(1);
  };

  const groupProducts = useMemo(() => {
    return allProducts.filter((p: any) => {
      if (String(p.gid) !== String(selectedGroupId)) return false;
      if (p.retired === '1') return false;
      if (!showHidden && p.product_hidden === '1') return false;
      return true;
    });
  }, [allProducts, selectedGroupId, showHidden]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return groupProducts;
    const term = searchTerm.toLowerCase().trim();
    return groupProducts.filter((p: any) => {
      const name = (p.product_name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [groupProducts, searchTerm]);

  // Paginated products for large groups
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  // Customer checkout info
  const [customerName, setCustomerName] = useState('SoftCents Customer');
  const [customerEmail, setCustomerEmail] = useState('billing@softcents.com');
  const [customerPhone, setCustomerPhone] = useState('01700000000');

  // Autofill user details from impersonation or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedImp = localStorage.getItem('ci_impersonator_backup');
    if (storedImp) {
      try {
        const parsed = JSON.parse(storedImp);
        const u = parsed.targetUser;
        if (u) {
          const name = `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.name;
          if (name) setCustomerName(name);
          if (u.email) setCustomerEmail(u.email);
          if (u.phonenumber) setCustomerPhone(u.phonenumber);
          return;
        }
      } catch {}
    }

    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        const name = u.profile?.first_name
          ? `${u.profile.first_name} ${u.profile.last_name || ''}`.trim()
          : (u.name || u.email);
        if (name) setCustomerName(name);
        if (u.email) setCustomerEmail(u.email);
        if (u.phone || u.phonenumber) setCustomerPhone(u.phone || u.phonenumber);
      } catch {}
    }
  }, []);

  const addToCart = (p: any) => {
    const pricing = getProductPricing(p);
    const item: CartItem = {
      id: String(p.id),
      name: decodeHtml(p.product_name),
      groupName: decodeHtml(currentGroup?.name || 'Services'),
      price: pricing.priceVal,
      setupFee: pricing.setupFee,
      cycle: pricing.cycle,
      displayPrice: pricing.displayPrice,
    };
    setCart((prev) => [...prev, item]);
    setCheckoutOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartSetupTotal = cart.reduce((sum, item) => sum + item.setupFee, 0);
  const cartGrandTotal = cartSubtotal + cartSetupTotal;

  const handleCheckout = async () => {
    try {
      setLoadingPay(true);
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: `ORD-${Date.now().toString().slice(-6)}`,
          amount: cartGrandTotal,
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
        }),
      });
      const data = await res.json();
      if (data.pp_url) {
        window.location.href = data.pp_url;
      } else {
        alert(data.error || 'Failed to initiate PipraPay checkout');
      }
    } catch (e: any) {
      alert(e.message || 'Payment initiation error');
    } finally {
      setLoadingPay(false);
    }
  };

  const handleAddDomainTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferDomain.trim()) return;
    const item: CartItem = {
      id: `domain-transfer-${Date.now()}`,
      name: `Domain Transfer - ${transferDomain.trim()}`,
      groupName: 'Domains',
      price: 1500,
      setupFee: 0,
      cycle: '1 Year',
      displayPrice: '৳1,500.00 BDT',
    };
    setCart((prev) => [...prev, item]);
    setCheckoutOpen(true);
  };

  const handleRenewDomain = (domainName: string) => {
    const item: CartItem = {
      id: `domain-renew-${Date.now()}`,
      name: `Domain Renewal - ${domainName}`,
      groupName: 'Domains',
      price: 1500,
      setupFee: 0,
      cycle: '1 Year',
      displayPrice: '৳1,500.00 BDT',
    };
    setCart((prev) => [...prev, item]);
    setCheckoutOpen(true);
  };

  const handleAddAddon = (addonName: string, price: number, cycle: string) => {
    const item: CartItem = {
      id: `addon-${Date.now()}`,
      name: addonName,
      groupName: 'Product Addons',
      price: price,
      setupFee: 0,
      cycle: cycle,
      displayPrice: `৳${price.toFixed(2)} BDT`,
    };
    setCart((prev) => [...prev, item]);
    setCheckoutOpen(true);
  };

  const isPhoneGroup =
    selectedGroupId === '5' ||
    selectedGroupId === '15' ||
    (currentGroup?.name || '').toLowerCase().includes('phone');

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-24">
      <ClientHeader />

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex items-center text-xs text-slate-500">
          <Link href="/clientarea" className="hover:text-[#1A4D80]">
            Portal Home
          </Link>
          <ChevronRight className="w-3 h-3 mx-2 text-slate-400" />
          <Link href="/cart" className="hover:text-[#1A4D80]">
            Shopping Cart
          </Link>
          {currentGroup && (
            <>
              <ChevronRight className="w-3 h-3 mx-2 text-slate-400" />
              <span className="font-semibold text-slate-800">
                {decodeHtml(currentGroup.name)}
              </span>
            </>
          )}
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile Category Selector (< lg) */}
        <div className="block lg:hidden mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Select Product Category</span>
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => handleGroupSelect(e.target.value)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A4D80]"
          >
            {allGroups
              .filter((g: any) => g.hidden !== '1' || String(g.id) === selectedGroupId)
              .map((grp: any) => (
                <option key={grp.id} value={grp.id}>
                  {decodeHtml(grp.name)} ({groupCounts[grp.id] || 0})
                </option>
              ))}
          </select>
        </div>

        {/* 2-Column WHMCS Twenty-One Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT SIDEBAR (Desktop lg+) */}
          <div className="hidden lg:block space-y-4">
            {/* Categories Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#1A4D80] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Categories
                  </span>
                </div>
                <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
                  {allGroups.filter((g: any) => g.hidden !== '1').length}
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                {allGroups
                  .filter((g: any) => g.hidden !== '1' || String(g.id) === selectedGroupId)
                  .map((grp: any) => {
                    const Icon = getCategoryIcon(grp.name);
                    const active = String(selectedGroupId) === String(grp.id);
                    const count = groupCounts[grp.id] || 0;
                    return (
                      <button
                        key={grp.id}
                        onClick={() => handleGroupSelect(String(grp.id))}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors ${
                          active
                            ? 'bg-[#1A4D80] text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <Icon
                            className={`w-4 h-4 flex-shrink-0 ${
                              active ? 'text-white' : 'text-slate-500'
                            }`}
                          />
                          <span className="truncate">{decodeHtml(grp.name)}</span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            active
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-100 text-slate-800 px-4 py-2.5 border-b border-slate-200 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-xs">Actions</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <Link
                  href="/domainchecker"
                  className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50 space-x-2"
                >
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Register a New Domain</span>
                </Link>
                <Link
                  href="/domainchecker?action=transfer"
                  className="flex items-center px-4 py-2.5 text-slate-700 hover:bg-slate-50 space-x-2"
                >
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span>Transfer in a Domain</span>
                </Link>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full text-left flex items-center justify-between px-4 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4 text-[#1A4D80]" />
                    <span>View Cart</span>
                  </div>
                  {cart.length > 0 && (
                    <span className="bg-[#1A4D80] text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* MAIN PRODUCT LISTING AREA */}
          <div className="lg:col-span-3 space-y-4">
            {isRenewView ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
                        <RefreshCw className="w-6 h-6 text-teal-600" />
                        <span>Renew Domains</span>
                      </h1>
                      <p className="text-xs text-slate-600 mt-1">
                        Extend your domain registration for an additional year to prevent service interruption.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                    Domains Eligible for Renewal ({domains.length})
                  </div>
                  {domains.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No registered domains found on your account.</p>
                      <p className="mt-1">Enter a domain below to renew or register a new domain.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {domains.map((d: any) => (
                        <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                          <div>
                            <div className="font-bold text-sm text-[#1A4D80]">{d.domain}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Expires: <span className="font-mono font-medium text-slate-800">{d.expirydate || '-'}</span> &bull; Status: <span className="text-emerald-700 font-semibold">{d.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-900 font-mono text-sm">৳1,500.00 BDT / 1 Yr</span>
                            <button
                              onClick={() => handleRenewDomain(d.domain)}
                              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded text-xs font-bold transition-colors flex items-center space-x-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              <span>Renew Now</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Renew Any Other Domain</h3>
                  <form onSubmit={(e) => { e.preventDefault(); if (manualRenewDomain.trim()) handleRenewDomain(manualRenewDomain.trim()); }} className="flex flex-col sm:flex-row gap-2 max-w-lg">
                    <input
                      type="text"
                      value={manualRenewDomain}
                      onChange={(e) => setManualRenewDomain(e.target.value)}
                      placeholder="Enter domain name (e.g. mycompany.com)..."
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
                    />
                    <button
                      type="submit"
                      className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded text-xs font-bold transition-colors"
                    >
                      Renew Domain
                    </button>
                  </form>
                </div>
              </div>
            ) : isTransferView ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
                        <Share2 className="w-6 h-6 text-cyan-600" />
                        <span>Transfer Domains to Us</span>
                      </h1>
                      <p className="text-xs text-slate-600 mt-1">
                        Transfer your active domain name from your current registrar to SoftCents Systems. Includes 1-year extension.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <form onSubmit={handleAddDomainTransfer} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Domain Name to Transfer
                      </label>
                      <input
                        type="text"
                        required
                        value={transferDomain}
                        onChange={(e) => setTransferDomain(e.target.value)}
                        placeholder="example.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Enter your domain with extension, without www or http.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        EPP / Authorization Code
                      </label>
                      <input
                        type="text"
                        required
                        value={transferEpp}
                        onChange={(e) => setTransferEpp(e.target.value)}
                        placeholder="Obtain this from your current registrar"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded font-mono focus:outline-none focus:border-[#1A4D80]"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Unlock your domain at your current registrar before submitting.</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Transfer Fee (Includes 1 Yr Extension):</span>
                        <span className="font-mono text-emerald-700">৳1,500.00 BDT</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Free DNS Management &amp; Email Forwarding:</span>
                        <span className="text-emerald-600 font-bold">Included Free</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-2.5 rounded text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-1"
                    >
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      <span>Add Transfer to Cart &rarr;</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : isAddonsView ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
                        <Layers className="w-6 h-6 text-indigo-600" />
                        <span>Product Addons</span>
                      </h1>
                      <p className="text-xs text-slate-600 mt-1">
                        Enhance your hosting, Cloud PBX, and server performance with enterprise service addons.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Dedicated IPv4 Address</h3>
                      <p className="text-xs text-slate-500 mt-1">Dedicated clean IP address for private SSL, mail reputation, and BDIX peering routing.</p>
                      <div className="mt-4 font-mono font-bold text-lg text-[#1A4D80]">৳300.00 BDT <span className="text-xs text-slate-500 font-normal">/ Monthly</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('Dedicated IPv4 Address', 300, 'Monthly')}
                      className="mt-4 bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">SpamExperts Email Security</h3>
                      <p className="text-xs text-slate-500 mt-1">99.98% anti-spam filtering, inbound/outbound protection, and automated virus quarantine.</p>
                      <div className="mt-4 font-mono font-bold text-lg text-[#1A4D80]">৳500.00 BDT <span className="text-xs text-slate-500 font-normal">/ Monthly</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('SpamExperts Email Security', 500, 'Monthly')}
                      className="mt-4 bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Wildcard SSL Certificate</h3>
                      <p className="text-xs text-slate-500 mt-1">Secure unlimited subdomains under your primary domain with 256-bit encryption & warranty.</p>
                      <div className="mt-4 font-mono font-bold text-lg text-[#1A4D80]">৳2,500.00 BDT <span className="text-xs text-slate-500 font-normal">/ Annually</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('Wildcard SSL Certificate', 2500, 'Annually')}
                      className="mt-4 bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Acronis Cloud Daily Backup (50GB)</h3>
                      <p className="text-xs text-slate-500 mt-1">Automated daily snapshot backups with 1-click restore for MySQL databases and website files.</p>
                      <div className="mt-4 font-mono font-bold text-lg text-[#1A4D80]">৳400.00 BDT <span className="text-xs text-slate-500 font-normal">/ Monthly</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('Acronis Cloud Daily Backup (50GB)', 400, 'Monthly')}
                      className="mt-4 bg-[#1A4D80] hover:bg-[#143d66] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* Category Header Banner */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {decodeHtml(currentGroup?.headline || currentGroup?.name)}
                  </h1>
                  {currentGroup?.tagline && (
                    <p className="text-xs text-slate-600 mt-1">
                      {decodeHtml(currentGroup.tagline)}
                    </p>
                  )}
                </div>

                {/* Number of products badge */}
                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 font-medium">
                    {filteredProducts.length} Product
                    {filteredProducts.length !== 1 ? 's' : ''} Available
                  </span>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder={
                      isPhoneGroup
                        ? 'Search number (e.g. 09644, 1305)...'
                        : 'Search by product name or feature...'
                    }
                    className="w-full text-xs pl-9 pr-8 py-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#1A4D80]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* View Mode Toggle for phone numbers */}
                {isPhoneGroup && (
                  <div className="flex items-center space-x-1 border border-slate-200 rounded p-0.5 bg-slate-50 self-end sm:self-auto">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded text-xs ${
                        viewMode === 'grid'
                          ? 'bg-white shadow-xs text-[#1A4D80] font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Card Grid View"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`p-1.5 rounded text-xs ${
                        viewMode === 'compact'
                          ? 'bg-white shadow-xs text-[#1A4D80] font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Compact List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">
                  No products found in this category
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchTerm
                    ? `No products matched '${searchTerm}'. Try clearing the search filter.`
                    : 'There are currently no active public products listed in this group.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-[#1A4D80] font-bold hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}

            {/* Compact List View (Used primarily for Phone Numbers) */}
            {filteredProducts.length > 0 && isPhoneGroup && viewMode === 'compact' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {paginatedProducts.map((p: any) => {
                  const pricing = getProductPricing(p);
                  const inCart = cart.some((item) => item.id === String(p.id));
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 hover:border-[#1A4D80] transition-colors shadow-xs flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm tracking-wide truncate">
                          {decodeHtml(p.product_name)}
                        </div>
                        <div className="text-[11px] text-[#1A4D80] font-semibold">
                          {pricing.displayPrice}
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(p)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex-shrink-0 flex items-center space-x-1 ${
                          inCart
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#1A4D80] hover:bg-[#143d66] text-white'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <span>Select</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standard Product Card Grid */}
            {filteredProducts.length > 0 && (!isPhoneGroup || viewMode === 'grid') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProducts.map((p: any) => {
                  const pricing = getProductPricing(p);
                  const features = parseFeatures(p.description);
                  const inCart = cart.some((item) => item.id === String(p.id));
                  const isTop = p.product_order === '0' || p.product_order === '1';

                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-[#1A4D80] transition-all flex flex-col justify-between relative group"
                    >
                      <div>
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                            {decodeHtml(p.product_name)}
                          </h3>
                        </div>

                        {/* Pricing Block */}
                        <div className="my-3 pb-3 border-b border-slate-100">
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-[#1A4D80] font-mono">
                              {pricing.isFree ? 'Free' : pricing.displayPrice.split(' ')[0]}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {pricing.isFree
                                ? ''
                                : pricing.cycle
                                ? `/ ${pricing.cycle}`
                                : 'BDT'}
                            </span>
                          </div>

                          {pricing.setupFee > 0 && (
                            <div className="text-[11px] text-amber-600 font-semibold mt-1">
                              + ৳{pricing.setupFee.toFixed(2)} Setup Fee
                            </div>
                          )}
                        </div>

                        {/* Feature List */}
                        {features.length > 0 && (
                          <div className="space-y-2 py-2 text-xs text-slate-700">
                            {features.slice(0, 6).map((feat, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <span className="leading-tight">{feat}</span>
                              </div>
                            ))}
                            {features.length > 6 && (
                              <div className="text-[11px] text-slate-500 pt-1 font-medium italic">
                                + {features.length - 6} more included features
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Order Button */}
                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <button
                          onClick={() => addToCart(p)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 ${
                            inCart
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#1A4D80] hover:bg-[#143d66] text-white'
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Cart</span>
                            </>
                          ) : (
                            <>
                              <span>Order Now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs text-slate-600">
                <div>
                  Showing {(page - 1) * pageSize + 1} -{' '}
                  {Math.min(page * pageSize, filteredProducts.length)} of{' '}
                  {filteredProducts.length} products
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono font-bold text-slate-800">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1.5 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        {/* FLOATING CART BAR (Always visible when items in cart) */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-300 shadow-2xl p-3 sm:p-4">
            <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold font-mono text-sm">
                  {cart.length}
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Order Total ({cart.length} item{cart.length > 1 ? 's' : ''}):
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#1A4D80]">
                    ৳{cartGrandTotal.toFixed(2)} BDT
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 sm:px-6 py-2.5 rounded font-bold text-xs transition-colors shadow-sm flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Review & Complete Order \u2192</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW & CHECKOUT MODAL / DRAWER */}
        {checkoutOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-[#1A4D80] text-white p-4 sm:p-5 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5" />
                  <h2 className="font-bold text-sm sm:text-base">
                    Shopping Cart Checkout ({cart.length} item{cart.length > 1 ? 's' : ''})
                  </h2>
                </div>
                <button
                  onClick={() => setCheckoutOpen(false)}
                  className="text-white/80 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {/* Cart Items List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Selected Items
                  </h4>
                  {cart.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 border border-dashed rounded">
                      Your cart is empty. Please select a product above.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {cart.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between text-xs hover:bg-slate-50"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.groupName} • {item.cycle || 'Standard'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900">
                                ৳{item.price.toFixed(2)}
                              </div>
                              {item.setupFee > 0 && (
                                <div className="text-[10px] text-amber-600">
                                  + ৳{item.setupFee.toFixed(2)} setup
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing Summary */}
                {cart.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-mono">৳{cartSubtotal.toFixed(2)} BDT</span>
                    </div>
                    {cartSetupTotal > 0 && (
                      <div className="flex justify-between text-amber-700">
                        <span>Setup Fees</span>
                        <span className="font-mono">৳{cartSetupTotal.toFixed(2)} BDT</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                      <span>Total Due Today</span>
                      <span className="font-mono text-[#1A4D80]">
                        ৳{cartGrandTotal.toFixed(2)} BDT
                      </span>
                    </div>
                  </div>
                )}

                {/* Customer Information */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1A4D80] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1A4D80] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-medium mb-1">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1A4D80] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Gateway: PipraPay */}
                <div className="bg-[#f0f8ff] border border-[#b8daff] rounded p-3 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-[#1A4D80]" />
                      <span>PipraPay Payment Gateway</span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      Instant automatic activation via bKash, Nagad, Rocket, or Bank Cards.
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#1A4D80] text-white px-2 py-0.5 rounded font-bold uppercase">
                    Auto Active
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || loadingPay}
                    className="bg-[#5cb85c] hover:bg-[#4cae4c] disabled:opacity-50 text-white px-6 py-2.5 rounded font-bold text-xs transition-colors shadow-sm flex items-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {loadingPay
                        ? 'Connecting to PipraPay...'
                        : `Pay ৳${cartGrandTotal.toFixed(2)} BDT \u2192`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ShoppingCartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-xs text-slate-500 font-sans">
          Loading Shopping Cart...
        </div>
      }
    >
      <CartInner />
    </Suspense>
  );
}
