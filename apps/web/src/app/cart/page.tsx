'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
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

function normalizeDescription(desc?: string | null): string {
  if (!desc) return '';
  return desc
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function formatDescription(desc?: string | null): string {
  if (!desc) return '';
  const normalized = normalizeDescription(desc);
  const decoded = decodeHtml(normalized);
  if (decoded.includes('<br') || decoded.includes('<p') || decoded.includes('<ul')) {
    return decoded;
  }
  return decoded
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('<br />');
}

function renderProductDescription(desc?: string | null, productId?: string | number) {
  if (!desc) return null;

  const normalized = normalizeDescription(desc);
  const hasHtml = /<(?:ul|ol|table|div|p)\b/i.test(normalized);

  if (hasHtml) {
    return (
      <div
        id={productId ? `product${productId}-description` : undefined}
        dangerouslySetInnerHTML={{ __html: decodeHtml(normalized) }}
      />
    );
  }

  const lines = normalized
    .split('\n')
    .map((l) => decodeHtml(l).trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return null;

  return (
    <ul>
      {lines.map((line, idx) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < line.length - 1) {
          const part1 = line.slice(0, colonIdx).trim();
          const part2 = line.slice(colonIdx + 1).trim();
          return (
            <li key={idx} id={productId ? `product${productId}-feature${idx + 1}` : undefined}>
              <span className="feature-value">{part2}</span> {part1}
            </li>
          );
        }
        return (
          <li key={idx} id={productId ? `product${productId}-feature${idx + 1}` : undefined}>
            {line}
          </li>
        );
      })}
    </ul>
  );
}

