'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, RefreshCw, Search } from 'lucide-react';

export default function GatewayLogPage() {
  const [filter, setFilter] = useState('');

  const logs = [
    {
      id: 1,
      date: '2026-11-19 19:02:14',
      gateway: 'bKash Auto Gateway',
      result: 'Successful',
      debugData: 'paymentID: TRX984124 | trxStatus: Completed | amount: 1500.00 | intent: sale',
    },
    {
      id: 2,
      date: '2026-11-18 12:45:02',
      gateway: 'SSLCommerz',
      result: 'Successful',
      debugData: 'val_id: SSL281903 | status: VALID | currency_amount: 450.00',
    },
    {
      id: 3,
      date: '2026-11-17 11:20:10',
      gateway: 'Nagad Auto',
      result: 'Cancelled by User',
      debugData: 'status: Aborted | order_id: 100159',
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/invoices" className="text-[#1A4D80] hover:underline font-semibold">
          Billing
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Gateway Log</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Payment Gateway Log</h1>
          <p className="text-xs text-slate-500">
            Debug output and raw webhook responses from payment gateways
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Gateway</th>
              <th className="py-2.5 px-3">Debug Data</th>
              <th className="py-2.5 px-3 text-center">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                  {l.date}
                </td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{l.gateway}</td>
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 bg-slate-50 rounded">
                  {l.debugData}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      l.result === 'Successful'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {l.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
