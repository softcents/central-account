'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import {
  BookOpen,
  Search,
  Folder,
  FileText,
  ChevronRight,
  Database,
  Globe,
  HardDrive,
  Mail,
  Server,
  CreditCard,
  PhoneCall,
} from 'lucide-react';

export default function KnowledgebasePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 2001,
      slug: 'backup-restore',
      name: 'Backup/Restore',
      description: 'Tutorial on how to take a backup, Restore backup, and FTP synchronization.',
      articlesCount: 14,
      icon: HardDrive,
    },
    {
      id: 2002,
      slug: 'cpanel-control-panel',
      name: 'cPanel - Control Panel',
      description: 'How to reset cPanel Password, Filemanager, Cronjobs, SSL, and PHP versions.',
      articlesCount: 42,
      icon: Server,
    },
    {
      id: 2003,
      slug: 'databases',
      name: 'Databases',
      description: 'About how to Create, Edit, Delete Database, or Database Username in cPanel/MySQL.',
      articlesCount: 18,
      icon: Database,
    },
    {
      id: 2004,
      slug: 'dns-nameservers',
      name: 'DNS - Nameservers',
      description: 'Update Domain Nameservers at Name.com, Namecheap, GoDaddy, DynaDot, LogicBoxes.',
      articlesCount: 26,
      icon: Globe,
    },
    {
      id: 2005,
      slug: 'domain-management',
      name: 'Domain Management',
      description: 'How to Remove, Add, Edit Addon Domain, Parked Domains, Subdomains & Redirect Domain.',
      articlesCount: 31,
      icon: Globe,
    },
    {
      id: 2006,
      slug: 'email-accounts',
      name: 'Email Configuration',
      description: 'Configure Outlook, Thunderbird, iOS, Android, and webmail SMTP/IMAP settings.',
      articlesCount: 22,
      icon: Mail,
    },
    {
      id: 2007,
      slug: 'billing-invoices',
      name: 'Billing & Payments',
      description: 'How to pay invoices via PipraPay, bKash, Bank Transfer, and manage wallet balance.',
      articlesCount: 15,
      icon: CreditCard,
    },
    {
      id: 2008,
      slug: 'cloud-pbx',
      name: 'Cloud PBX & VoIP',
      description: 'Configuring Zoiper, MicroSIP, Asterisk SIP Trunks, and Voice SMS Campaigns.',
      articlesCount: 19,
      icon: PhoneCall,
    },
  ];

  const popularArticles = [
    {
      id: 2001,
      title: 'How to Generate and Download a Full Backup of Your cPanel Account',
      category: 'Backup/Restore',
      views: 1240,
    },
    {
      id: 2005,
      title: "How to Reset cPanel's Account Password from Client Area",
      category: 'cPanel - Control Panel',
      views: 980,
    },
    {
      id: 2004,
      title: 'How to Update Domain Nameservers to ns12.softcents.com & ns13.softcents.com',
      category: 'DNS - Nameservers',
      views: 850,
    },
    {
      id: 2007,
      title: 'How to Pay Invoices Automatically with bKash, Nagad or Rocket via PipraPay',
      category: 'Billing & Payments',
      views: 1420,
    },
    {
      id: 2008,
      title: 'Configuring SIP Trunk and Same IP Number Voice SMS in SoftCents',
      category: 'Cloud PBX & VoIP',
      views: 630,
    },
  ];

  const filteredArticles = searchQuery
    ? popularArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : popularArticles;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <ClientHeader />
      {/* Top Header & Search Hero */}
      <div className="bg-[#1A4D80] text-white py-12 px-4 shadow-sm">
        <div className="max-w-[1000px] mx-auto text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sky-200 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Self-Service Support</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-xs text-sky-100 max-w-xl mx-auto">
            Search our comprehensive knowledgebase of tutorials, technical guides, and FAQs for hosting, domains, and PBX services.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter a question or keyword to search..."
                className="w-full pl-11 pr-4 py-3 rounded-lg text-slate-900 bg-white placeholder-slate-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-[1240px] mx-auto px-4 py-8 space-y-8">
        {/* Categories Section */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#1A4D80]" />
            Knowledgebase Categories
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/knowledgebase/${cat.slug}`}
                  className="bg-white border border-slate-200 rounded-lg p-5 hover:border-[#1A4D80] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded bg-sky-50 text-[#1A4D80] flex items-center justify-center group-hover:bg-[#1A4D80] group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {cat.articlesCount} articles
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#1A4D80] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#1A4D80]">
                    <span>Browse Articles</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Featured / Popular Articles */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-[#1A4D80]" />
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Most Popular Articles'}
          </h2>

          <div className="divide-y divide-slate-100">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded transition-colors"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/knowledgebase/${art.id}`}
                      className="text-sm font-semibold text-[#1A4D80] hover:underline flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 opacity-60" />
                      <span>{art.title}</span>
                    </Link>
                    <div className="text-[11px] text-slate-400 pl-6">
                      Category: {art.category} • Viewed {art.views} times
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                No articles matched your search query. Please try different keywords or contact our support team.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
