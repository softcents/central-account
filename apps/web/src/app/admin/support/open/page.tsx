'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ChevronRight, User, LifeBuoy, Send } from 'lucide-react';

export default function OpenTicketPage() {
  const router = useRouter();
  const [client, setClient] = useState('');
  const [dept, setDept] = useState('Technical Support');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Ticket opened successfully on behalf of client!');
    router.push('/admin/support');
  };

  return (
    <div className="p-4 space-y-4 max-w-[1200px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/support" className="text-[#1A4D80] hover:underline font-semibold">
          Support
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Open New Ticket</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/ticketsopen.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Open New Ticket</h1>
            <p className="text-xs text-slate-500">
              Open a new support ticket on behalf of a registered client
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Client <span className="text-rose-600">*</span>
            </label>
            <select
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white"
              required
            >
              <option value="">-- Choose Client --</option>
              <option value="c1">Raju Ahmed (raju@softcents.com)</option>
              <option value="c2">SoftCents Host (billing@softcents.com)</option>
              <option value="c3">Tanvir Hasan (tanvir@gmail.com)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Department</label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white"
            >
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Accounts">Billing & Accounts</option>
              <option value="Domain Registrations">Domain Registrations</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Subject <span className="text-rose-600">*</span></label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
              className="w-full p-2 border border-slate-300 rounded"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Message <span className="text-rose-600">*</span></label>
          <textarea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type ticket inquiry or maintenance notice..."
            className="w-full p-3 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
            required
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="submit"
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-5 py-2 rounded font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open Ticket</span>
          </button>
          <Link
            href="/admin/support"
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
