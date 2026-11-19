'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  RotateCw,
} from 'lucide-react';

export default function AutomationStatusPage() {
  const cronTasks = [
    { name: 'Daily Cron Job', lastRun: '2026-11-20 00:00:02', status: 'Success', description: 'Invoicing, suspensions, overdue notices & currency rates' },
    { name: 'Invoicing Generation', lastRun: '2026-11-20 00:00:03', status: 'Success', description: 'Generated recurring invoices due in next 7 days' },
    { name: 'Late Fee Application', lastRun: '2026-11-20 00:00:05', status: 'Success', description: 'Calculated and added late payment fees on overdue invoices' },
    { name: 'Automated Suspensions', lastRun: '2026-11-20 00:00:07', status: 'Success', description: 'Suspended 0 unpaid overdue services on servers' },
    { name: 'Domain Renewal Notices', lastRun: '2026-11-20 00:00:09', status: 'Success', description: 'Dispatched renewal reminders to registered domain owners' },
    { name: 'Ticket Auto-Closure', lastRun: '2026-11-20 00:00:12', status: 'Success', description: 'Closed answered tickets inactive for more than 72 hours' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex items-center space-x-2 text-xs border-b border-slate-200 pb-2">
        <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline font-semibold">
          Utilities
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-700">Automation Status</span>
      </div>

      <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#1A4D80]/10 rounded text-[#1A4D80]">
            <Settings className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Automation Status</h1>
            <p className="text-xs text-slate-500">
              Overview of system cron executions, invoice generation, suspensions, and automated tasks
            </p>
          </div>
        </div>

        <button className="flex items-center space-x-1.5 bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1.5 rounded font-semibold text-xs shadow-sm">
          <Play className="w-3.5 h-3.5" />
          <span>Execute Daily Cron Now</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3">Automated Task</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3">Last Execution</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cronTasks.map((task, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-slate-900">{task.name}</td>
                <td className="py-2.5 px-3 text-slate-600">{task.description}</td>
                <td className="py-2.5 px-3 font-mono text-slate-700">{task.lastRun}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {task.status}
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
