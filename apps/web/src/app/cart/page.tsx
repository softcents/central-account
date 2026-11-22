'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Sparkles,
  Layers,
  Search,
  Check,
  ArrowRight,
  CreditCard,
  Trash2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Share2,
  Plus,
  Grid,
  List,
  Lock,
  Tag,
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
    const priceVal = m > 0 ? m : (setup > 0 ? setup : 0);
    const extraSetup = m > 0 && setup > 0 ? setup : 0;
    return {
      displayPrice: `৳${priceVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`,
      priceVal,
      cycle: 'One Time',
      setupFee: extraSetup,
      isFree: priceVal === 0 && extraSetup === 0,
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
  const router = useRouter();
  const rawGid = searchParams.get('gid');
  const rawGroup = searchParams.get('group');
  const rawPid = searchParams.get('pid');
  const action = searchParams.get('a');
  const domainAction = searchParams.get('domain');

  const { clientId, client, impQuery, domains } = useActiveClient();

  const isRenewView = action === 'renew';
  const isTransferView = action === 'add' && domainAction === 'transfer';
  const isAddonsView = rawGid === 'addons';
  const isViewCartParam = action === 'view' || action === 'checkout';

  const [transferDomain, setTransferDomain] = useState('');
  const [transferEpp, setTransferEpp] = useState('');
  const [manualRenewDomain, setManualRenewDomain] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

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

  // Compute product counts per group (counting non-hidden & non-retired)
  const groupCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allProducts) {
      if (p.retired !== '1' && p.product_hidden !== '1') {
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
    return allGroups.find((g: any) => g.hidden !== '1') || allGroups[0];
  }, [allGroups, allProducts, rawGid, rawGroup, rawPid]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroup ? String(defaultGroup.id) : '2'
  );

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
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const handleGroupSelect = (gid: string) => {
    setSelectedGroupId(gid);
    setSearchTerm('');
    setPage(1);
    setViewCartView(false);
  };

  const groupProducts = useMemo(() => {
    return allProducts.filter((p: any) => {
      if (String(p.gid) !== String(selectedGroupId)) return false;
      if (p.retired === '1') return false;
      if (p.product_hidden === '1' && String(p.id) !== String(rawPid)) return false;
      return true;
    });
  }, [allProducts, selectedGroupId, rawPid]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return groupProducts;
    const term = searchTerm.toLowerCase().trim();
    return groupProducts.filter((p: any) => {
      const name = (p.product_name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [groupProducts, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewCartView, setViewCartView] = useState<boolean>(isViewCartParam);
  const [loadingPay, setLoadingPay] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'piprapay' | 'uddoktapay' | 'reseller' | 'bank'>('piprapay');

  // Customer checkout info
  const [customerName, setCustomerName] = useState('SoftCents Customer');
  const [customerEmail, setCustomerEmail] = useState('billing@softcents.com');
  const [customerPhone, setCustomerPhone] = useState('01700000000');

  // Autofill user details
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

  // If a direct ?a=add&pid=X is used, add the product automatically
  useEffect(() => {
    if (rawPid && allProducts.length > 0 && cart.length === 0) {
      const match = allProducts.find((p: any) => String(p.id) === String(rawPid));
      if (match) {
        const pricing = getProductPricing(match);
        setCart([
          {
            id: String(match.id),
            name: decodeHtml(match.product_name),
            groupName: decodeHtml(match.group_name || currentGroup?.name || 'Services'),
            price: pricing.priceVal,
            setupFee: pricing.setupFee,
            cycle: pricing.cycle,
            displayPrice: pricing.displayPrice,
          },
        ]);
        setViewCartView(true);
      }
    }
  }, [rawPid, allProducts]);

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
    setViewCartView(true);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartSetupTotal = cart.reduce((sum, item) => sum + item.setupFee, 0);
  const cartGrandTotal = cartSubtotal + cartSetupTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setLoadingPay(true);
      const primaryItem = cart[0];
      const res = await fetch('/api/whmcs/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          clientId: client?.id || clientId || '177',
          productId: Number(String(primaryItem.id).replace(/[^0-9]/g, '')) || 1,
          billingCycle: primaryItem.cycle || 'Monthly',
          domain: `${customerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sc'}-pbx.bdpbx.com`,
          paymentMethod: selectedGateway,
          systemUrl: typeof window !== 'undefined' ? window.location.origin : 'https://account.softcents.com',
          returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/viewinvoice?payment=success` : 'https://account.softcents.com/viewinvoice?payment=success',
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data.invoiceId) {
        window.location.href = `/viewinvoice?id=${data.invoiceId}`;
      } else {
        alert(data.message || 'Order placed successfully!');
        window.location.href = '/clientarea/services';
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
    setViewCartView(true);
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
    setViewCartView(true);
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
    setViewCartView(true);
  };

  const isPhoneGroup =
    selectedGroupId === '5' ||
    selectedGroupId === '15' ||
    (currentGroup?.name || '').toLowerCase().includes('phone');

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans pb-24" id="order-standard_cart">
      <ClientHeader />

      {/* WHMCS Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-4 py-2.5 flex items-center text-xs text-slate-500">
          <Link href="/clientarea" className="hover:text-[#1A4D80]">
            Portal Home
          </Link>
          <ChevronRight className="w-3 h-3 mx-1.5 text-slate-400" />
          <Link href="/cart" onClick={() => setViewCartView(false)} className="hover:text-[#1A4D80]">
            Store
          </Link>
          <ChevronRight className="w-3 h-3 mx-1.5 text-slate-400" />
          {viewCartView ? (
            <span className="font-semibold text-slate-800">Review &amp; Checkout</span>
          ) : (
            <span className="font-semibold text-slate-800">
              {decodeHtml(currentGroup?.name)}
            </span>
          )}
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* WHMCS standard_cart layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: Categories & Actions (WHMCS standard_cart) */}
          {/* ========================================================= */}
          <div className="cart-sidebar space-y-4">
            {/* WHMCS Categories Card */}
            <div className="panel card card-sidebar bg-white border border-[#ddd] rounded-sm overflow-hidden shadow-2xs">
              <div className="panel-heading card-header bg-[#1A4D80] text-white px-4 py-3 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Categories</span>
                </div>
                <span className="text-[11px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">
                  {allGroups.filter((g: any) => g.hidden !== '1').length}
                </span>
              </div>

              <div className="list-group divide-y divide-[#eee] max-h-[640px] overflow-y-auto text-xs">
                {allGroups
                  .filter((g: any) => g.hidden !== '1' || String(g.id) === selectedGroupId)
                  .map((grp: any) => {
                    const Icon = getCategoryIcon(grp.name);
                    const active = !viewCartView && String(selectedGroupId) === String(grp.id);
                    const count = groupCounts[grp.id] || 0;
                    return (
                      <button
                        key={grp.id}
                        onClick={() => handleGroupSelect(String(grp.id))}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                          active
                            ? 'bg-[#0d6efd] text-white font-bold'
                            : 'text-[#333] hover:bg-[#f8f9fa]'
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

            {/* WHMCS Actions Card */}
            <div className="panel card card-sidebar bg-white border border-[#ddd] rounded-sm overflow-hidden shadow-2xs">
              <div className="panel-heading card-header bg-[#f8f8f8] text-[#333] px-4 py-2.5 border-b border-[#ddd] flex items-center space-x-2 font-bold text-xs">
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Actions</span>
              </div>
              <div className="list-group divide-y divide-[#eee] text-xs">
                <button
                  onClick={() => setViewCartView(true)}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 transition-colors ${
                    viewCartView
                      ? 'bg-[#0d6efd] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Cart</span>
                  </div>
                  {cart.length > 0 && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                        viewCartView ? 'bg-white text-[#0d6efd]' : 'bg-[#1A4D80] text-white'
                      }`}
                    >
                      {cart.length}
                    </span>
                  )}
                </button>
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
              </div>
            </div>

            {/* Currency Card */}
            <div className="panel card card-sidebar bg-white border border-[#ddd] rounded-sm p-3 shadow-2xs text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Currency</span>
              <span className="font-bold text-[#1A4D80] bg-slate-100 px-2 py-0.5 rounded">
                BDT (৳)
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT / MAIN CONTENT AREA                                */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 cart-body">
            {/* ========================================================= */}
            {/* VIEW 1: FULL WHMCS VIEW CART / CHECKOUT (cart.php?a=view) */}
            {/* ========================================================= */}
            {viewCartView ? (
              <div className="space-y-6">
                {/* WHMCS Header Lined */}
                <div className="header-lined border-b border-[#ddd] pb-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#333]">
                    Review &amp; Checkout
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Review your order details and select your preferred payment gateway.
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="bg-white border border-[#ddd] rounded-sm p-12 text-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-700">
                      Your Shopping Cart is Empty
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      You do not have any items in your shopping cart. Select a product group from the categories on the left to add services.
                    </p>
                    <button
                      onClick={() => setViewCartView(false)}
                      className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded text-xs font-bold transition-colors inline-block"
                    >
                      &larr; Browse Categories
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left: Items list & Customer info & Payment method (2 cols) */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* Products Table Card */}
                      <div className="bg-white border border-[#ddd] rounded-sm shadow-2xs overflow-hidden">
                        <div className="bg-[#f8f8f8] border-b border-[#ddd] px-4 py-2.5 font-bold text-xs text-[#333] flex items-center justify-between">
                          <span>Product / Options</span>
                          <span>Price / Cycle</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {cart.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-4 flex items-center justify-between text-xs hover:bg-slate-50"
                            >
                              <div className="min-w-0 pr-4">
                                <div className="font-bold text-slate-900 text-sm">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Category: <span className="font-semibold text-slate-700">{item.groupName}</span> &bull; Cycle: <span className="text-[#1A4D80] font-semibold">{item.cycle || 'Standard'}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 shrink-0">
                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-900 text-sm">
                                    ৳{item.price.toFixed(2)} BDT
                                  </div>
                                  {item.setupFee > 0 && (
                                    <div className="text-[10px] text-amber-600 font-semibold">
                                      + ৳{item.setupFee.toFixed(2)} setup
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => removeFromCart(idx)}
                                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded hover:bg-rose-50 transition-colors"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Promo Code Box */}
                      <div className="bg-white border border-[#ddd] rounded-sm p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 shrink-0">
                          <Tag className="w-4 h-4 text-[#1A4D80]" />
                          <span>Promo Code:</span>
                        </div>
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Enter promotional coupon code..."
                          className="flex-1 w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80] uppercase font-mono"
                        />
                        <button
                          onClick={() => {
                            if (promoCode.trim()) {
                              setPromoApplied(true);
                              alert(`Promo code '${promoCode.trim().toUpperCase()}' applied successfully!`);
                            }
                          }}
                          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2 rounded text-xs font-bold transition-colors"
                        >
                          Validate Code
                        </button>
                      </div>

                      {/* Customer Information (WHMCS Billing Details) */}
                      <div className="bg-white border border-[#ddd] rounded-sm p-5 shadow-2xs space-y-4">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-[#333] border-b border-slate-100 pb-2">
                          Billing Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-600 font-medium mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1A4D80] focus:outline-none text-slate-800"
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
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1A4D80] focus:outline-none text-slate-800"
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
                              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#1A4D80] focus:outline-none text-slate-800 font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Selector (WHMCS Gateways) */}
                      <div className="bg-white border border-[#ddd] rounded-sm p-5 shadow-2xs space-y-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-[#333] border-b border-slate-100 pb-2">
                          Payment Method
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                              selectedGateway === 'piprapay'
                                ? 'border-[#1A4D80] bg-sky-50/70 ring-1 ring-[#1A4D80]'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="piprapay"
                                checked={selectedGateway === 'piprapay'}
                                onChange={() => setSelectedGateway('piprapay')}
                                className="text-[#1A4D80]"
                              />
                              <div>
                                <div className="font-bold text-slate-900">
                                  PipraPay (bKash / Nagad / Cards)
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Instant automated activation
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                              Auto
                            </span>
                          </label>

                          <label
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                              selectedGateway === 'uddoktapay'
                                ? 'border-[#1A4D80] bg-sky-50/70 ring-1 ring-[#1A4D80]'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="uddoktapay"
                                checked={selectedGateway === 'uddoktapay'}
                                onChange={() => setSelectedGateway('uddoktapay')}
                                className="text-[#1A4D80]"
                              />
                              <div>
                                <div className="font-bold text-slate-900">UddoktaPay</div>
                                <div className="text-[11px] text-slate-500">
                                  bKash, Nagad, Rocket
                                </div>
                              </div>
                            </div>
                          </label>

                          <label
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                              selectedGateway === 'reseller'
                                ? 'border-[#1A4D80] bg-sky-50/70 ring-1 ring-[#1A4D80]'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="reseller"
                                checked={selectedGateway === 'reseller'}
                                onChange={() => setSelectedGateway('reseller')}
                                className="text-[#1A4D80]"
                              />
                              <div>
                                <div className="font-bold text-slate-900">
                                  Account Credit Balance
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Deduct directly from wallet
                                </div>
                              </div>
                            </div>
                          </label>

                          <label
                            className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-colors ${
                              selectedGateway === 'bank'
                                ? 'border-[#1A4D80] bg-sky-50/70 ring-1 ring-[#1A4D80]'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <input
                                type="radio"
                                name="paymentGateway"
                                value="bank"
                                checked={selectedGateway === 'bank'}
                                onChange={() => setSelectedGateway('bank')}
                                className="text-[#1A4D80]"
                              />
                              <div>
                                <div className="font-bold text-slate-900">Bank Transfer</div>
                                <div className="text-[11px] text-slate-500">
                                  City Bank / BRAC Bank (Manual)
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right: WHMCS Order Summary Sticky Card (1 col) */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="order-summary bg-white border border-[#ddd] rounded-sm overflow-hidden shadow-sm sticky top-20">
                        {/* Header */}
                        <div className="bg-[#495057] text-white px-4 py-3 font-bold text-sm tracking-wide flex items-center justify-between">
                          <span>Order Summary</span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">
                            {cart.length} item{cart.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Breakdown */}
                        <div className="p-4 space-y-3 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-mono font-semibold text-slate-800">
                              ৳{cartSubtotal.toFixed(2)} BDT
                            </span>
                          </div>

                          {cartSetupTotal > 0 && (
                            <div className="flex justify-between text-amber-700">
                              <span>Setup Fees</span>
                              <span className="font-mono font-semibold">
                                ৳{cartSetupTotal.toFixed(2)} BDT
                              </span>
                            </div>
                          )}

                          {promoApplied && (
                            <div className="flex justify-between text-emerald-700">
                              <span>Promo Discount (10%)</span>
                              <span className="font-mono font-semibold">
                                - ৳{(cartSubtotal * 0.1).toFixed(2)} BDT
                              </span>
                            </div>
                          )}

                          {/* WHMCS Total Due Today Box */}
                          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center my-3">
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">
                              Total Due Today
                            </div>
                            <div className="text-xl sm:text-2xl font-bold font-mono text-[#1A4D80]">
                              ৳
                              {(
                                cartGrandTotal - (promoApplied ? cartSubtotal * 0.1 : 0)
                              ).toFixed(2)}{' '}
                              BDT
                            </div>
                          </div>

                          {/* Checkout Button */}
                          <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || loadingPay}
                            className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] disabled:opacity-50 text-white py-3 rounded text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-2 tracking-wide uppercase"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {loadingPay ? 'Processing Order...' : 'Checkout \u2192'}
                            </span>
                          </button>

                          <div className="text-center pt-2">
                            <button
                              onClick={() => setViewCartView(false)}
                              className="text-xs text-[#1A4D80] hover:underline font-medium"
                            >
                              &larr; Continue Shopping
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isRenewView ? (
              /* ========================================================= */
              /* VIEW 2: DOMAIN RENEWALS (WHMCS)                          */
              /* ========================================================= */
              <div className="space-y-4">
                <div className="header-lined border-b border-[#ddd] pb-3 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#333]">
                    Renew Domains
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Extend your domain registration for an additional year to prevent service interruption.
                  </p>
                </div>

                <div className="bg-white border border-[#ddd] rounded-sm shadow-2xs overflow-hidden">
                  <div className="p-3 bg-[#f8f8f8] border-b border-[#ddd] font-bold text-xs text-[#333]">
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

                <div className="bg-white border border-[#ddd] rounded-sm p-4 shadow-2xs space-y-3">
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
              /* ========================================================= */
              /* VIEW 3: DOMAIN TRANSFER (WHMCS)                          */
              /* ========================================================= */
              <div className="space-y-4">
                <div className="header-lined border-b border-[#ddd] pb-3 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#333]">
                    Transfer Domains to Us
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Transfer your active domain name from your current registrar to SoftCents Systems. Includes 1-year extension.
                  </p>
                </div>

                <div className="bg-white border border-[#ddd] rounded-sm p-6 shadow-2xs">
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
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-xs space-y-1.5">
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
                      className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2.5 rounded text-xs font-bold transition-colors shadow-2xs flex items-center justify-center space-x-1"
                    >
                      <ShoppingBag className="w-4 h-4 mr-1" />
                      <span>Add Transfer to Cart &rarr;</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : isAddonsView ? (
              /* ========================================================= */
              /* VIEW 4: PRODUCT ADDONS (WHMCS)                           */
              /* ========================================================= */
              <div className="space-y-4">
                <div className="header-lined border-b border-[#ddd] pb-3 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#333]">
                    Product Addons
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Enhance your hosting, Cloud PBX, and server performance with enterprise service addons.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[#ddd] rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Dedicated IPv4 Address</h3>
                      <p className="text-xs text-slate-500 mt-1">Dedicated clean IP address for private SSL, mail reputation, and BDIX peering routing.</p>
                      <div className="mt-3 font-mono font-bold text-base text-[#1A4D80]">৳300.00 BDT <span className="text-xs text-slate-500 font-normal">/ Monthly</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('Dedicated IPv4 Address', 300, 'Monthly')}
                      className="mt-4 bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#ddd] rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">SpamExperts Email Security</h3>
                      <p className="text-xs text-slate-500 mt-1">99.98% anti-spam filtering, inbound/outbound protection, and automated virus quarantine.</p>
                      <div className="mt-3 font-mono font-bold text-base text-[#1A4D80]">৳500.00 BDT <span className="text-xs text-slate-500 font-normal">/ Monthly</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('SpamExperts Email Security', 500, 'Monthly')}
                      className="mt-4 bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#ddd] rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Wildcard SSL Certificate</h3>
                      <p className="text-xs text-slate-500 mt-1">Secure unlimited subdomains under your primary domain with 256-bit encryption & warranty.</p>
                      <div className="mt-3 font-mono font-bold text-base text-[#1A4D80]">৳2,500.00 BDT <span className="text-xs text-slate-500 font-normal">/ Annually</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('Wildcard SSL Certificate', 2500, 'Annually')}
                      className="mt-4 bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#ddd] rounded-sm p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Acronis Cloud Daily Backup (50GB)</h3>
                      <p className="text-xs text-slate-500 mt-1">Automated daily snapshot backups with 1-click restore for MySQL databases and website files.</p>
                      <div className="mt-3 font-mono font-bold text-base text-[#1A4D80]">৳400.00 BDT <span className="text-xs text-slate-500 font-normal">/ Monthly</span></div>
                    </div>
                    <button
                      onClick={() => handleAddAddon('Acronis Cloud Daily Backup (50GB)', 400, 'Monthly')}
                      className="mt-4 bg-[#5cb85c] hover:bg-[#4cae4c] text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                      Order Addon &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================= */
              /* VIEW 5: WHMCS STANDARD CART PRODUCT LISTING (col-md-6)   */
              /* ========================================================= */
              <div className="space-y-4">
                {/* WHMCS Header Lined */}
                <div className="header-lined border-b border-[#ddd] pb-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#333]">
                    {decodeHtml(currentGroup?.headline || currentGroup?.name)}
                  </h1>
                  {currentGroup?.tagline && (
                    <p className="text-xs text-slate-500 mt-1">
                      {decodeHtml(currentGroup.tagline)}
                    </p>
                  )}
                </div>

                {/* Mobile Category Dropdown (< lg) */}
                <div className="block lg:hidden bg-white border border-[#ddd] rounded-sm p-3 shadow-2xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#1A4D80]" />
                    <span>Select Product Category</span>
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleGroupSelect(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 focus:outline-none"
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

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          ? 'Search phone number (e.g. 09617, 777)...'
                          : 'Search by product name or feature...'
                      }
                      className="w-full text-xs pl-9 pr-8 py-2 rounded border border-slate-300 bg-white focus:outline-none focus:border-[#1A4D80]"
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

                  {isPhoneGroup && (
                    <div className="flex items-center space-x-1 border border-slate-300 rounded p-0.5 bg-white self-end sm:self-auto">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded text-xs ${
                          viewMode === 'grid'
                            ? 'bg-[#1A4D80] text-white font-bold'
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
                            ? 'bg-[#1A4D80] text-white font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Compact List View"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                  <div className="bg-white border border-[#ddd] rounded-sm p-10 text-center space-y-3">
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

                {/* Compact List View (Used optionally for phone numbers) */}
                {filteredProducts.length > 0 && isPhoneGroup && viewMode === 'compact' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {paginatedProducts.map((p: any) => {
                      const pricing = getProductPricing(p);
                      const inCart = cart.some((item) => item.id === String(p.id));
                      return (
                        <div
                          key={p.id}
                          className="bg-white border border-[#ddd] rounded-sm p-3 hover:border-[#1A4D80] transition-colors shadow-2xs flex items-center justify-between"
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
                                : 'bg-[#5cb85c] hover:bg-[#4cae4c] text-white'
                            }`}
                          >
                            <ShoppingBag className="w-3 h-3 mr-1" />
                            <span>{inCart ? 'Added' : 'Select'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ========================================================= */}
                {/* AUTHENTIC WHMCS standard_cart 2-COLUMN PRODUCT GRID       */}
                {/* ========================================================= */}
                {filteredProducts.length > 0 && (!isPhoneGroup || viewMode === 'grid') && (
                  <div className="products grid grid-cols-1 md:grid-cols-2 gap-5" id="products">
                    {paginatedProducts.map((p: any) => {
                      const pricing = getProductPricing(p);
                      const features = parseFeatures(p.description);
                      const inCart = cart.some((item) => item.id === String(p.id));

                      return (
                        <div
                          key={p.id}
                          id={`product${p.id}`}
                          className="product bg-white border border-[#ddd] rounded-sm shadow-2xs flex flex-col justify-between overflow-hidden"
                        >
                          {/* WHMCS Card Header */}
                          <header className="bg-[#f8f8f8] border-b border-[#e9ecef] px-4 py-3 flex items-center justify-between">
                            <span className="font-bold text-[#333] text-sm sm:text-base leading-snug">
                              {decodeHtml(p.product_name)}
                            </span>
                          </header>

                          {/* WHMCS Product Description / Feature List */}
                          <div className="product-desc p-4 text-xs text-[#555] leading-relaxed flex-1">
                            {features.length > 0 ? (
                              <div className="space-y-1.5">
                                {features.map((feat, idx) => (
                                  <div key={idx} className="flex items-start space-x-2">
                                    <span className="text-[#5cb85c] font-bold text-xs mt-0.5">
                                      ✓
                                    </span>
                                    <span className="leading-tight">{feat}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="whitespace-pre-line text-[#666]">
                                {decodeHtml(p.description)}
                              </p>
                            )}
                          </div>

                          {/* WHMCS Card Footer: Price on left, Green Order button on right */}
                          <footer className="bg-[#fafafa] border-t border-[#e9ecef] px-4 py-3 flex items-center justify-between gap-3">
                            <div className="product-pricing">
                              <span className="price text-base sm:text-lg font-bold text-[#1A4D80] font-mono leading-tight block">
                                {pricing.displayPrice}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium block">
                                {pricing.isFree ? '' : pricing.cycle}
                              </span>
                              {pricing.setupFee > 0 && (
                                <small className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                                  + ৳{pricing.setupFee.toFixed(2)} Setup Fee
                                </small>
                              )}
                            </div>

                            <button
                              onClick={() => addToCart(p)}
                              className={`btn btn-success btn-sm btn-order-now px-4 py-2 rounded text-xs font-bold transition-colors shadow-2xs inline-flex items-center space-x-1.5 shrink-0 ${
                                inCart
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-[#5cb85c] hover:bg-[#4cae4c] text-white'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{inCart ? 'Added to Cart' : 'Order Now'}</span>
                            </button>
                          </footer>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-white border border-[#ddd] rounded-sm p-3 flex items-center justify-between text-xs text-slate-600">
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
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BOTTOM FLOATING CART BAR (WHEN BROWSING PRODUCTS)         */}
        {/* ========================================================= */}
        {!viewCartView && cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-300 shadow-2xl p-3 sm:p-4">
            <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold font-mono text-xs">
                  {cart.length}
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Order Total ({cart.length} item{cart.length > 1 ? 's' : ''}):
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-[#1A4D80]">
                    ৳{cartGrandTotal.toFixed(2)} BDT
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewCartView(true)}
                  className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 sm:px-6 py-2.5 rounded font-bold text-xs transition-colors shadow-2xs flex items-center space-x-2 uppercase tracking-wide"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Review &amp; Checkout \u2192</span>
                </button>
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
