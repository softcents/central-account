'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  ChevronRight,
  Search,
} from 'lucide-react';

export default function BillableItemsPage() {
  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/invoices" className="text-[#1A4D80] hover:underline font-semibold">
          Billing
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Billable Items</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/billableitems.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Billable Items</h1>
            <p className="text-xs text-slate-500">
              Manage one-off items, manual billings, and scheduled future recurring charges
            </p>
          </div>
        </div>

        <button className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Billable Item</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">Hours / Qty</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Invoice Action</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td colSpan={8} className="p-6 text-center text-slate-500">
                No uninvoiced billable items found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
