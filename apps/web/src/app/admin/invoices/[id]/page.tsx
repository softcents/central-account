'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  ChevronRight,
  User,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Download,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

export default function ViewInvoicePage() {
  const params = useParams();
  const invoiceId = params?.id as string;
  const router = useRouter();

  const [status, setStatus] = useState('Unpaid');
  const [gateway, setGateway] = useState('bkash_nagad');
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('1500.00');
  const [transId, setTransId] = useState('');

  const [items, setItems] = useState([
    {
      id: 1,
      description: 'Standard Cloud VPS - 2 vCPU, 4GB RAM (20/11/2026 - 19/12/2026)',
      amount: 1500.0,
      taxed: false,
    },
  ]);

  const [transactions, setTransactions] = useState<any[]>([]);

  const subtotal = items.reduce((acc, curr) => acc + curr.amount, 0);
  const total = subtotal;

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const paid = parseFloat(paymentAmount) || 0;
    setTransactions([
      ...transactions,
      {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        gateway: gateway === 'bkash_nagad' ? 'bKash/Nagad Auto' : 'Bank Wire',
        transId: transId || `TRX-${Date.now().toString().slice(-6)}`,
        amount: paid,
      },
    ]);
    setStatus('Paid');
    setAddPaymentOpen(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/invoices" className="text-[#1A4D80] hover:underline font-semibold">
          Invoices
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Invoice #{invoiceId}</span>
      </div>

      {/* Top Invoice Header & Actions */}
      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-sm">
            #{invoiceId}
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center space-x-2">
              <span>Invoice #{invoiceId}</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {status}
              </span>
            </h1>
            <p className="text-xs text-slate-500">Invoice Date: 20/11/2026 | Due Date: 27/11/2026</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {status !== 'Paid' ? (
            <button
              onClick={() => setAddPaymentOpen(true)}
              className="flex items-center space-x-1 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-bold shadow-sm"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Add Payment</span>
            </button>
          ) : (
            <button
              onClick={() => setStatus('Unpaid')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded font-semibold"
            >
              Mark Unpaid
            </button>
          )}

          <button
            type="button"
            className="flex items-center space-x-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded font-medium shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-[#1A4D80]" />
            <span>Send Reminder</span>
          </button>

          <a
            href={`/viewinvoice.php?id=${invoiceId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded font-medium shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print View</span>
          </a>
        </div>
      </div>

      {/* Invoice Details Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client & Billing Info */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>Invoiced To</span>
            <Link href="/admin/clients/c1" className="text-[#1A4D80] hover:underline font-normal">
              View Client Profile &rarr;
            </Link>
          </div>
          <div className="text-slate-800 font-semibold text-sm">Raju Ahmed</div>
          <div className="text-slate-600">SoftCents Systems Ltd.</div>
          <div className="text-slate-600">Dhaka, Bangladesh</div>
          <div className="text-slate-600">raju@softcents.com</div>
        </div>

        {/* Invoice Options */}
        <div className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-2 text-xs">
          <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5">
            Invoice Settings
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500 block">Payment Method:</span>
              <select
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full mt-1 p-1.5 border border-slate-300 rounded bg-white text-xs"
              >
                <option value="bkash_nagad">bKash/Nagad Auto Gateway</option>
                <option value="sslcommerz">SSLCommerz</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <span className="text-slate-500 block">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 p-1.5 border border-slate-300 rounded bg-white text-xs font-bold"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="bg-[#f5f7f8] px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>Invoice Items</span>
          <span className="font-normal text-slate-500">1 Item</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-4">Item Description</th>
              <th className="py-2.5 px-4 text-right w-36">Amount (৳)</th>
              <th className="py-2.5 px-4 text-center w-20">Taxed</th>
              <th className="py-2.5 px-4 text-right w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-medium text-slate-800">{item.description}</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                  ৳{item.amount.toFixed(2)}
                </td>
                <td className="py-2.5 px-4 text-center text-slate-500">
                  {item.taxed ? 'Yes' : 'No'}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <button className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td className="py-2 px-4 text-right font-bold text-slate-600">Sub Total:</td>
              <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                ৳{subtotal.toFixed(2)}
              </td>
              <td colSpan={2}></td>
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td className="py-2.5 px-4 text-right font-bold text-slate-800 text-sm">
                Total Due:
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-bold text-[#1A4D80] text-sm">
                ৳{total.toFixed(2)} BDT
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Transactions Section */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="bg-[#f5f7f8] px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
          <span>Transactions Applied</span>
          <button
            onClick={() => setAddPaymentOpen(true)}
            className="text-[#1A4D80] font-semibold hover:underline"
          >
            + Add Transaction
          </button>
        </div>
        {transactions.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Gateway</th>
                <th className="py-2 px-4">Transaction ID</th>
                <th className="py-2 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-2 px-4 text-slate-600">{tx.date}</td>
                  <td className="py-2 px-4 text-slate-800 font-medium">{tx.gateway}</td>
                  <td className="py-2 px-4 font-mono font-semibold text-indigo-700">{tx.transId}</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">
                    ৳{tx.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-4 text-center text-xs text-slate-500">
            No transactions found for this invoice.
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {addPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#1A4D80] border-b pb-2">
              Add Payment to Invoice #{invoiceId}
            </h3>
            <form onSubmit={handleAddPayment} className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                <select
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="bkash_nagad">bKash/Nagad Auto Gateway</option>
                  <option value="sslcommerz">SSLCommerz</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={transId}
                  onChange={(e) => setTransId(e.target.value)}
                  placeholder="e.g. 9B841A87Z"
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Amount (৳)</label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAddPaymentOpen(false)}
                  className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1.5 rounded font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
