'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  Building2,
  Cpu,
  CreditCard,
  FileText,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users Directory', href: '/admin/users', icon: Users },
    { label: 'KYC Reviews', href: '/admin/kyc', icon: UserCheck },
    { label: 'KYB Reviews', href: '/admin/kyb', icon: Building2 },
    { label: 'SaaS Tenants', href: '/admin/tenants', icon: Boxes },
    { label: 'BullMQ Queues', href: '/admin/queues', icon: Cpu },
    { label: 'Support Desk', href: '/admin/support', icon: HelpCircle },
    { label: 'OAuth Clients', href: '/admin/oauth', icon: KeyRound },
    { label: 'Audit Logs', href: '/admin/audit', icon: FileText },
    { label: 'Team & Roles', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
          <Link href="/admin/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">Central Admin</span>
              <span className="block text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                Enterprise Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-white border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile & Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {admin?.firstName} {admin?.lastName}
            </div>
            <div className="text-[10px] text-indigo-400 font-medium truncate uppercase tracking-wider">
              {admin?.role?.replace('_', ' ') || 'SUPER ADMIN'}
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
