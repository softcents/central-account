'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, BookOpen } from 'lucide-react';

export default function KnowledgebasePage() {
  const articles = [
    { id: 1, title: 'How to connect via SSH to your Linux VPS', cat: 'VPS Hosting', views: 320 },
    { id: 2, title: 'Configuring custom nameservers for your domain', cat: 'Domains', views: 512 },
    { id: 3, title: 'bKash and Nagad payment automation troubleshooting', cat: 'Billing', views: 890 },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/support" className="text-[#1A4D80] hover:underline font-semibold">
          Support
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Knowledgebase</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">Knowledgebase</h1>
          <p className="text-xs text-slate-500">
            Publish support tutorials and troubleshooting articles for self-service client help
          </p>
        </div>
        <button className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Article</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Article Title</th>
              <th className="py-2.5 px-3 text-center">Views</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {articles.map((art) => (
              <tr key={art.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-[#1A4D80]">{art.cat}</td>
                <td className="py-2.5 px-3 font-bold text-slate-800">{art.title}</td>
                <td className="py-2.5 px-3 text-center font-mono text-slate-600">{art.views}</td>
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
