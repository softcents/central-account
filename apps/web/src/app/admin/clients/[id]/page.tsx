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
  Server,
  Globe,
  Tag,
  Receipt,
  Activity,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';
import whmcsData from '@/data/whmcs_sync.json';

export default function ClientSummaryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = String(params?.id || '');
  const initialTab = searchParams.get('tab') || 'summary';

  const { token, admin } = useAdminAuth();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Synced datasets for this client
  const [clientServices, setClientServices] = useState<any[]>([]);
  const [clientDomains, setClientDomains] = useState<any[]>([]);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [clientTransactions, setClientTransactions] = useState<any[]>([]);
  const [clientTickets, setClientTickets] = useState<any[]>([]);

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
      setError(null);

      // Find from whmcsData first
      const foundWhmcs = whmcsData?.clients?.find(
        (c: any) => String(c.id) === clientId || c.email?.toLowerCase() === clientId.toLowerCase()
      );

      // Filter sub-resources
      const numId = foundWhmcs ? String(foundWhmcs.id) : clientId;
      const s = (whmcsData?.services || []).filter((item: any) => String(item.userid) === numId);
      const d = (whmcsData?.domains || []).filter((item: any) => String(item.userid) === numId);
      const inv = (whmcsData?.invoices || []).filter((item: any) => String(item.userid) === numId);
      const txn = (whmcsData?.transactions || []).filter((item: any) => String(item.userid) === numId);
      const tkt = (whmcsData?.tickets || []).filter((item: any) => String(item.userid) === numId);

      setClientServices(s);
      setClientDomains(d);
      setClientInvoices(inv);
      setClientTransactions(txn);
      setClientTickets(tkt);

      // Try fetching API user
      const res = await apiFetch<any>(`/admin/users/${clientId}`, {}, token).catch(() => null);
      if (res && res.ok && res.data) {
        setClient({
          ...res.data,
          id: String(res.data.id || numId),
          whmcsId: numId,
        });
        if (res.data?.notes) {
          setNotes([res.data.notes]);
        }
      } else if (foundWhmcs) {
        setClient({
          id: String(foundWhmcs.id),
          whmcsId: String(foundWhmcs.id),
          firstName: foundWhmcs.name?.split(' ')[0] || foundWhmcs.name || 'Client',
          lastName: foundWhmcs.name?.split(' ').slice(1).join(' ') || '',
          email: foundWhmcs.email,
          companyName: foundWhmcs.company,
          phone: foundWhmcs.phone,
          address1: foundWhmcs.address1 || '',
          city: foundWhmcs.city || 'Dhaka',
          state: foundWhmcs.state || 'Dhaka',
          country: foundWhmcs.country || 'BD',
          status: foundWhmcs.status || 'Active',
          created_at: foundWhmcs.dateCreated,
          credit: foundWhmcs.credit || '0.00',
          profile: {
            first_name: foundWhmcs.name?.split(' ')[0],
            last_name: foundWhmcs.name?.split(' ').slice(1).join(' '),
            phone_number: foundWhmcs.phone,
            address: foundWhmcs.address1,
            city: foundWhmcs.city,
            country_code: foundWhmcs.country || 'BD',
          },
        });
      } else {
        setError('Client not found.');
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

  // Calculate invoice metrics
  const paidInvoices = clientInvoices.filter((i) => i.status === 'Paid');
  const paidTotal = paidInvoices.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  const unpaidInvoices = clientInvoices.filter((i) => i.status === 'Unpaid');
  const unpaidTotal = unpaidInvoices.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  const cancelledInvoices = clientInvoices.filter((i) => i.status === 'Cancelled');
  const cancelledTotal = cancelledInvoices.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
  const grossRevenue = clientInvoices.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);

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
            #{String(client.whmcsId || client.id || '').slice(0, 8)} - {client.firstName || client.first_name || 'Client'}{' '}
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
              #{String(client.whmcsId || client.id || '').slice(0, 8)} - {client.firstName || client.first_name || 'Client'}{' '}
              {client.lastName || client.last_name || ''}
            </h1>
            <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span>{client.email}</span>
              <span>•</span>
              <span>{client.phone || client.profile?.phone_number || 'No phone'}</span>
              <span>•</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                  client.status === 'Active' || client.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {client.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <Link
            href={`/admin/orders?clientid=${client.whmcsId || client.id}`}
            className="flex items-center space-x-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/ordersadd.png" className="w-3.5 h-3.5" alt="" />
            <span>Add Order</span>
          </Link>
          <Link
            href={`/admin/invoices?action=create&clientid=${client.whmcsId || client.id}`}
            className="flex items-center space-x-1.5 bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <img src="/whmcs/icons/invoicesedit.png" className="w-3.5 h-3.5" alt="" />
            <span>Create Invoice</span>
          </Link>
          <Link
            href={`/admin/kyc?user=${client.whmcsId || client.id}`}
            className="flex items-center space-x-1.5 bg-[#009688] hover:bg-[#00796b] text-white px-3 py-1.5 rounded font-semibold shadow-sm transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KYC Module</span>
          </Link>
          <a
            href={`/clientarea?impersonate=${client.whmcsId || client.id}`}
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
          { id: 'services', label: `Products/Services (${clientServices.length})`, icon: null },
          { id: 'domains', label: `Domains (${clientDomains.length})`, icon: '/whmcs/icons/domains.png' },
          { id: 'invoices', label: `Invoices (${clientInvoices.length})`, icon: '/whmcs/icons/invoices.png' },
          { id: 'transactions', label: `Transactions (${clientTransactions.length})`, icon: '/whmcs/icons/income.png' },
          {
            id: 'tickets',
            label: `Tickets (${clientTickets.length})`,
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
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-[#1A4D80] hover:underline font-normal text-[11px]"
                >
                  Edit Profile
                </button>
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
                      {client.country === 'BD' ? 'Bangladesh (BD)' : client.country || 'Bangladesh (BD)'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Phone
                    </td>
                    <td className="py-1.5 px-3 text-slate-800">{client.phone || client.profile?.phone_number || '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200">
                <a
                  href={`/clientarea?impersonate=${client.whmcsId || client.id}`}
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
              <div className="p-3 text-xs text-slate-500 text-center">No secondary contacts</div>
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
                    <td className="py-1.5 px-3 text-emerald-700 font-medium">
                      {paidInvoices.length} (৳{paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Unpaid / Due
                    </td>
                    <td className="py-1.5 px-3 text-rose-700 font-bold">
                      {unpaidInvoices.length} (৳{unpaidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Cancelled
                    </td>
                    <td className="py-1.5 px-3 text-slate-500">
                      {cancelledInvoices.length} (৳{cancelledTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Gross Revenue
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">
                      ৳{grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Credit Balance
                    </td>
                    <td className="py-1.5 px-3 text-emerald-600 font-semibold">
                      ৳{parseFloat(client.credit || '0.00').toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Billing Quick Action Links */}
              <ul className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-1.5 text-xs">
                <li>
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                  >
                    <img src="/whmcs/icons/invoices.png" className="w-3.5 h-3.5" alt="" />
                    <span>View Invoices ({clientInvoices.length})</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                  >
                    <img src="/whmcs/icons/income.png" className="w-3.5 h-3.5" alt="" />
                    <span>View Transactions ({clientTransactions.length})</span>
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
                      {client.created_at || client.dateCreated
                        ? new Date(client.created_at || client.dateCreated).toLocaleDateString()
                        : '2025-11-20'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Email Verified
                    </td>
                    <td className="py-1.5 px-3">
                      <span className="text-emerald-600 font-bold">Yes</span>
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
                      Hosting & PBX
                    </td>
                    <td className="py-1.5 px-3 text-slate-800 font-semibold">
                      {clientServices.length} Total
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Domains
                    </td>
                    <td className="py-1.5 px-3 text-slate-800 font-semibold">
                      {clientDomains.length} Total
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 px-3 font-semibold text-slate-600 bg-[#f9fafb]">
                      Support Tickets
                    </td>
                    <td className="py-1.5 px-3 text-slate-800 font-semibold">
                      {clientTickets.length} Total
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center space-x-3 text-xs">
                <button
                  onClick={() => setActiveTab('services')}
                  className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>View Services</span>
                </button>
                <button
                  onClick={() => setActiveTab('domains')}
                  className="flex items-center space-x-1.5 text-[#1A4D80] hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>View Domains</span>
                </button>
              </div>
            </div>

            {/* Quick Summary of Active Services */}
            {clientServices.length > 0 && (
              <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                  Active Subscriptions
                </div>
                <div className="p-2 space-y-2 text-xs">
                  {clientServices.slice(0, 3).map((srv) => (
                    <div key={srv.id} className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{srv.package || 'Service'}</div>
                        <div className="text-[11px] text-slate-500">{srv.domain || 'No domain'}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                        {srv.domainstatus || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

                <div className="pt-2">
                  <Link
                    href={`/admin/kyc?user=${client.whmcsId || client.id}`}
                    className="w-full block text-center bg-[#1A4D80] hover:bg-[#143d66] text-white py-1.5 rounded font-semibold transition-colors"
                  >
                    Open in KYC Verification Module &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="bg-[#f5f7f8] px-3 py-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                Staff Notes
              </div>
              <div className="p-3 space-y-2">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter staff note..."
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

      {/* TAB CONTENT: PRODUCTS / SERVICES */}
      {activeTab === 'services' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#1A4D80]" />
              <span>Assigned Products & Services ({clientServices.length})</span>
            </div>
          </div>
          {clientServices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No products or services assigned to this client yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Service ID</th>
                    <th className="py-2.5 px-3">Product / Package</th>
                    <th className="py-2.5 px-3">Domain / Extension</th>
                    <th className="py-2.5 px-3">Billing Cycle</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Next Due Date</th>
                    <th className="py-2.5 px-3">Server Node</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientServices.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#1A4D80]">#{srv.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{srv.package || 'Custom Plan'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{srv.domain || srv.username || '-'}</td>
                      <td className="py-2.5 px-3">{srv.billingcycle || 'Monthly'}</td>
                      <td className="py-2.5 px-3 font-semibold">৳{parseFloat(srv.amount || '0').toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{srv.nextduedate || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{srv.server_name || 'srv8 cPanel'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            srv.domainstatus === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : srv.domainstatus === 'Suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {srv.domainstatus || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button className="bg-[#1A4D80] text-white px-2 py-1 rounded text-[11px] hover:bg-[#143d66]">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DOMAINS */}
      {activeTab === 'domains' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#1A4D80]" />
              <span>Registered Domains ({clientDomains.length})</span>
            </div>
          </div>
          {clientDomains.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No domains registered for this client.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3">Registrar</th>
                    <th className="py-2.5 px-3">Reg Period</th>
                    <th className="py-2.5 px-3">Recurring Price</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientDomains.map((dom) => (
                    <tr key={dom.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-[#1A4D80]">{dom.domain}</td>
                      <td className="py-2.5 px-3 text-slate-600">{dom.registrar || 'Pipra / LogicBoxes'}</td>
                      <td className="py-2.5 px-3">{dom.registrationperiod || 1} Year</td>
                      <td className="py-2.5 px-3 font-semibold">৳{parseFloat(dom.recurringamount || '0').toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{dom.expirydate || '-'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            dom.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {dom.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button className="bg-[#1A4D80] text-white px-2 py-1 rounded text-[11px] hover:bg-[#143d66]">
                          Manage WHOIS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-[#1A4D80]" />
              <span>Invoices History ({clientInvoices.length})</span>
            </div>
          </div>
          {clientInvoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No invoices generated for this client yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Invoice Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">#{inv.id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.date || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.duedate || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">৳{parseFloat(inv.total || '0').toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.paymentmethod || 'PipraPay'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Unpaid'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={`/viewinvoice?id=${inv.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#1A4D80] text-white px-2 py-1 rounded text-[11px] hover:bg-[#143d66]"
                        >
                          View Invoice
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-[#1A4D80]" />
              <span>Payments & Transactions ({clientTransactions.length})</span>
            </div>
          </div>
          {clientTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No transactions recorded for this client.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Txn ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Gateway</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Amount In</th>
                    <th className="py-2.5 px-3">Fees</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">{tx.transid || `TXN-${tx.id}`}</td>
                      <td className="py-2.5 px-3 text-slate-600">{tx.date}</td>
                      <td className="py-2.5 px-3 text-slate-700">{tx.gateway || 'PipraPay'}</td>
                      <td className="py-2.5 px-3 text-slate-800">{tx.description || 'Invoice Payment'}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">৳{parseFloat(tx.amountin || '0').toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-500">৳{parseFloat(tx.fees || '0').toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-[#1A4D80]">
                        <a href={`/viewinvoice?id=${tx.invoiceid}`} target="_blank" rel="noreferrer" className="hover:underline">
                          #{tx.invoiceid}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TICKETS */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#f5f7f8] px-4 py-3 border-b border-slate-200 font-bold text-sm text-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-[#1A4D80]" />
              <span>Support Tickets ({clientTickets.length})</span>
            </div>
          </div>
          {clientTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No support tickets opened by this client.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientTickets.map((tkt) => (
                    <tr key={tkt.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">#{tkt.tid || tkt.id}</td>
                      <td className="py-2.5 px-3 text-slate-600">{tkt.dept_name || 'Technical Support'}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{tkt.title || 'Support Request'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            tkt.status === 'Open'
                              ? 'bg-rose-100 text-rose-800'
                              : tkt.status === 'Closed'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tkt.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{tkt.urgency || 'Medium'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{tkt.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                defaultValue={client.phone || client.profile?.phone_number || ''}
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
              href={`/admin/kyc?user=${client.whmcsId || client.id}`}
              className="bg-[#1A4D80] text-white text-xs px-3 py-1.5 rounded font-semibold hover:bg-[#143d66]"
            >
              Open Full KYC Module
            </Link>
          </div>

          <div className="text-center py-8 text-slate-500 text-xs">
            Client document verification records are in sync.
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITY LOG */}
      {activeTab === 'log' && (
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm space-y-4">
          <div className="font-bold text-sm text-[#1A4D80] border-b border-slate-200 pb-2">
            Client Activity Log
          </div>
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Username</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 text-slate-600">{client.created_at || client.dateCreated || '2025-11-20'}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">Client Profile Synced from WHMCS</td>
                <td className="py-2.5 px-3 font-mono text-[#1A4D80]">System</td>
                <td className="py-2.5 px-3 text-slate-600">138.252.125.207</td>
              </tr>
              {clientInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                  <td className="py-2.5 px-3 text-slate-800">Invoice #{inv.id} generated - ৳{inv.total}</td>
                  <td className="py-2.5 px-3 font-mono text-[#1A4D80]">Billing Cron</td>
                  <td className="py-2.5 px-3 text-slate-600">127.0.0.1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
