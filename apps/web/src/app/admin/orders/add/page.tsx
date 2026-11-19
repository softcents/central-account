'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  ChevronRight,
  User,
  Package,
  CreditCard,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function AddOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('clientid') || '';

  const [clientId, setClientId] = useState(preselectedClient);
  const [productType, setProductType] = useState('hosting');
  const [product, setProduct] = useState('vps-std');
  const [domain, setDomain] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [gateway, setGateway] = useState('bkash_nagad');
  const [price, setPrice] = useState('1500.00');
  const [sendEmail, setSendEmail] = useState(true);
  const [generateInvoice, setGenerateInvoice] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Order created successfully!');
    router.push('/admin/orders');
  };

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/orders" className="text-[#1A4D80] hover:underline font-semibold">
          Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Add New Order</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/ordersadd.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Add New Order</h1>
            <p className="text-xs text-slate-500">
              Create and provision hosting, domains, or server orders for an existing or new client
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-5 text-xs">
        {/* Client Selection */}
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-sm font-bold text-[#1A4D80] mb-3 flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>1. Client Information</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Select Client <span className="text-rose-600">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
                required
              >
                <option value="">-- Choose Existing Client --</option>
                <option value="c1">Raju Ahmed (raju@softcents.com)</option>
                <option value="c2">SoftCents Host (billing@softcents.com)</option>
                <option value="c3">Tanvir Hasan (tanvir@gmail.com)</option>
              </select>
            </div>
            <div className="flex items-end">
              <Link
                href="/admin/clients/add"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded font-medium border border-slate-300 inline-block"
              >
                + Or Create New Client First
              </Link>
            </div>
          </div>
        </div>

        {/* Product / Service Details */}
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-sm font-bold text-[#1A4D80] mb-3 flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>2. Product & Service Details</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Product Type</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="hosting">Shared / NVMe Web Hosting</option>
                <option value="vps">Cloud VPS Server</option>
                <option value="dedicated">Dedicated Server</option>
                <option value="domain">Domain Registration</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Product Package</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="vps-std">Standard Cloud VPS - 2 vCPU, 4GB RAM (৳1,500.00)</option>
                <option value="vps-pro">Pro Cloud VPS - 4 vCPU, 8GB RAM (৳2,800.00)</option>
                <option value="cpanel-start">cPanel NVMe Hosting - Starter (৳450.00)</option>
                <option value="bdix-dedi">BDIX Dedicated Server E-2276G (৳12,000.00)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Domain Name</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. clientdomain.com"
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semi-annually">Semi-Annually</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Custom Recurring Price (৳)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Payment & Automation Options */}
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-sm font-bold text-[#1A4D80] mb-3 flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>3. Payment Gateway & Options</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="bkash_nagad">bKash / Nagad / Rocket Auto Gateway</option>
                <option value="sslcommerz">SSLCommerz (Cards/Internet Banking)</option>
                <option value="bank">Bank Transfer (EBL / City Bank)</option>
                <option value="mailin">Mail In / Offline Payment</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateInvoice}
                  onChange={(e) => setGenerateInvoice(e.target.checked)}
                />
                <span className="font-semibold">Generate Invoice</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <span className="font-semibold">Send Order Confirmation Email to Client</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-6 py-2.5 rounded font-bold text-xs shadow-sm"
          >
            Submit Order
          </button>
          <Link
            href="/admin/orders"
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded font-medium text-xs"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
