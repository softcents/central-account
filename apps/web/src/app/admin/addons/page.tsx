'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  ShieldCheck,
  MessageSquare,
  PhoneCall,
  Globe,
  Settings,
  CheckCircle2,
  ExternalLink,
  Power,
  Zap,
  TrendingUp,
  Key,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

export default function AdminAddonsHubPage() {
  const [addons] = useState([
    {
      id: 'kyc',
      name: 'Advanced Client Verification (KYC / NID)',
      category: 'Identity & Security',
      version: 'v2.4 (Enterprise)',
      status: 'Active',
      description: 'Bangladesh National ID (Smart/Old NID), Biometric Face Matching, and Didit OCR verification engine.',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/admin/kyc',
    },
    {
      id: 'wa',
      name: 'WhatsApp Business Alerts Gateway',
      category: 'Messaging',
      version: 'v6.1 (bdhost_wa)',
      status: 'Active',
      description: 'Automated WhatsApp dispatches for invoice generation, overdue reminders, and server provisioning credentials.',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '#',
    },
    {
      id: 'sms',
      name: 'SoftCents SMS Gateway',
      category: 'Messaging',
      version: 'v3.2 (SOFTCENTS_SMS)',
      status: 'Active',
      description: 'Direct SMS delivery with masked sender IDs for OTP, password resets, and critical system alerts.',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '#',
    },
    {
      id: 'italk',
      name: 'Cloud PBX / VoIP Balance & Recharge',
      category: 'Telephony & PBX',
      version: 'v3.0 (italk_recharge)',
      status: 'Active',
      description: 'Real-time call balance query, automatic IP number top-up, and IVR route management.',
      icon: PhoneCall,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '#',
    },
    {
      id: 'domains',
      name: 'Domains Reseller Center',
      category: 'Domain Management',
      version: 'v4.0 (DomainsReseller)',
      status: 'Active',
      description: 'Automated registrar provisioning, EPP code handling, DNS zone editor, and TLD sync.',
      icon: Globe,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/admin/clients/domains',
    },
    {
      id: 'uptime',
      name: 'Uptime PowerTools & Server Guard',
      category: 'Infrastructure',
      version: 'v2.1 (uptime_PowerTools)',
      status: 'Active',
      description: 'Live ping latency tracking, port monitoring (cPanel 2083/2087, PBX 5060), and automated failover.',
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/admin/utilities/automation-status',
    },
    {
      id: 'pricing',
      name: 'Bulk Pricing & Currency Updater',
      category: 'Billing & Rates',
      version: 'v1.8 (bulkpricingupdater)',
      status: 'Active',
      description: 'Synchronize exchange rates (USD to BDT) and batch update package renewals across 149 client services.',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '#',
    },
    {
      id: 'licensing',
      name: 'Product Licensing & Key Generator',
      category: 'Addon Modules',
      version: 'v2.0 (licensing)',
      status: 'Active',
      description: 'Issue and validate remote software licenses, domain bindings, and API token activations.',
      icon: Key,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: '#',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* WHMCS Banner */}
      <div className="bg-[#1A4D80] text-white p-4 rounded-t shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-amber-300" />
            <span>Addon Modules Management Hub</span>
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            Active extensions, communication gateways, VoIP telephony, and infrastructure automation.
          </p>
        </div>
        <div className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded border border-white/20">
          24 WHMCS Modules Loaded
        </div>
      </div>

      {/* Grid of Addons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {addons.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${mod.bgColor} ${mod.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{mod.name}</h3>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{mod.version}</span>
                        <span>•</span>
                        <span>{mod.category}</span>
                      </div>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {mod.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">Integrated</div>
                <Link
                  href={mod.href}
                  className="bg-slate-100 hover:bg-[#1A4D80] hover:text-white text-slate-700 px-3 py-1 rounded text-xs font-semibold transition-colors border border-slate-300 flex items-center space-x-1"
                >
                  <span>Configure Module</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
