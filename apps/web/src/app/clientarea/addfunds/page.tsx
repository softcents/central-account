'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { CreditCard, Wallet, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function ClientAddFundsPage() {
  const [amount, setAmount] = useState('1000');
  const [gateway, setGateway] = useState('piprapay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) < 10) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: `DEP-${Date.now().toString().slice(-6)}`,
          amount: Number(amount),
          fullName: 'SoftCents Customer',
          email: 'billing@softcents.com',
          phone: '01700000000',
        }),
      });

      const data = await res.json();

      if (data.pp_url) {
        window.location.href = data.pp_url;
      } else {
        setError(data.error || 'Failed to connect to PipraPay payment gateway.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800 font-sans">
      <ClientHeader />

      <main className="max-w-[800px] mx-auto px-4 py-8 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-[#1A4D80]" />
            <span>Add Funds to Account</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deposit credit into your account balance for seamless automatic invoice renewals.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded border border-slate-200">
            <div>
              <div className="text-xs text-slate-500">Current Credit Balance</div>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-0.5">৳0.00 BDT</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>Min Deposit: <strong>৳10.00</strong></div>
              <div>Max Deposit: <strong>৳50,000.00</strong></div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Deposit Amount (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-500">৳</span>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 pl-8 text-sm font-bold font-mono focus:outline-none focus:border-[#1A4D80]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Payment Method
              </label>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-semibold focus:outline-none focus:border-[#1A4D80]"
              >
                <option value="piprapay">PipraPay (bKash / Nagad / Rocket Auto-Gateway)</option>
                <option value="bank">Bank Transfer (City Bank / BRAC Bank)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5cb85c] hover:bg-[#4cae4c] disabled:opacity-50 text-white py-2.5 rounded font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Redirecting to PipraPay...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to PipraPay Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
