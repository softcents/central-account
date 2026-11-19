'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Boxes,
  Clock,
  Globe,
  SlidersHorizontal,
  FilePlus,
  Package,
  Tag,
  Table,
  Server,
  Layers,
  CreditCard,
  Receipt,
  DollarSign,
  Mail,
  HelpCircle,
  AlertCircle,
  Users,
  Shield,
  Key,
  Smartphone,
  Ban,
  Database,
  Search,
  ExternalLink,
  ChevronRight,
  Store,
  CheckCircle2,
} from 'lucide-react';

interface SetupTile {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'apps' | 'users' | 'products' | 'support' | 'security';
  badge?: 'UPDATED' | 'NEW SERVICE';
  icon: any;
  href: string;
}

export default function AdminSetupPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('system');
  const [searchQuery, setSearchQuery] = useState('');

  const tiles: SetupTile[] = [
    // Row 1
    {
      id: 'general',
      name: 'General Settings',
      description: 'General settings and configuration',
      category: 'system',
      icon: Settings,
      href: '/admin/settings?tab=general',
    },
    {
      id: 'apps',
      name: 'Apps & Integrations',
      description: 'Browse available modules and integrations',
      category: 'apps',
      badge: 'UPDATED',
      icon: Boxes,
      href: '/admin/addons',
    },
    {
      id: 'automation',
      name: 'Automation Settings',
      description: 'Timing and automation setup',
      category: 'system',
      badge: 'UPDATED',
      icon: Clock,
      href: '/admin/settings?tab=automation',
    },
    {
      id: 'marketconnect',
      name: 'MarketConnect',
      description: 'Re-sell Market Leading Services',
      category: 'apps',
      badge: 'NEW SERVICE',
      icon: Store,
      href: '/admin/addons',
    },

    // Row 2
    {
      id: 'products',
      name: 'Products/Services',
      description: 'Setup and manage products',
      category: 'products',
      icon: Package,
      href: '/admin/clients/services',
    },
    {
      id: 'config-options',
      name: 'Configurable Options',
      description: 'Manage extras and options for products',
      category: 'products',
      icon: SlidersHorizontal,
      href: '/admin/settings?tab=general',
    },
    {
      id: 'product-addons',
      name: 'Product Addons',
      description: 'Setup and manage product add-ons',
      category: 'products',
      badge: 'UPDATED',
      icon: FilePlus,
      href: '/admin/addons',
    },
    {
      id: 'product-bundles',
      name: 'Product Bundles',
      description: 'Create and manage product bundles',
      category: 'products',
      icon: Boxes,
      href: '/admin/settings?tab=general',
    },

    // Row 3
    {
      id: 'promotions',
      name: 'Promotions and Coupons',
      description: 'Setup and manage promotion codes',
      category: 'products',
      icon: Tag,
      href: '/admin/addons/dynamiccoupon',
    },
    {
      id: 'domain-pricing',
      name: 'Domain Pricing',
      description: 'Setup domain extensions and pricing',
      category: 'products',
      icon: Table,
      href: '/admin/addons/tld_price_updater',
    },
    {
      id: 'servers',
      name: 'Servers',
      description: 'Configure and manage your servers',
      category: 'system',
      icon: Server,
      href: '/admin/servers',
    },
    {
      id: 'addon-modules',
      name: 'Addon Modules',
      description: 'Activate and manage add-on modules',
      category: 'apps',
      icon: Layers,
      href: '/admin/addons',
    },

    // Row 4
    {
      id: 'gateways',
      name: 'Payment Gateways',
      description: 'Setup and configure payment gateways',
      category: 'system',
      icon: CreditCard,
      href: '/admin/settings?tab=gateways',
    },
    {
      id: 'tax',
      name: 'Tax Configuration',
      description: 'Setup tax rules and rates',
      category: 'system',
      icon: Receipt,
      href: '/admin/settings?tab=general',
    },
    {
      id: 'currencies',
      name: 'Currencies',
      description: 'Configure currencies and exchange rates',
      category: 'system',
      icon: DollarSign,
      href: '/admin/settings?tab=general',
    },
    {
      id: 'email-templates',
      name: 'Email Templates',
      description: 'Create and edit email templates',
      category: 'system',
      icon: Mail,
      href: '/admin/settings?tab=general',
    },

    // Row 5
    {
      id: 'support-depts',
      name: 'Support Departments',
      description: 'Manage support ticket departments',
      category: 'support',
      icon: HelpCircle,
      href: '/admin/support',
    },
    {
      id: 'escalations',
      name: 'Ticket Escalations',
      description: 'Setup automated escalation rules',
      category: 'support',
      icon: AlertCircle,
      href: '/admin/support',
    },
    {
      id: 'admin-users',
      name: 'Administrator Users',
      description: 'Manage administrator staff accounts',
      category: 'users',
      icon: Users,
      href: '/admin/settings?tab=admins',
    },
    {
      id: 'admin-roles',
      name: 'Administrator Roles',
      description: 'Manage staff roles and access permissions',
      category: 'users',
      icon: Shield,
      href: '/admin/settings?tab=admins',
    },

    // Row 6
    {
      id: 'api-credentials',
      name: 'API Credentials',
      description: 'Manage API roles and access keys',
      category: 'security',
      icon: Key,
      href: '/admin/oauth',
    },
    {
      id: 'two-factor',
      name: 'Two-Factor Authentication',
      description: 'Configure two-factor auth providers',
      category: 'security',
      icon: Smartphone,
      href: '/admin/security',
    },
    {
      id: 'banned-ips',
      name: 'Banned IPs',
      description: 'Manage banned IP addresses and firewall',
      category: 'security',
      icon: Ban,
      href: '/admin/addons/unblockip',
    },
    {
      id: 'backups',
      name: 'Database Backups',
      description: 'Configure automated daily database backups',
      category: 'system',
      icon: Database,
      href: '/admin/utilities/database',
    },
  ];

  const categories = [
    { id: 'system', name: 'System' },
    { id: 'apps', name: 'Apps & Integrations' },
    { id: 'users', name: 'User Management' },
    { id: 'products', name: 'Products & Services' },
    { id: 'support', name: 'Support' },
    { id: 'security', name: 'API & Security' },
  ];

  const filteredTiles = useMemo(() => {
    return tiles.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'system' ? true : t.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [tiles, selectedCategory, searchQuery]);

  return (
    <div className="font-sans text-[#333] flex gap-5">
      {/* 1. LEFT SIDEBAR (Exact Categories from Screenshot) */}
      <aside className="w-56 shrink-0 hidden md:block">
        <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden text-xs">
          <div className="bg-[#f5f5f5] px-3.5 py-2.5 font-bold text-[#333] border-b border-[#ddd] flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#1A4D80]" />
            <span>Setup Categories</span>
          </div>

          <ul className="py-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3.5 py-2 font-medium transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#eef4fa] text-[#1A4D80] font-bold border-l-4 border-[#1A4D80]'
                        : 'text-[#555] hover:bg-slate-50 hover:text-[#1A4D80]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-[#1A4D80]' : 'text-slate-300'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* 2. MAIN SETUP TILES GRID */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header & Quick Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#ddd] gap-2">
          <div>
            <div className="text-[11px] text-[#666] flex items-center space-x-1">
              <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline">
                Home
              </Link>
              <span>&gt;</span>
              <span className="text-[#333] font-semibold">Configuration</span>
              <span>&gt;</span>
              <span className="text-[#333] font-semibold">System Settings</span>
            </div>
            <h1 className="text-xl font-normal text-[#333] mt-1">System Settings</h1>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] placeholder-[#999] focus:outline-none focus:border-[#1A4D80] shadow-sm"
            />
          </div>
        </div>

        {/* Tiles Grid (4 Columns Exact Replica) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredTiles.map((tile) => {
            const IconComponent = tile.icon;
            return (
              <Link
                key={tile.id}
                href={tile.href}
                className="bg-white border border-[#e5e7eb] rounded-lg p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-[#1A4D80]/50 transition-all group relative overflow-hidden"
              >
                <div>
                  {/* Subtle Top-Right Icon */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded bg-slate-50 text-slate-400 group-hover:text-[#1A4D80] group-hover:bg-[#eef4fa] transition-colors">
                      <IconComponent className="w-5 h-5 stroke-[1.8]" />
                    </div>

                    {/* Badges */}
                    {tile.badge === 'UPDATED' && (
                      <span className="bg-[#00c0ef] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                        UPDATED
                      </span>
                    )}
                    {tile.badge === 'NEW SERVICE' && (
                      <span className="bg-[#00a65a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
                        NEW SERVICE
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[#1A4D80] group-hover:underline text-[13px] leading-tight mb-1">
                    {tile.name}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {tile.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
