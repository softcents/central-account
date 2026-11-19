'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Bell, Calendar } from 'lucide-react';

export default function AnnouncementsPage() {
  const announcements = [
    {
      id: 1,
      date: '2026-11-15',
      title: 'Scheduled Core Network Switch Maintenance in Dhaka BDIX Datacenter',
      published: true,
    },
    {
      id: 2,
      date: '2026-10-01',
      title: 'New High-Frequency AMD EPYC NVMe VPS Clusters Available Now',
      published: true,
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/support" className="text-[#1A4D80] hover:underline font-semibold">
          Support
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Announcements</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Announcements</h1>
          <p className="text-xs text-slate-500">
            Publish maintenance windows, news, and updates for your clients
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Announcement</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Title</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-slate-600">{a.date}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{a.title}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Published
                  </span>
                </td>
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