function getProductPricing(p: any) {
  const m = parseFloat(p.monthly || '-1');
  const a = parseFloat(p.annually || '-1');
  const q = parseFloat(p.quarterly || '-1');
  const s = parseFloat(p.semiannually || '-1');
  const setup = parseFloat(p.msetupfee || '0');

  const formatTk = (val: number) => {
    return val.toLocaleString('en-US') + 'Tk';
  };

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
    const priceVal = m > 0 ? m : setup > 0 ? setup : 0;
    const extraSetup = m > 0 && setup > 0 ? setup : 0;
    return {
      displayPrice: formatTk(priceVal),
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
      displayPrice: formatTk(m),
      priceVal: m,
      cycle: 'Monthly',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  } else if (a >= 0) {
    return {
      displayPrice: formatTk(a),
      priceVal: a,
      cycle: 'Annually',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  } else if (q >= 0) {
    return {
      displayPrice: formatTk(q),
      priceVal: q,
      cycle: 'Quarterly',
      setupFee: setup > 0 ? setup : 0,
      isFree: false,
    };
  } else if (s >= 0) {
    return {
      displayPrice: formatTk(s),
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

function CartInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawGid = searchParams.get('gid');
  const rawGroup = searchParams.get('group');
  const rawPid = searchParams.get('pid');
  const action = searchParams.get('a');
  const domainAction = searchParams.get('domain');

  const { clientId, client, domains } = useActiveClient();

  const isRenewView = action === 'renew';
  const isTransferView = action === 'add' && domainAction === 'transfer';
  const isAddonsView = rawGid === 'addons';
  const isCheckoutParam = action === 'checkout';
  const isViewCartParam = action === 'view';

  const [transferDomain, setTransferDomain] = useState('');
  const [transferEpp, setTransferEpp] = useState('');
  const [manualRenewDomain, setManualRenewDomain] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Load product groups
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

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const handleGroupSelect = (gid: string) => {
    setSelectedGroupId(gid);
    setSearchTerm('');
    setPage(1);
    setViewCartView(false);
    setIsCheckoutView(false);
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

  const isLoggedIn = !!(client?.id || clientId);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewCartView, setViewCartView] = useState<boolean>(isViewCartParam || isCheckoutParam);
  const [isCheckoutView, setIsCheckoutView] = useState<boolean>(isCheckoutParam);
  const [loadingPay, setLoadingPay] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'piprapay' | 'uddoktapay' | 'reseller' | 'bank'>('piprapay');

  // Customer info & Checkout form state
  const [customerName, setCustomerName] = useState('SoftCents Customer');
  const [customerEmail, setCustomerEmail] = useState('billing@softcents.com');
  const [customerPhone, setCustomerPhone] = useState('01700000000');

  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [stateVal, setStateVal] = useState('Dhaka');
  const [postcode, setPostcode] = useState('1207');
  const [country, setCountry] = useState('BD');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [acceptTos, setAcceptTos] = useState(true);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    if (action === 'checkout') {
      setIsCheckoutView(true);
      setViewCartView(true);
    } else if (action === 'view') {
      setIsCheckoutView(false);
      setViewCartView(true);
    }
  }, [action]);

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
          if (u.firstname) setFirstName(u.firstname);
          if (u.lastname) setLastName(u.lastname);
          if (u.email) {
            setCustomerEmail(u.email);
            setEmail(u.email);
          }
          if (u.phonenumber) {
            setCustomerPhone(u.phonenumber);
            setPhoneNumber(u.phonenumber);
          }
          if (u.companyname) setCompanyName(u.companyname);
          if (u.address1) setAddress1(u.address1);
          if (u.address2) setAddress2(u.address2);
          if (u.city) setCity(u.city);
          if (u.state) setStateVal(u.state);
          if (u.postcode) setPostcode(u.postcode);
          if (u.country) setCountry(u.country);
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
        if (u.profile?.first_name) setFirstName(u.profile.first_name);
        if (u.profile?.last_name) setLastName(u.profile.last_name);
        if (u.email) {
          setCustomerEmail(u.email);
          setEmail(u.email);
        }
        if (u.phone || u.phonenumber) {
          const ph = u.phone || u.phonenumber;
          setCustomerPhone(ph);
          setPhoneNumber(ph);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (client) {
      if (client.firstname) setFirstName(client.firstname);
      if (client.lastname) setLastName(client.lastname);
      if (!client.firstname && client.name) {
        const parts = client.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      if (client.email) {
        setEmail(client.email);
        setCustomerEmail(client.email);
      }
      if (client.phonenumber) {
        setPhoneNumber(client.phonenumber);
        setCustomerPhone(client.phonenumber);
      }
      if (client.companyname) setCompanyName(client.companyname);
      if (client.address1) setAddress1(client.address1);
      if (client.address2) setAddress2(client.address2);
      if (client.city) setCity(client.city);
      if (client.state) setStateVal(client.state);
      if (client.postcode) setPostcode(client.postcode);
      if (client.country) setCountry(client.country);
    }
  }, [client]);

  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 30;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    return Math.min(100, score);
  }, [password]);

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let gen = '';
    for (let i = 0; i < 14; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setConfirmPassword(gen);
  };

  const handleExistingLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your email address and password.');
      return;
    }
    setLoadingLogin(true);
    setLoginError('');
    try {
      const clientsList = (whmcsData as any).clients || [];
      const match = clientsList.find(
        (c: any) => c.email && c.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );
      if (match) {
        setFirstName(match.firstname || match.name?.split(' ')[0] || '');
        setLastName(match.lastname || match.name?.split(' ').slice(1).join(' ') || '');
        setEmail(match.email);
        setPhoneNumber(match.phonenumber || '');
        setCompanyName(match.companyname || '');
        setAddress1(match.address1 || '');
        setCity(match.city || 'Dhaka');
        setStateVal(match.state || 'Dhaka');
        setPostcode(match.postcode || '1207');
        setCountry(match.country || 'BD');
        setIsExistingUser(false);
      } else {
        setEmail(loginEmail.trim());
        setIsExistingUser(false);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoadingLogin(false);
    }
  };

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
    setIsCheckoutView(false);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartSetupTotal = cart.reduce((sum, item) => sum + item.setupFee, 0);
  const cartGrandTotal = cartSubtotal + cartSetupTotal;

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Your shopping cart is empty.');
      return;
    }

    if (!isLoggedIn && !isExistingUser) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
        setCheckoutError('Please fill in all required personal information fields.');
        return;
      }
      if (!password) {
        setCheckoutError('Please enter a password for your account.');
        return;
      }
      if (password !== confirmPassword) {
        setCheckoutError('The passwords you entered do not match.');
        return;
      }
    }

    if (!acceptTos) {
      setCheckoutError('You must agree to the Terms of Service to complete your order.');
      return;
    }

    try {
      setLoadingPay(true);
      const primaryItem = cart[0];
      const fullName = `${firstName} ${lastName}`.trim() || customerName;
      const finalTotal = cartGrandTotal - (promoApplied ? cartSubtotal * 0.1 : 0);

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
          domain: `${(fullName || 'sc').toLowerCase().replace(/[^a-z0-9]/g, '')}-pbx.bdpbx.com`,
          paymentMethod: selectedGateway,
          amount: finalTotal,
          customerName: fullName,
          customerEmail: email || customerEmail,
          customerPhone: phoneNumber || customerPhone,
          notes: orderNotes,
          systemUrl: typeof window !== 'undefined' ? window.location.origin : 'https://account.softcents.com',
          returnUrl:
            typeof window !== 'undefined'
              ? `${window.location.origin}/viewinvoice?payment=success`
              : 'https://account.softcents.com/viewinvoice?payment=success',
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
      setCheckoutError(e.message || 'Payment initiation error');
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
      displayPrice: '1,500Tk',
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
      displayPrice: '1,500Tk',
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
      displayPrice: `${price.toLocaleString()}Tk`,
    };
    setCart((prev) => [...prev, item]);
    setViewCartView(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <ClientHeader />

      <section id="main-body" className="py-4">
        <div className="container">
          <div className="row">
            <div className="col-12 primary-content">
              <div id="order-standard_cart">
                <div className="row">
                  {/* ========================================================= */}
                  {/* LEFT SIDEBAR: Categories & Actions (WHMCS standard_cart) */}
                  {/* ========================================================= */}
                  <div className="cart-sidebar sidebar">
                    {/* Categories Panel */}
                    <div
                      data-menu-item-name="Categories"
                      className="panel card card-sidebar mb-3 panel-sidebar"
                    >
                      <div className="panel-heading card-header">
                        <h3 className="panel-title">
                          <span>
                            <i className="fas fa-shopping-cart"></i>&nbsp; Categories
                          </span>
                          <i className="fas fa-chevron-up card-minimise panel-minimise pull-right float-right"></i>
                        </h3>
                      </div>
                      <div className="list-group collapsable-card-body">
                        {allGroups
                          .filter((g: any) => g.hidden !== '1' || String(g.id) === selectedGroupId)
                          .map((grp: any) => {
                            const active =
                              !viewCartView &&
                              !isRenewView &&
                              !isTransferView &&
                              !isAddonsView &&
                              String(selectedGroupId) === String(grp.id);
                            return (
                              <a
                                key={grp.id}
                                data-menu-item-name={grp.name}
                                href={`/cart?gid=${grp.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleGroupSelect(String(grp.id));
                                }}
                                className={`list-group-item list-group-item-action ${
                                  active ? 'active' : ''
                                }`}
                                id={`Secondary_Sidebar-Categories-${grp.slug || grp.id}`}
                              >
                                <span>{decodeHtml(grp.name)}</span>
                              </a>
                            );
                          })}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div
                      data-menu-item-name="Actions"
                      className="panel card card-sidebar mb-3 panel-sidebar"
                    >
                      <div className="panel-heading card-header">
                        <h3 className="panel-title">
                          <span>
                            <i className="fas fa-plus"></i>&nbsp; Actions
                          </span>
                          <i className="fas fa-chevron-up card-minimise panel-minimise pull-right float-right"></i>
                        </h3>
                      </div>
                      <div className="list-group collapsable-card-body">
                        <Link
                          data-menu-item-name="Domain Registration"
                          href="/domainchecker"
                          className="list-group-item list-group-item-action"
                          id="Secondary_Sidebar-Actions-Domain_Registration"
                        >
                          <span>
                            <i className="fas fa-globe fa-fw"></i>&nbsp; Register a New Domain
                          </span>
                        </Link>
                        <Link
                          data-menu-item-name="Domain Transfer"
                          href="/cart?a=add&domain=transfer"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsCheckoutView(false);
                            setViewCartView(false);
                            router.push('/cart?a=add&domain=transfer');
                          }}
                          className={`list-group-item list-group-item-action ${
                            isTransferView ? 'active' : ''
                          }`}
                          id="Secondary_Sidebar-Actions-Domain_Transfer"
                        >
                          <span>
                            <i className="fas fa-share fa-fw"></i>&nbsp; Transfer in a Domain
                          </span>
                        </Link>
                        <button
                          type="button"
                          data-menu-item-name="View Cart"
                          onClick={() => {
                            setIsCheckoutView(false);
                            setViewCartView(true);
                            router.push('/cart?a=view');
                          }}
                          className={`list-group-item list-group-item-action ${
                            viewCartView && !isCheckoutView ? 'active' : ''
                          }`}
                          id="Secondary_Sidebar-Actions-View_Cart"
                        >
                          <span>
                            <i className="fas fa-shopping-cart fa-fw"></i>&nbsp; View Cart
                          </span>
                          {cart.length > 0 && (
                            <span className="badge badge-info float-right">{cart.length}</span>
                          )}
                        </button>
                        {cart.length > 0 && (
                          <button
                            type="button"
                            data-menu-item-name="Checkout"
                            onClick={() => {
                              setIsCheckoutView(true);
                              setViewCartView(true);
                              router.push('/cart?a=checkout');
                            }}
                            className={`list-group-item list-group-item-action ${
                              isCheckoutView ? 'active' : ''
                            }`}
                            id="Secondary_Sidebar-Actions-Checkout"
                          >
                            <span>
                              <i className="fas fa-arrow-circle-right fa-fw"></i>&nbsp; Checkout
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Currency Panel */}
                    <div className="panel card card-sidebar mb-3 panel-sidebar">
                      <div className="panel-heading card-header">
                        <h3 className="panel-title">
                          <span>
                            <i className="fas fa-money-bill-wave"></i>&nbsp; Currency
                          </span>
                        </h3>
                      </div>
                      <div className="card-body p-3">
                        <select className="form-control custom-select" disabled>
                          <option defaultValue="bdt">BDT (৳)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* RIGHT: Cart Body (75% on desktop, 100% on < 1200px)       */}
                  {/* ========================================================= */}
                  <div className="cart-body">
                    {/* ======================================================= */}
                    {/* VIEW: CHECKOUT (WHMCS standard_cart/checkout.tpl)       */}
                    {/* ======================================================= */}
                    {isCheckoutView ? (
                      <div>
                        <div className="header-lined">
                          <h1 className="font-size-36">Checkout</h1>
                        </div>

                        {/* Collapsed Category Selector on Mobile */}
                        <div className="sidebar-collapsed">
                          <div className="panel card panel-default">
                            <div className="m-0 panel-heading card-header">
                              <h3 className="panel-title">
                                <i className="fas fa-shopping-cart"></i>&nbsp; Categories
                              </h3>
                            </div>
                            <div className="panel-body card-body">
                              <form role="form">
                                <select
                                  className="form-control custom-select"
                                  value={selectedGroupId}
                                  onChange={(e) => handleGroupSelect(e.target.value)}
                                >
                                  {allGroups.map((grp) => (
                                    <option key={grp.id} value={grp.id}>
                                      {decodeHtml(grp.name)}
                                    </option>
                                  ))}
                                  <option value="" disabled>
                                    - Choose Another Category -
                                  </option>
                                </select>
                              </form>
                            </div>
                          </div>
                        </div>

                        {/* Already Registered Bar */}
                        <div className="already-registered clearfix">
                          <div className="pull-right float-right">
                            {!isLoggedIn && (
                              <>
                                {!isExistingUser ? (
                                  <button
                                    type="button"
                                    className="btn btn-info"
                                    id="btnAlreadyRegistered"
                                    onClick={() => setIsExistingUser(true)}
                                  >
                                    Already Registered?
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-warning"
                                    id="btnNewUserSignup"
                                    onClick={() => setIsExistingUser(false)}
                                  >
                                    Create a New Account
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          <p className="text-sm-left overflow-hidden">
                            {isLoggedIn
                              ? 'Review your details below and choose a preferred payment method to complete your order.'
                              : 'Please enter your personal details and billing information to checkout.'}
                          </p>
                        </div>

                        {/* Error feedback */}
                        {checkoutError && (
                          <div className="alert alert-danger checkout-error-feedback" role="alert">
                            <p className="font-weight-bold mb-1">
                              The following errors occurred before your order could be processed:
                            </p>
                            <ul className="mb-0 pl-4">
                              <li>{checkoutError}</li>
                            </ul>
                          </div>
                        )}

                        <form method="post" onSubmit={handleCheckout} name="orderfrm" id="frmCheckout">
                          {/* Existing Customer Sign-in */}
                          {isExistingUser && !isLoggedIn && (
                            <div id="containerExistingUserSignin">
                              <div className="sub-heading">
                                <span className="primary-bg-color">Existing Customer Login</span>
                              </div>

                              {loginError && (
                                <div className="alert alert-danger" id="existingLoginMessage">
                                  {loginError}
                                </div>
                              )}

                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputLoginEmail" className="field-icon">
                                      <i className="fas fa-envelope"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="loginemail"
                                      id="inputLoginEmail"
                                      className="field form-control"
                                      placeholder="Email Address"
                                      value={loginEmail}
                                      onChange={(e) => setLoginEmail(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputLoginPassword" className="field-icon">
                                      <i className="fas fa-lock"></i>
                                    </label>
                                    <input
                                      type="password"
                                      name="loginpassword"
                                      id="inputLoginPassword"
                                      className="field form-control"
                                      placeholder="Password"
                                      value={loginPassword}
                                      onChange={(e) => setLoginPassword(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="text-center mb-4">
                                <button
                                  type="button"
                                  id="btnExistingLogin"
                                  className="btn btn-primary btn-md"
                                  onClick={handleExistingLogin}
                                  disabled={loadingLogin}
                                >
                                  <span id="existingLoginButton">
                                    {loadingLogin ? 'Please Wait...' : 'Login'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* New User / Personal Information & Billing Address */}
                          {(!isExistingUser || isLoggedIn) && (
                            <div id="containerNewUserSignup">
                              {/* Personal Information */}
                              <div className="sub-heading">
                                <span className="primary-bg-color">Personal Information</span>
                              </div>

                              <div className="row">
                                <div className="col-sm-6">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputFirstName" className="field-icon">
                                      <i className="fas fa-user"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="firstname"
                                      id="inputFirstName"
                                      className="field form-control"
                                      placeholder="First Name"
                                      value={firstName}
                                      onChange={(e) => setFirstName(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputLastName" className="field-icon">
                                      <i className="fas fa-user"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="lastname"
                                      id="inputLastName"
                                      className="field form-control"
                                      placeholder="Last Name"
                                      value={lastName}
                                      onChange={(e) => setLastName(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputEmail" className="field-icon">
                                      <i className="fas fa-envelope"></i>
                                    </label>
                                    <input
                                      type="email"
                                      name="email"
                                      id="inputEmail"
                                      className="field form-control"
                                      placeholder="Email Address"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-6">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputPhone" className="field-icon">
                                      <i className="fas fa-phone"></i>
                                    </label>
                                    <input
                                      type="tel"
                                      name="phonenumber"
                                      id="inputPhone"
                                      className="field form-control"
                                      placeholder="Phone Number"
                                      value={phoneNumber}
                                      onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Billing Address */}
                              <div className="sub-heading">
                                <span className="primary-bg-color">Billing Address</span>
                              </div>

                              <div className="row">
                                <div className="col-sm-12">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputCompanyName" className="field-icon">
                                      <i className="fas fa-building"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="companyname"
                                      id="inputCompanyName"
                                      className="field form-control"
                                      placeholder="Company Name (Optional)"
                                      value={companyName}
                                      onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-12">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputAddress1" className="field-icon">
                                      <i className="far fa-building"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="address1"
                                      id="inputAddress1"
                                      className="field form-control"
                                      placeholder="Street Address"
                                      value={address1}
                                      onChange={(e) => setAddress1(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-12">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputAddress2" className="field-icon">
                                      <i className="fas fa-map-marker-alt"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="address2"
                                      id="inputAddress2"
                                      className="field form-control"
                                      placeholder="Street Address 2"
                                      value={address2}
                                      onChange={(e) => setAddress2(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-4">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputCity" className="field-icon">
                                      <i className="far fa-building"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="city"
                                      id="inputCity"
                                      className="field form-control"
                                      placeholder="City"
                                      value={city}
                                      onChange={(e) => setCity(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-5">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputState" className="field-icon">
                                      <i className="fas fa-map-signs"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="state"
                                      id="inputState"
                                      className="field form-control"
                                      placeholder="State"
                                      value={stateVal}
                                      onChange={(e) => setStateVal(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-3">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputPostcode" className="field-icon">
                                      <i className="fas fa-certificate"></i>
                                    </label>
                                    <input
                                      type="text"
                                      name="postcode"
                                      id="inputPostcode"
                                      className="field form-control"
                                      placeholder="Postcode"
                                      value={postcode}
                                      onChange={(e) => setPostcode(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="col-sm-12">
                                  <div className="form-group prepend-icon">
                                    <label htmlFor="inputCountry" className="field-icon" id="inputCountryIcon">
                                      <i className="fas fa-globe"></i>
                                    </label>
                                    <select
                                      name="country"
                                      id="inputCountry"
                                      className="field form-control"
                                      value={country}
                                      onChange={(e) => setCountry(e.target.value)}
                                    >
                                      <option value="BD">Bangladesh</option>
                                      <option value="US">United States</option>
                                      <option value="GB">United Kingdom</option>
                                      <option value="CA">Canada</option>
                                      <option value="IN">India</option>
                                      <option value="SG">Singapore</option>
                                      <option value="AE">United Arab Emirates</option>
                                      <option value="MY">Malaysia</option>
                                      <option value="AU">Australia</option>
                                      <option value="DE">Germany</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Account Security (for guest signups) */}
                              {!isLoggedIn && (
                                <div id="containerNewUserSecurity">
                                  <div className="sub-heading">
                                    <span className="primary-bg-color">Account Security</span>
                                  </div>

                                  <div id="containerPassword" className="row">
                                    <div className="col-sm-6">
                                      <div className="form-group prepend-icon">
                                        <label htmlFor="inputNewPassword1" className="field-icon">
                                          <i className="fas fa-lock"></i>
                                        </label>
                                        <input
                                          type="password"
                                          name="password"
                                          id="inputNewPassword1"
                                          className="field form-control"
                                          placeholder="Password"
                                          value={password}
                                          onChange={(e) => setPassword(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-sm-6">
                                      <div className="form-group prepend-icon">
                                        <label htmlFor="inputNewPassword2" className="field-icon">
                                          <i className="fas fa-lock"></i>
                                        </label>
                                        <input
                                          type="password"
                                          name="password2"
                                          id="inputNewPassword2"
                                          className="field form-control"
                                          placeholder="Confirm Password"
                                          value={confirmPassword}
                                          onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div className="col-sm-6 mb-3">
                                      <button
                                        type="button"
                                        className="btn btn-default btn-sm generate-password"
                                        onClick={handleGeneratePassword}
                                      >
                                        Generate Password
                                      </button>
                                    </div>
                                    <div className="col-sm-6 mb-3">
                                      <div className="password-strength-meter">
                                        <div className="progress">
                                          <div
                                            className={`progress-bar ${
                                              passwordStrength >= 75
                                                ? 'bg-success'
                                                : passwordStrength >= 50
                                                ? 'bg-info'
                                                : 'bg-warning'
                                            }`}
                                            role="progressbar"
                                            style={{ width: `${passwordStrength}%` }}
                                          ></div>
                                        </div>
                                        <p className="text-center small text-muted" id="passwordStrengthTextLabel">
                                          Password Strength:{' '}
                                          {passwordStrength >= 75
                                            ? 'Strong'
                                            : passwordStrength >= 50
                                            ? 'Moderate'
                                            : password
                                            ? 'Weak'
                                            : 'Enter a password'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Payment Details */}
                          <div className="sub-heading">
                            <span className="primary-bg-color">Payment Details</span>
                          </div>

                          <div className="alert alert-success text-center large-text" role="alert" id="totalDueToday">
                            Total Due Today: &nbsp;{' '}
                            <strong id="totalCartPrice">
                              {(cartGrandTotal - (promoApplied ? cartSubtotal * 0.1 : 0)).toLocaleString()}Tk
                            </strong>
                          </div>

                          {/* Order Items Table in Checkout */}
                          {cart.length > 0 && (
                            <div className="card mb-4 border border-slate-200">
                              <div className="card-header bg-light py-2 font-weight-bold d-flex justify-content-between align-items-center">
                                <span>
                                  <i className="fas fa-shopping-basket"></i>&nbsp; Order Items ({cart.length})
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-link btn-xs p-0 text-primary"
                                  onClick={() => {
                                    setIsCheckoutView(false);
                                    router.push('/cart?a=view');
                                  }}
                                >
                                  Edit Cart
                                </button>
                              </div>
                              <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                  <thead className="thead-light">
                                    <tr>
                                      <th>Product / Service</th>
                                      <th>Billing Cycle</th>
                                      <th className="text-right">Price</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {cart.map((item, idx) => (
                                      <tr key={idx}>
                                        <td>
                                          <strong>{item.name}</strong>
                                          <div className="small text-muted">{item.groupName}</div>
                                        </td>
                                        <td>{item.cycle}</td>
                                        <td className="text-right font-weight-bold">
                                          {item.price.toLocaleString()}Tk
                                          {item.setupFee > 0 && (
                                            <div className="small text-muted">
                                              +{item.setupFee.toLocaleString()}Tk Setup
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Payment Gateways Selector */}
                          <div id="paymentGatewaysContainer" className="form-group mb-4">
                            <p className="small text-muted text-center mb-3">
                              Please choose your preferred payment method.
                            </p>

                            <div className="text-center">
                              <label className="radio-inline">
                                <input
                                  type="radio"
                                  name="paymentmethod"
                                  value="piprapay"
                                  checked={selectedGateway === 'piprapay'}
                                  onChange={() => setSelectedGateway('piprapay')}
                                  className="payment-methods"
                                />
                                <strong>PipraPay</strong> (bKash, Nagad, Rocket, Cards)
                              </label>
                              <label className="radio-inline">
                                <input
                                  type="radio"
                                  name="paymentmethod"
                                  value="uddoktapay"
                                  checked={selectedGateway === 'uddoktapay'}
                                  onChange={() => setSelectedGateway('uddoktapay')}
                                  className="payment-methods"
                                />
                                <strong>UddoktaPay</strong>
                              </label>
                              <label className="radio-inline">
                                <input
                                  type="radio"
                                  name="paymentmethod"
                                  value="reseller"
                                  checked={selectedGateway === 'reseller'}
                                  onChange={() => setSelectedGateway('reseller')}
                                  className="payment-methods"
                                />
                                <strong>Account Credit Balance</strong>
                              </label>
                              <label className="radio-inline">
                                <input
                                  type="radio"
                                  name="paymentmethod"
                                  value="bank"
                                  checked={selectedGateway === 'bank'}
                                  onChange={() => setSelectedGateway('bank')}
                                  className="payment-methods"
                                />
                                <strong>Bank Transfer</strong>
                              </label>
                            </div>
                          </div>

                          {/* Additional Notes */}
                          <div className="sub-heading">
                            <span className="primary-bg-color">Additional Notes</span>
                          </div>

                          <div className="row mb-3">
                            <div className="col-sm-12">
                              <div className="form-group">
                                <textarea
                                  name="notes"
                                  className="field form-control"
                                  rows={4}
                                  placeholder="Please enter any special notes or instructions for your order..."
                                  value={orderNotes}
                                  onChange={(e) => setOrderNotes(e.target.value)}
                                ></textarea>
                              </div>
                            </div>
                          </div>

                          {/* Terms of Service & Complete Order */}
                          <div className="text-center mt-4">
                            <p>
                              <label className="checkbox-inline">
                                <input
                                  type="checkbox"
                                  name="accepttos"
                                  id="accepttos"
                                  checked={acceptTos}
                                  onChange={(e) => setAcceptTos(e.target.checked)}
                                />
                                &nbsp; I have read and agree to the{' '}
                                <a href="/tos" target="_blank" className="text-primary underline">
                                  Terms of Service
                                </a>
                              </label>
                            </p>

                            <button
                              type="submit"
                              id="btnCompleteOrder"
                              className="btn btn-primary btn-lg disable-on-click"
                              disabled={cart.length === 0 || loadingPay || !acceptTos}
                            >
                              {loadingPay ? 'Processing...' : 'Complete Order'}&nbsp;
                              <i className="fas fa-arrow-circle-right"></i>
                            </button>
                            <br />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCheckoutView(false);
                                router.push('/cart?a=view');
                              }}
                              className="btn btn-link mt-2"
                            >
                              &larr; Return to Cart
                            </button>
                          </div>
                        </form>

                        {/* Security message */}
                        <div className="alert alert-warning checkout-security-msg">
                          <i className="fas fa-lock"></i>
                          This is a secure order environment and is provided with 256 bit SSL encryption. Your current IP address (<strong>103.145.118.2</strong>) is being logged.
                          <div className="clearfix"></div>
                        </div>
                      </div>
                    ) : viewCartView ? (
                      /* ======================================================= */
                      /* VIEW 1: REVIEW & CHECKOUT (cart.php?a=view)             */
                      /* ======================================================= */
                      <div>
                        <div className="header-lined">
                          <h1 className="font-size-36">Review &amp; Checkout</h1>
                        </div>

                        {/* Collapsed Category Selector on Mobile */}
                        <div className="sidebar-collapsed">
                          <div className="panel card panel-default">
                            <div className="m-0 panel-heading card-header">
                              <h3 className="panel-title">
                                <i className="fas fa-shopping-cart"></i>&nbsp; Categories
                              </h3>
                            </div>
                            <div className="panel-body card-body">
                              <form role="form">
                                <select
                                  className="form-control custom-select"
                                  value={selectedGroupId}
                                  onChange={(e) => handleGroupSelect(e.target.value)}
                                >
                                  {allGroups.map((grp) => (
                                    <option key={grp.id} value={grp.id}>
                                      {decodeHtml(grp.name)}
                                    </option>
                                  ))}
                                  <option value="" disabled>
                                    - Choose Another Category -
                                  </option>
                                </select>
                              </form>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          <div className="secondary-cart-body">
                            {cart.length === 0 ? (
                              <div className="view-cart-empty text-center py-5">
                                <i className="fas fa-shopping-cart fa-3x text-muted mb-3 d-block"></i>
                                <h4>Your Shopping Cart is Empty</h4>
                                <p className="text-muted">
                                  You do not have any products in your cart. Select a category to start ordering.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewCartView(false);
                                    setIsCheckoutView(false);
                                  }}
                                  className="btn btn-primary mt-3"
                                >
                                  &larr; Browse Categories
                                </button>
                              </div>
                            ) : (
                              <div>
                                <form method="post" onSubmit={(e) => e.preventDefault()}>
                                  <div className="view-cart-items-header">
                                    <div className="row">
                                      <div className="col-sm-7 col-xs-7 col-7">
                                        Product/Options
                                      </div>
                                      <div className="col-sm-4 col-xs-5 col-5 text-right">
                                        Price/Cycle
                                      </div>
                                    </div>
                                  </div>

                                  <div className="view-cart-items">
                                    {cart.map((item, idx) => (
                                      <div className="item" key={idx}>
                                        <div className="row">
                                          <div className="col-sm-7">
                                            <span className="item-title font-weight-bold">
                                              {item.name}
                                            </span>
                                            <span className="item-group text-muted">
                                              {item.groupName}
                                            </span>
                                          </div>
                                          <div className="col-sm-4 item-price">
                                            <span>{item.price.toLocaleString()}Tk</span>
                                            <span className="cycle">{item.cycle}</span>
                                            {item.setupFee > 0 && (
                                              <small className="text-muted d-block">
                                                +{item.setupFee.toLocaleString()}Tk Setup Fee
                                              </small>
                                            )}
                                          </div>
                                          <div className="col-sm-1 hidden-xs d-none d-sm-block text-right">
                                            <button
                                              type="button"
                                              className="btn btn-link btn-xs btn-remove-from-cart text-danger"
                                              onClick={() => removeFromCart(idx)}
                                              title="Remove item"
                                            >
                                              <i className="fas fa-times"></i>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="empty-cart">
                                    <button
                                      type="button"
                                      className="btn btn-link btn-xs"
                                      id="btnEmptyCart"
                                      onClick={() => setCart([])}
                                    >
                                      <i className="fas fa-trash-alt"></i> Empty Cart
                                    </button>
                                  </div>
                                </form>

                                {/* Promo Code Tab */}
                                <div className="view-cart-tabs mt-4">
                                  <ul className="nav nav-tabs" role="tablist">
                                    <li role="presentation" className="nav-item active">
                                      <a
                                        href="#applyPromo"
                                        className="nav-link active"
                                        aria-controls="applyPromo"
                                        role="tab"
                                        data-toggle="tab"
                                        aria-selected="true"
                                      >
                                        Apply Promo Code
                                      </a>
                                    </li>
                                  </ul>
                                  <div className="tab-content border-top-0 border border-slate-200 p-3 bg-light">
                                    <div
                                      role="tabpanel"
                                      className="tab-pane active promo"
                                      id="applyPromo"
                                    >
                                      <div className="form-group prepend-icon mb-2">
                                        <label htmlFor="inputPromotionCode" className="field-icon">
                                          <i className="fas fa-ticket-alt"></i>
                                        </label>
                                        <input
                                          type="text"
                                          name="promocode"
                                          id="inputPromotionCode"
                                          value={promoCode}
                                          onChange={(e) => setPromoCode(e.target.value)}
                                          className="field form-control"
                                          placeholder="Enter promo code if you have one"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (promoCode.trim()) {
                                            setPromoApplied(true);
                                            alert(
                                              `Promo code '${promoCode
                                                .trim()
                                                .toUpperCase()}' applied successfully!`
                                            );
                                          }
                                        }}
                                        className="btn btn-block btn-default"
                                      >
                                        Validate Code
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Secondary Cart Sidebar: Order Summary */}
                          <div
                            className="secondary-cart-sidebar"
                            id="scrollingPanelContainer"
                          >
                            <div className="order-summary" id="orderSummary">
                              <h2 className="font-size-30">Order Summary</h2>
                              <div className="summary-container">
                                <div className="subtotal clearfix">
                                  <span className="pull-left float-left">Subtotal</span>
                                  <span id="subtotal" className="pull-right float-right">
                                    {cartSubtotal.toLocaleString()}Tk
                                  </span>
                                </div>

                                {cartSetupTotal > 0 && (
                                  <div className="bordered-totals clearfix">
                                    <span className="pull-left float-left">Setup Fees</span>
                                    <span className="pull-right float-right">
                                      {cartSetupTotal.toLocaleString()}Tk
                                    </span>
                                  </div>
                                )}

                                {promoApplied && (
                                  <div className="bordered-totals clearfix text-success">
                                    <span className="pull-left float-left">
                                      Promo Discount (10%)
                                    </span>
                                    <span className="pull-right float-right">
                                      -{(cartSubtotal * 0.1).toLocaleString()}Tk
                                    </span>
                                  </div>
                                )}

                                <div className="recurring-totals clearfix">
                                  <span className="pull-left float-left">Totals</span>
                                  <span
                                    id="recurring"
                                    className="pull-right float-right recurring-charges"
                                  >
                                    <span className="cost">
                                      {(
                                        cartSubtotal - (promoApplied ? cartSubtotal * 0.1 : 0)
                                      ).toLocaleString()}
                                      Tk
                                    </span>{' '}
                                    Monthly
                                    <br />
                                  </span>
                                </div>

                                <div className="total-due-today total-due-today-padded">
                                  <span id="totalDueToday" className="amt">
                                    {(
                                      cartGrandTotal - (promoApplied ? cartSubtotal * 0.1 : 0)
                                    ).toLocaleString()}
                                    Tk
                                  </span>
                                  <span>Total Due Today</span>
                                </div>

                                <div className="text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsCheckoutView(true);
                                      router.push('/cart?a=checkout');
                                    }}
                                    disabled={cart.length === 0}
                                    className={`btn btn-success btn-lg btn-checkout btn-block ${
                                      cart.length === 0 ? 'disabled' : ''
                                    }`}
                                    id="checkout"
                                  >
                                    Checkout{' '}
                                    <i className="fas fa-arrow-right"></i>
                                  </button>
                                  <br />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewCartView(false);
                                      setIsCheckoutView(false);
                                    }}
                                    className="btn btn-link btn-continue-shopping"
                                    id="continueShopping"
                                  >
                                    Continue Shopping
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : isRenewView ? (
                      /* ======================================================= */
                      /* VIEW 2: DOMAIN RENEWALS (WHMCS)                         */
                      /* ======================================================= */
                      <div>
                        <div className="header-lined">
                          <h1 className="font-size-36">Renew Domains</h1>
                          <p>
                            Extend your domain registration for an additional year to prevent
                            service interruption.
                          </p>
                        </div>

                        <div className="sidebar-collapsed">
                          <div className="panel card panel-default">
                            <div className="m-0 panel-heading card-header">
                              <h3 className="panel-title">
                                <i className="fas fa-shopping-cart"></i>&nbsp; Categories
                              </h3>
                            </div>
                            <div className="panel-body card-body">
                              <select
                                className="form-control custom-select"
                                value={selectedGroupId}
                                onChange={(e) => handleGroupSelect(e.target.value)}
                              >
                                {allGroups.map((grp) => (
                                  <option key={grp.id} value={grp.id}>
                                    {decodeHtml(grp.name)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="card mb-4 border border-slate-200">
                          <div className="card-header bg-light font-weight-bold">
                            Domains Eligible for Renewal ({domains.length})
                          </div>
                          {domains.length === 0 ? (
                            <div className="card-body text-center py-5 text-muted">
                              <i className="fas fa-globe fa-3x mb-3 text-muted"></i>
                              <p className="font-weight-bold">
                                No registered domains found on your account.
                              </p>
                              <p className="small">
                                Enter a domain below to renew or register a new domain.
                              </p>
                            </div>
                          ) : (
                            <div className="list-group list-group-flush">
                              {domains.map((d: any) => (
                                <div
                                  key={d.id}
                                  className="list-group-item d-flex justify-content-between align-items-center py-3"
                                >
                                  <div>
                                    <div className="font-weight-bold text-primary">
                                      {d.domain}
                                    </div>
                                    <small className="text-muted">
                                      Expires: {d.expirydate || '-'} &bull; Status: {d.status}
                                    </small>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <span className="font-weight-bold mr-3 font-mono">
                                      1,500Tk / 1 Yr
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRenewDomain(d.domain)}
                                      className="btn btn-success btn-sm"
                                    >
                                      <i className="fas fa-sync-alt"></i> Renew Now
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="card border border-slate-200 p-4">
                          <h5 className="font-weight-bold mb-3">Renew Any Other Domain</h5>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (manualRenewDomain.trim()) {
                                handleRenewDomain(manualRenewDomain.trim());
                              }
                            }}
                            className="form-inline"
                          >
                            <input
                              type="text"
                              value={manualRenewDomain}
                              onChange={(e) => setManualRenewDomain(e.target.value)}
                              placeholder="Enter domain name (e.g. mycompany.com)..."
                              className="form-control mr-2 mb-2 flex-grow-1"
                            />
                            <button type="submit" className="btn btn-primary mb-2">
                              Renew Domain
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : isTransferView ? (
                      /* ======================================================= */
                      /* VIEW 3: DOMAIN TRANSFER (WHMCS)                         */
                      /* ======================================================= */
                      <div>
                        <div className="header-lined">
                          <h1 className="font-size-36">Transfer Domains to Us</h1>
                          <p>
                            Transfer your active domain name from your current registrar to
                            SoftCents Systems. Includes 1-year extension.
                          </p>
                        </div>

                        <div className="sidebar-collapsed">
                          <div className="panel card panel-default">
                            <div className="m-0 panel-heading card-header">
                              <h3 className="panel-title">
                                <i className="fas fa-shopping-cart"></i>&nbsp; Categories
                              </h3>
                            </div>
                            <div className="panel-body card-body">
                              <select
                                className="form-control custom-select"
                                value={selectedGroupId}
                                onChange={(e) => handleGroupSelect(e.target.value)}
                              >
                                {allGroups.map((grp) => (
                                  <option key={grp.id} value={grp.id}>
                                    {decodeHtml(grp.name)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="card border border-slate-200 p-4 max-w-xl">
                          <form onSubmit={handleAddDomainTransfer}>
                            <div className="form-group mb-3">
                              <label className="font-weight-bold small">
                                Domain Name to Transfer
                              </label>
                              <input
                                type="text"
                                required
                                value={transferDomain}
                                onChange={(e) => setTransferDomain(e.target.value)}
                                placeholder="example.com"
                                className="form-control"
                              />
                              <small className="form-text text-muted">
                                Enter your domain with extension, without www or http.
                              </small>
                            </div>

                            <div className="form-group mb-3">
                              <label className="font-weight-bold small">
                                EPP / Authorization Code
                              </label>
                              <input
                                type="text"
                                required
                                value={transferEpp}
                                onChange={(e) => setTransferEpp(e.target.value)}
                                placeholder="Obtain this from your current registrar"
                                className="form-control font-mono"
                              />
                            </div>

                            <div className="alert alert-info py-2 small">
                              <strong>Transfer Fee:</strong> 1,500Tk (Includes 1 Yr Extension) &bull; Free DNS Management
                            </div>

                            <button type="submit" className="btn btn-success btn-block">
                              <i className="fas fa-shopping-cart"></i> Add Transfer to Cart &rarr;
                            </button>
                          </form>
                        </div>
                      </div>
                    ) : isAddonsView ? (
                      /* ======================================================= */
                      /* VIEW 4: PRODUCT ADDONS (WHMCS)                          */
                      /* ======================================================= */
                      <div>
                        <div className="header-lined">
                          <h1 className="font-size-36">Product Addons</h1>
                          <p>
                            Enhance your hosting, Cloud PBX, and server performance with
                            enterprise service addons.
                          </p>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-4">
                            <div className="card h-100 p-3 border border-slate-200">
                              <h5 className="font-weight-bold text-dark">
                                Dedicated IPv4 Address
                              </h5>
                              <p className="text-muted small">
                                Dedicated clean IP address for private SSL, mail reputation, and
                                BDIX peering routing.
                              </p>
                              <div className="font-weight-bold font-mono text-primary mt-auto pt-2">
                                300Tk <small className="text-muted">/ Monthly</small>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddAddon('Dedicated IPv4 Address', 300, 'Monthly')
                                }
                                className="btn btn-success btn-sm mt-3"
                              >
                                Order Addon &rarr;
                              </button>
                            </div>
                          </div>

                          <div className="col-md-6 mb-4">
                            <div className="card h-100 p-3 border border-slate-200">
                              <h5 className="font-weight-bold text-dark">
                                SpamExperts Email Security
                              </h5>
                              <p className="text-muted small">
                                99.98% anti-spam filtering, inbound/outbound protection, and
                                automated virus quarantine.
                              </p>
                              <div className="font-weight-bold font-mono text-primary mt-auto pt-2">
                                500Tk <small className="text-muted">/ Monthly</small>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddAddon(
                                    'SpamExperts Email Security',
                                    500,
                                    'Monthly'
                                  )
                                }
                                className="btn btn-success btn-sm mt-3"
                              >
                                Order Addon &rarr;
                              </button>
                            </div>
                          </div>

                          <div className="col-md-6 mb-4">
                            <div className="card h-100 p-3 border border-slate-200">
                              <h5 className="font-weight-bold text-dark">
                                Wildcard SSL Certificate
                              </h5>
                              <p className="text-muted small">
                                Secure unlimited subdomains under your primary domain with 256-bit
                                encryption &amp; warranty.
                              </p>
                              <div className="font-weight-bold font-mono text-primary mt-auto pt-2">
                                2,500Tk <small className="text-muted">/ Annually</small>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddAddon('Wildcard SSL Certificate', 2500, 'Annually')
                                }
                                className="btn btn-success btn-sm mt-3"
                              >
                                Order Addon &rarr;
                              </button>
                            </div>
                          </div>

                          <div className="col-md-6 mb-4">
                            <div className="card h-100 p-3 border border-slate-200">
                              <h5 className="font-weight-bold text-dark">
                                Acronis Cloud Daily Backup (50GB)
                              </h5>
                              <p className="text-muted small">
                                Automated daily snapshot backups with 1-click restore for MySQL
                                databases and website files.
                              </p>
                              <div className="font-weight-bold font-mono text-primary mt-auto pt-2">
                                400Tk <small className="text-muted">/ Monthly</small>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddAddon(
                                    'Acronis Cloud Daily Backup (50GB)',
                                    400,
                                    'Monthly'
                                  )
                                }
                                className="btn btn-success btn-sm mt-3"
                              >
                                Order Addon &rarr;
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ======================================================= */
                      /* VIEW 5: AUTHENTIC WHMCS STANDARD CART PRODUCTS LISTING  */
                      /* ======================================================= */
                      <div>
                        <div className="header-lined">
                          <h1 className="font-size-36">
                            {decodeHtml(currentGroup?.headline || currentGroup?.name)}
                          </h1>
                          {currentGroup?.tagline && (
                            <p>{decodeHtml(currentGroup.tagline)}</p>
                          )}
                        </div>

                        {/* Collapsed Category Selector on Mobile (< 1200px) */}
                        <div className="sidebar-collapsed">
                          <div className="panel card panel-default">
                            <div className="m-0 panel-heading card-header">
                              <h3 className="panel-title">
                                <i className="fas fa-shopping-cart"></i>&nbsp; Categories
                              </h3>
                            </div>
                            <div className="panel-body card-body">
                              <form role="form">
                                <select
                                  className="form-control custom-select"
                                  value={selectedGroupId}
                                  onChange={(e) => handleGroupSelect(e.target.value)}
                                >
                                  {allGroups.map((grp) => (
                                    <option key={grp.id} value={grp.id}>
                                      {decodeHtml(grp.name)}
                                    </option>
                                  ))}
                                  <option value="" disabled>
                                    - Choose Another Category -
                                  </option>
                                </select>
                              </form>
                            </div>
                          </div>
                        </div>

                        {/* Search bar helper */}
                        <div className="mb-3">
                          <div className="input-group">
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                              }}
                              placeholder="Search products in this category..."
                              className="form-control"
                              style={{ width: '100%' }}
                            />
                            {searchTerm && (
                              <div className="input-group-append">
                                <button
                                  type="button"
                                  onClick={() => setSearchTerm('')}
                                  className="btn btn-outline-secondary"
                                >
                                  &times; Clear
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Products Grid matching standard_cart line-for-line */}
                        <div className="products" id="products">
                          <div className="row row-eq-height">
                            {paginatedProducts.length === 0 ? (
                              <div className="col-12">
                                <div className="alert alert-info text-center py-4">
                                  {searchTerm
                                    ? `No products matching "${searchTerm}" found in this category.`
                                    : 'There are currently no active products in this category.'}
                                </div>
                              </div>
                            ) : (
                              paginatedProducts.map((p: any) => {
                                const pricing = getProductPricing(p);
                                const inCart = cart.some(
                                  (item) => item.id === String(p.id)
                                );

                                return (
                                  <div className="col-md-6" key={p.id}>
                                    <div className="product clearfix" id={`product${p.id}`}>
                                      <header>
                                        <span id={`product${p.id}-name`}>
                                          {decodeHtml(p.product_name)}
                                        </span>
                                      </header>

                                      <div className="product-desc">
                                        {renderProductDescription(p.description, p.id)}
                                      </div>

                                      <footer>
                                        <div
                                          className="product-pricing"
                                          id={`product${p.id}-price`}
                                        >
                                          <span className="price">
                                            {pricing.displayPrice}
                                          </span>
                                          <br />
                                          {pricing.cycle}
                                          {pricing.setupFee > 0 && (
                                            <>
                                              <br />
                                              <small>
                                                {pricing.setupFee.toLocaleString()} Setup
                                                Fee
                                              </small>
                                            </>
                                          )}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => addToCart(p)}
                                          className={`btn btn-success btn-sm btn-order-now ${
                                            inCart ? 'in-cart' : ''
                                          }`}
                                          id={`product${p.id}-order-button`}
                                        >
                                          <i className="fas fa-shopping-cart"></i>{' '}
                                          {inCart ? 'Added' : 'Order Now'}
                                        </button>
                                      </footer>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Pagination if large product list */}
                        {totalPages > 1 && (
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <span className="text-muted small">
                              Showing {(page - 1) * pageSize + 1} -{' '}
                              {Math.min(page * pageSize, filteredProducts.length)} of{' '}
                              {filteredProducts.length} products
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-outline-secondary btn-sm mr-2"
                              >
                                &larr; Prev
                              </button>
                              <span className="small font-weight-bold mx-2">
                                {page} / {totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={page === totalPages}
                                className="btn btn-outline-secondary btn-sm ml-2"
                              >
                                Next &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Bottom Cart Bar (Browsing mode when cart has items) */}
      {!viewCartView && cart.length > 0 && (
        <div
          className="fixed-bottom bg-white border-top shadow-lg py-2 px-3"
          style={{ zIndex: 1040 }}
        >
          <div className="container d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <span className="badge badge-primary p-2 mr-3 font-weight-bold">
                {cart.length} item{cart.length > 1 ? 's' : ''}
              </span>
              <div>
                <small className="text-muted d-block">Order Total:</small>
                <strong className="text-primary h6 mb-0">
                  {cartGrandTotal.toLocaleString()}Tk
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewCartView(true)}
              className="btn btn-success btn-sm font-weight-bold text-uppercase px-3"
            >
              <i className="fas fa-shopping-cart"></i> Review &amp; Checkout &rarr;
            </button>
          </div>
        </div>
      )}

      <WhmcsFooter />
    </div>
  );
}

export default function ShoppingCartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white d-flex align-items-center justify-content-center p-5 text-muted">
          <i className="fas fa-spinner fa-spin mr-2"></i> Loading Shopping Cart...
        </div>
      }
    >
      <CartInner />
    </Suspense>
  );
}
