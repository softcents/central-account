'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, MessageSquare, Edit, Trash2 } from 'lucide-react';

export default function PredefinedRepliesPage() {
  const [replies, setReplies] = useState([
    {
      id: 1,
      cat: 'Technical',
      title: 'rDNS / PTR Record Update Instructions',
      content: 'Dear Client, please ensure your DNS A record points to the VPS IP prior to submitting PTR requests.',
    },
    {
      id: 2,
      cat: 'Billing',
      title: 'Payment Received & Account Re-activated',
      content: 'Thank you for your payment. Your invoice has been marked Paid and your services are now fully active.',
    },
    {
      id: 3,
      cat: 'Domains',
      title: 'DNS Propagation Notice',
      content: 'Please note that global DNS nameserver propagation takes between 2 to 24 hours depending on local ISP resolvers.',
    },
  ]);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/support" className="text-[#1A4D80] hover:underline font-semibold">
          Support
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Predefined Replies</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/ticketspredefined.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Predefined Replies</h1>
            <p className="text-xs text-slate-500">
              Manage canned responses and reusable templates for support ticket handling
            </p>
          </div>
        </div>

        <button className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Reply</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Reply Title</th>
              <th className="py-2.5 px-3">Snippet Preview</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {replies.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-[#1A4D80]">{r.cat}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{r.title}</td>
                <td className="py-2.5 px-3 text-slate-600 truncate max-w-md">{r.content}</td>
                <td className="py-2.5 px-3 text-right space-x-2">
                  <button className="text-[#1A4D80] hover:underline font-semibold">Edit</button>
                  <button className="text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
