'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import {
  ShoppingBag,
  Check,
  Server,
  PhoneCall,
  Globe,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export default function ShoppingCartPage() {
  const [selectedGroup, setSelectedGroup] = useState('hosting');
  const [cart, setCart] = useState<any[]>([]);
  const [loadingPay, setLoadingPay] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoadingPay(true);
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: `ORD-${Date.now().toString().slice(-6)}`,
          amount: cartTotal,
          fullName: 'SoftCents Customer',
          email: 'billing@softcents.com',
          phone: '01700000000',
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

  const productGroups = [
    { id: 'hosting', name: 'USA Linux Shared Hosting', icon: Server },
    { id: 'bdix', name: 'BDIX Fast Shared Hosting', icon: Globe },
    { id: 'pbx', name: 'Cloud PBX Solutions', icon: PhoneCall },
    { id: 'vps', name: 'Cloud VPS Servers', icon: Cpu },
  ];

  const products: Record<string, any[]> = {
    hosting: [
      {
        id: 7,
        name: 'Advance 2GB (USA)',
        price: 250,
        cycle: 'Monthly',
        features: [
          '2GB NVMe SSD Disk Space',
          '100GB/m Bandwidth',
          '1 Core 100% CPU Limit',
          '1.0GB Managed RAM',
          'Unlimited E-mails & MySQL',
          'cPanel & Softaculous',
          'Free SSL Certificate',
        ],
      },
      {
        id: 8,
        name: 'Advance 5GB (USA)',
        price: 450,
        cycle: 'Monthly',
        popular: true,
        features: [
          '5GB NVMe SSD Disk Space',
          '260GB/m Bandwidth',
          '1 Core 120% CPU Limit',
          '1.0GB Managed RAM',
          'Unlimited E-mails & MySQL',
          'cPanel & Softaculous',
          'Free SSL Certificate',
        ],
      },
      {
        id: 9,
        name: 'Advance 10GB (USA)',
        price: 800,
        cycle: 'Monthly',
        features: [
          '10GB NVMe SSD Disk Space',
          '520GB/m Bandwidth',
          '2 Core 150% CPU Limit',
          '2.0GB Managed RAM',
          'Unlimited E-mails & MySQL',
          'cPanel & Softaculous',
          'Free SSL Certificate',
        ],
      },
    ],
    bdix: [
      {
        id: 30,
        name: 'BDIX 2GB NVMe',
        price: 350,
        cycle: 'Monthly',
        features: [
          '2GB Pure NVMe SSD',
          'Ultra-Low Latency in BD',
          '1 Core CPU / 1GB RAM',
          'cPanel Control Panel',
          'Daily Automated Backups',
        ],
      },
      {
        id: 31,
        name: 'BDIX 5GB NVMe',
        price: 650,
        cycle: 'Monthly',
        popular: true,
        features: [
          '5GB Pure NVMe SSD',
          'Ultra-Low Latency in BD',
          '2 Core CPU / 2GB RAM',
          'cPanel Control Panel',
          'Daily Automated Backups',
        ],
      },
    ],
    pbx: [
      {
        id: 3,
        name: 'Standard PBX',
        price: 1200,
        cycle: 'Monthly',
        features: [
          '6 Users / Extensions',
          '3 Concurrent Channels',
          'Call Center / IVR Menu',
          'Call History & Forwarding',
          'Bulk SMS Support',
          'Voice SMS Integration',
        ],
      },
      {
        id: 4,
        name: 'PBX Business',
        price: 2500,
        cycle: 'Monthly',
        popular: true,
        features: [
          '10 Users / Extensions',
          '5 Concurrent Channels',
          'Call Center / IVR Menu',
          'Call Recording & History',
          'Bulk SMS Support',
          'Voice SMS Integration',
        ],
      },
      {
        id: 6,
        name: 'PBX Enterprise',
        price: 5000,
        cycle: 'Monthly',
        features: [
          '30 Users / Extensions',
          '10 Concurrent Channels',
          'Free IP Number Included',
          'Full IVR Flow Engine',
          '24/7 Dedicated Priority Support',
        ],
      },
    ],
    vps: [
      {
        id: 40,
        name: 'Cloud VPS - USA Standard',
        price: 1500,
        cycle: 'Monthly',
        features: [
          '2 vCPU Cores',
          '4GB DDR4 ECC RAM',
          '60GB NVMe SSD Storage',
          '1 Dedicated IPv4',
          'Full Root SSH Access',
        ],
      },
      {
        id: 41,
        name: 'Cloud VPS - USA Pro',
        price: 2800,
        cycle: 'Monthly',
        popular: true,
        features: [
          '4 vCPU Cores',
          '8GB DDR4 ECC RAM',
          '120GB NVMe SSD Storage',
          '1 Dedicated IPv4',
          'Full Root SSH Access',
        ],
      },
    ],
  };

  const addToCart = (prod: any) => {
    setCart([...cart, prod]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[1240px] mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#1A4D80]" />
              <span>Order New Services & Products</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select premium Web Hosting, Cloud PBX, or High-Performance VPS servers.
            </p>
          </div>

          {cart.length > 0 && (
            <div className="bg-[#1A4D80] text-white px-4 py-2 rounded shadow-sm text-xs flex items-center space-x-2">
              <span>Cart: <strong>{cart.length} item(s)</strong></span>
              <span>•</span>
              <span className="font-mono font-bold">৳{cartTotal.toFixed(2)} BDT</span>
            </div>
          )}
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {productGroups.map((grp) => {
            const Icon = grp.icon;
            const active = selectedGroup === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => setSelectedGroup(grp.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#1A4D80] text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{grp.name}</span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products[selectedGroup]?.map((p) => (
            <div
              key={p.id}
              className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between relative transition-all hover:shadow-md ${
                p.popular ? 'border-[#1A4D80] ring-1 ring-[#1A4D80]' : 'border-slate-200'
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-[#5cb85c] text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <div className="mt-4 mb-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xs font-bold text-slate-500">৳</span>
                    <span className="text-3xl font-extrabold text-[#1A4D80] font-mono">
                      {p.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {p.cycle}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs">
                  {p.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start space-x-2 text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => addToCart(p)}
                  className={`w-full py-2.5 rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 ${
                    p.popular
                      ? 'bg-[#1A4D80] hover:bg-[#143d66] text-white'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Cart / Checkout Drawer when items added */}
        {cart.length > 0 && (
          <div className="bg-white border border-slate-300 rounded-xl shadow-lg p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#1A4D80]" />
              <span>Review & Checkout ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded overflow-hidden">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{item.name}</div>
                    <div className="text-slate-500">{item.cycle} Billing</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-900">৳{item.price.toFixed(2)}</span>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
              <div className="text-sm">
                <span className="text-slate-600">Total Due Today: </span>
                <span className="text-xl font-bold font-mono text-[#1A4D80]">
                  ৳{cartTotal.toFixed(2)} BDT
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loadingPay}
                className="bg-[#5cb85c] hover:bg-[#4cae4c] disabled:opacity-50 text-white px-6 py-2.5 rounded font-bold text-xs transition-colors shadow-sm flex items-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{loadingPay ? 'Connecting to PipraPay...' : 'Complete Checkout & Pay \u2192'}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
