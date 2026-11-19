'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  FileText,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Plus,
  Send,
  Edit,
  Trash2,
  Lock,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function ClientSummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = params?.id as string;
  const initialTab = searchParams.get('tab') || 'summary';

  const { admin } = useAdminAuth();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Settings toggles
  const [taxExempt, setTaxExempt] = useState('No');
  const [autoCC, setAutoCC] = useState('Yes');
  const [reminders, setReminders] = useState('Yes');
  const [lateFees, setLateFees] = useState('Yes');

  // Notes
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  const fetchClient = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<any>(`/admin/users/${clientId}`);
      setClient(res);
      if (res?.notes) {
        setNotes([res.notes]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([newNote.trim(), ...notes]);
    setNewNote('');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center space-x-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#1A4D80]" />
        <span>Loading Client Summary...</span>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm mb-4">
          {error || 'Client not found.'}
        </div>
        <Link
          href="/admin/clients"
          className="bg-[#1A4D80] text-white px-3 py-1.5 rounded text-xs hover:bg-[#143d66]"
        >
          &larr; Back to Clients List
        </Link>
      </div>
    );
  }

  const kyc = client.identity_verifications?.[0];
  const kycStatus = kyc?.status || client.kyc_status || 'NOT_SUBMITTED';

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto text-slate-800">
      {/* Top Breadcrumb & Status Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2 text-xs">
          <Link href="/admin/clients" className="text-[#1A4D80] hover:underline font-semibold">
            Clients
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-700">
            #{client.id.slice(0, 8)} - {client.firstName || client.first_name || 'Client'}{' '}
            {client.lastName || client.last_name || ''}
          </span>
        </div>

        {/* WHMCS csajaxtoggle top toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
          <div>
            Tax Exempt:{' '}
            <button
              onClick={() => setTaxExempt(taxExempt === 'Yes' ? 'No' : 'Yes')}
              className={`font-bold underline cursor-pointer ${
                taxExempt === 'Yes' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {taxExempt}
            </button>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            Auto CC:{' '}
            <button
              onClick={() => setAutoCC(autoCC === 'Yes' ? 'No' : 'Yes')}
              className={`font-bold underline cursor-pointer ${
                autoCC === 'Yes' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {autoCC}
            </button>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            Overdue Notices:{' '}
            <button
              onClick={() => setReminders(reminders === 'Yes' ? 'No' : 'Yes')}
              className={`font-bold underline cursor-pointer ${
                reminders === 'Yes' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {reminders}
            </button>
          </div>
          <span className="text-slate-300">|</span>
          <div>
            Late Fees:{' '}
            <button
              onClick={() => setLateFees(lateFees === 'Yes' ? 'No' : 'Yes')}
              className={`font-bold underline cursor-pointer ${
                lateFees === 'Yes' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {lateFees}
            </button>
          </div>
        </div>
      </div>

      {/* WHMCS Client Title Bar */}
      <div className="bg-white p-3 rounded border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#1A4D80] text-white flex items-center justify-center font-bold text-base shadow">
            {client.firstName?.[0] || client.email?.[0] || 'C'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              #{client.id.slice(0, 8)} - {client.firstName || client.first_name || 'Client'}{' '}
              {client.lastName || client.last_name || ''}
            </h1>
            <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span>{client.email}</span>
              <span>•</span>
              <span>{client.phone || 'No phone'}</span>
              <span>•</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                  client.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {client.status || 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <Link
            href={`/admin/orders/add?clientid=${client.id}`}
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/ordersadd.png" className="w-3.5 h-3.5" alt="" />
            <span>Add Order</span>
          </Link>
          <Link
            href={`/admin/invoices?action=create&clientid=${client.id}`}
            className="flex items-center space-x-1.5 bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/invoicesedit.png" className="w-3.5 h-3.5" alt="" />
            <span>Create Invoice</span>
          </Link>
          <Link
            href={`/admin/kyc?user=${client.id}`}
            className="flex items-center space-x-1.5 bg-[#009688] hover:bg-[#00796b] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KYC Module</span>
          </Link>
          <a
            href={`/clientarea?impersonate=${client.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded font-medium shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/clientlogin.png" className="w-3.5 h-3.5" alt="" />
            <span>Login as Client</span>
          </a>
        </div>
      </div>

      {/* WHMCS Nav Tabs (.nav-tabs style) */}
      <div className="border-b border-slate-300 flex flex-wrap gap-1 text-xs font-semibold">
        {[
          { id: 'summary', label: 'Summary', icon: '/whmcs/icons/clients.png' },
          { id: 'profile', label: 'Profile', icon: null },
          { id: 'services', label: `Products/Services (0)`, icon: null },
          { id: 'domains', label: `Domains (0)`, icon: '/whmcs/icons/domains.png' },
          { id: 'invoices', label: `Invoices (0)`, icon: '/whmcs/icons/invoices.png' },
          { id: 'transactions', label: `Transactions (0)`, icon: '/whmcs/icons/income.png' },
          {
            id: 'tickets',
            label: `Tickets (${client.support_tickets?.length || 0})`,
            icon: '/whmcs/icons/tickets.png',
          },
          {
            id: 'kyc',
            label: `KYC Verification (${kycStatus})`,
            icon: null,
            badge:
              kycStatus === 'VERIFIED'
                ? 'bg-emerald-600 text-white'
                : kycStatus === 'REJECTED'
                ? 'bg-rose-600 text-white'
                : 'bg-amber-500 text-white',
          },
          { id: 'log', label: 'Activity Log', icon: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-t border-t border-l border-r transition-colors ${
              activeTab === tab.id
                ? 'bg-white border-slate-300 border-b-white -mb-px text-[#1A4D80] font-bold shadow-sm'
                : 'bg-[#eef2f5] border-transparent text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.icon && <img src={tab.icon} className="w-3.5 h-3.5" alt="" />}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${tab.badge}`}>
                ●
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: SUMMARY (WHMCS 4-Column Box Grid) */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* COLUMN 1: Client Information & Contacts */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Client Information</span>
                <Link
                  href={`/admin/clients/${client.id}?tab=profile`}
                  className="text-[#1A4D80] hover:underline font-normal text-[11px]"
                >
                  Edit Profile
                </Link>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="w-28 py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      First Name
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {client.firstName || client.first_name || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-white">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Last Name
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {client.lastName || client.last_name || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Company
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">{client.companyName || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Email
                    </td>
                    <td className="py-1.5 px-3 text-[#1A4D80] font-medium break-all">
                      {client.email}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Address 1
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {client.address1 || client.profile?.address || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      City / State
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {client.city || 'Dhaka'}, {client.state || 'Dhaka'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Country
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {client.country || 'Bangladesh (BD)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Phone
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">{client.phone || '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200">
                <a
                  href={`/clientarea?impersonate=${client.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 text-xs text-[#1A4D80] font-semibold hover:underline"
                >
                  <img src="/whmcs/icons/clientlogin.png" className="w-3.5 h-3.5" alt="" />
                  <span>Login as Owner</span>
                </a>
              </div>
            </div>

            {/* Contacts & Sub-Accounts */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800 flex items-center justify-between">
                <span>Contacts / Sub-Accounts</span>
                <span className="text-slate-400 font-normal text-[11px]">0 Contacts</span>
              </div>
              <div className="p-3 text-xs text-slate-500 text-center">No contacts found</div>
              <div className="p-2 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  className="flex items-center space-x-1.5 text-xs text-[#1A4D80] font-semibold hover:underline"
                >
                  <img src="/whmcs/icons/clientsadd.png" className="w-3.5 h-3.5" alt="" />
                  <span>Add Contact</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Invoices / Billing stats */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Billing & Invoices
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">Paid</td>
                    <td className="py-1.5 px-3 text-emerald-700 font-medium">0 (৳0.00)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">Draft</td>
                    <td className="py-1.5 px-3 text-slate-600">0 (৳0.00)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Unpaid / Due
                    </td>
                    <td className="py-1.5 px-3 text-rose-700 font-bold">0 (৳0.00)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Cancelled
                    </td>
                    <td className="py-1.5 px-3 text-slate-500">0 (৳0.00)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Gross Revenue
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">৳0.00</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Credit Balance
                    </td>
                    <td className="py-1.5 px-3 text-emerald-600 font-semibold">৳0.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Billing Quick Action Links */}
              <ul className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-1.5 text-xs">
                <li>
                  <Link
                    href={`/admin/invoices?action=create&clientid=${client.id}`}
                    className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                  >
                    <img src="/whmcs/icons/invoicesedit.png" className="w-3.5 h-3.5" alt="" />
                    <span>Create Invoice</span>
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                  >
                    <img src="/whmcs/icons/addfunds.png" className="w-3.5 h-3.5" alt="" />
                    <span>Create Add Funds Invoice</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                  >
                    <img src="/whmcs/icons/billableitems.png" className="w-3.5 h-3.5" alt="" />
                    <span>Add Billable Item</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Other Information */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Other Information
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="w-28 py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Status
                    </td>
                    <td className="py-1.5 px-3 font-bold text-emerald-700">
                      {client.status || 'Active'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Sign Up Date
                    </td>
                    <td className="py-1.5 px-3 text-slate-700">
                      {client.created_at
                        ? new Date(client.created_at).toLocaleDateString()
                        : '20/11/2026'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Last Login
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 font-mono text-[11px]">
                      {client.sessions?.[0]?.created_at
                        ? new Date(client.sessions[0].created_at).toLocaleString()
                        : 'Never'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Email Verified
                    </td>
                    <td className="py-1.5 px-3">
                      {client.email_verified || client.security?.email_verified ? (
                        <span className="text-emerald-600 font-bold">Yes</span>
                      ) : (
                        <span className="text-amber-600 font-bold">No</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMN 3: Products / Services */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Products / Services
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Shared Hosting
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">0 (0 Total)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Reseller Hosting
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">0 (0 Total)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      VPS / Dedicated
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">0 (0 Total)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Domains
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">0 (0 Total)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Support Tickets
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">
                      {client.support_tickets?.length || 0} Total
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center space-x-3 text-xs">
                <Link
                  href={`/admin/orders?clientid=${client.id}`}
                  className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                >
                  <img src="/whmcs/icons/orders.png" className="w-3.5 h-3.5" alt="" />
                  <span>View Orders</span>
                </Link>
                <Link
                  href={`/admin/orders/add?clientid=${client.id}`}
                  className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                >
                  <img src="/whmcs/icons/ordersadd.png" className="w-3.5 h-3.5" alt="" />
                  <span>Add New Order</span>
                </Link>
              </div>
            </div>

            {/* Files Panel */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Client Files
              </div>
              <div className="p-3 text-xs text-slate-500 text-center">No files uploaded</div>
              <div className="p-2 bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  className="flex items-center space-x-1.5 text-xs text-[#1A4D80] hover:underline font-semibold"
                >
                  <img src="/whmcs/icons/add.png" className="w-3.5 h-3.5" alt="" />
                  <span>Add File</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 4: KYC Verification & Admin Notes & Actions */}
          <div className="space-y-4">
            {/* Dedicated KYC Verification Box */}
            <div className="bg-white border border-blue-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#1A4D80] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Document Verification</span>
                </div>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono uppercase">
                  Module
                </span>
              </div>
              <div className="p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Verification Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      kycStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : kycStatus === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {kycStatus}
                  </span>
                </div>
                {kyc?.document_type && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Document:</span>
                    <span className="font-semibold text-slate-800">{kyc.document_type}</span>
                  </div>
                )}
                {kyc?.face_verifications?.[0]?.similarity_score && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Face Match Score:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {Math.round(kyc.face_verifications[0].similarity_score * 100)}%
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/admin/kyc?user=${client.id}`}
                    className="w-full block text-center bg-[#1A4D80] hover:bg-[#143d66] text-white py-1.5 rounded font-semibold transition-colors"
                  >
                    Open in KYC Verification Module &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Actions
              </div>
              <div className="p-2 space-y-1 text-xs">
                <button
                  type="button"
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-[#1A4D80] flex items-center space-x-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
                <button
                  type="button"
                  className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-[#1A4D80] flex items-center space-x-1.5"
                >
                  <img src="/whmcs/icons/massmail.png" className="w-3.5 h-3.5" alt="" />
                  <span>Close Client's Account</span>
                </button>
                <button
                  type="button"
                  className="w-full text-left px-2 py-1 rounded hover:bg-red-50 text-rose-600 flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Client's Account</span>
                </button>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Admin Notes
              </div>
              <div className="p-3 space-y-2">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter internal staff note..."
                    className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1A4D80]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    Add Note
                  </button>
                </form>

                {notes.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto">
                    {notes.map((note, i) => (
                      <div
                        key={i}
                        className="bg-amber-50/50 border border-amber-200/50 p-2 rounded text-[11px] text-slate-700"
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
          <div className="font-bold text-sm text-[#1A4D80] border-b border-slate-200 pb-2">
            Client Profile Information
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">First Name</label>
              <input
                type="text"
                defaultValue={client.firstName || client.first_name || ''}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Last Name</label>
              <input
                type="text"
                defaultValue={client.lastName || client.last_name || ''}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Company Name</label>
              <input
                type="text"
                defaultValue={client.companyName || ''}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                defaultValue={client.email}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Address 1</label>
              <input
                type="text"
                defaultValue={client.address1 || client.profile?.address || ''}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">City</label>
              <input
                type="text"
                defaultValue={client.city || 'Dhaka'}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                defaultValue={client.phone || ''}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Country</label>
              <select
                defaultValue={client.country || 'BD'}
                className="w-full p-2 border border-slate-300 rounded bg-white"
              >
                <option value="BD">Bangladesh</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
              </select>
            </div>
            <div className="col-span-full pt-3">
              <button
                type="button"
                className="bg-[#1A4D80] text-white px-5 py-2 rounded font-semibold text-xs hover:bg-[#143d66]"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: KYC DIRECT EMBED */}
      {activeTab === 'kyc' && (
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-[#1A4D80] flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>KYC Identity Verification Details</span>
              </h2>
              <p className="text-xs text-slate-500">
                OCR inspection, national ID data, and facial biometric verification for this client.
              </p>
            </div>
            <Link
              href={`/admin/kyc?user=${client.id}`}
              className="bg-[#1A4D80] text-white text-xs px-3 py-1.5 rounded font-semibold hover:bg-[#143d66]"
            >
              Open Full KYC Module
            </Link>
          </div>

          {client.identity_verifications?.length > 0 ? (
            <div className="space-y-4">
              {client.identity_verifications.map((item: any, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700">
                      Attempt #{idx + 1} - {item.document_type || 'NID'}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                        item.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded">
                    <div>
                      <span className="text-slate-500 block">Submitted:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Face Similarity:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {item.face_verifications?.[0]?.similarity_score
                          ? `${Math.round(item.face_verifications[0].similarity_score * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Liveness Score:</span>
                      <span className="font-bold text-indigo-700 font-mono">
                        {item.liveness_verifications?.[0]?.confidence_score
                          ? `${Math.round(item.liveness_verifications[0].confidence_score * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No identity verification documents submitted for this client yet.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SERVICES / DOMAINS / INVOICES / TRANSACTIONS / TICKETS PLACEHOLDERS */}
      {['services', 'domains', 'invoices', 'transactions', 'tickets', 'log'].includes(
        activeTab
      ) && (
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700 mb-1">
            {activeTab.toUpperCase()} Records for #{client.id.slice(0, 8)}
          </p>
          <p>No records found in this category.</p>
        </div>
      )}
    </div>
  );
}
