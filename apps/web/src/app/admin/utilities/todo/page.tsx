'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, CheckSquare, Clock } from 'lucide-react';

export default function TodoListPage() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Inspect BDIX Uplink BGP peering latency', dueDate: '2026-11-21', status: 'Pending', assignedTo: 'raju' },
    { id: 2, title: 'Upgrade PHP 8.2 OPcache memory buffer on web cluster', dueDate: '2026-11-22', status: 'In Progress', assignedTo: 'raju' },
    { id: 3, title: 'Verify SSL renewed certificate on billing domain', dueDate: '2026-11-20', status: 'Completed', assignedTo: 'raju' },
  ]);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Utilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">To-Do List</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <img src="/whmcs/icons/todolist.png" className="w-6 h-6 object-contain" alt="" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">To-Do List</h1>
            <p className="text-xs text-slate-500">
              Staff internal tasks, maintenance assignments, and reminders
            </p>
          </div>
        </div>

        <button className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Task</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Title / Description</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3">Assigned Staff</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-800">{t.title}</td>
                <td className="py-2.5 px-3 text-slate-600">{t.dueDate}</td>
                <td className="py-2.5 px-3 font-semibold text-[#1A4D80]">{t.assignedTo}</td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
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
