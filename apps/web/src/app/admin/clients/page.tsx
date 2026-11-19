'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Download,
  Filter,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';
import whmcsData from '@/data/whmcs_sync.json';

export default function AdminClientsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [clients, setClients] = useState<any[]>(whmcsData?.clients || []);
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/users', {}, token);
      if (res && res.ok && res.data) {
        const list = res.data.users || res.data.items || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(list) && list.length > 0) {
          setClients(list);
        } else if (whmcsData?.clients) {
          setClients(whmcsData.clients);
        }
      } else if (whmcsData?.clients) {
        setClients(whmcsData.clients);
      }
    } catch (e) {
      console.error('Failed to load clients', e);
      if (whmcsData?.clients) {
        setClients(whmcsData.clients);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  const rawList = Array.isArray(clients) ? clients : (whmcsData?.clients || []);

  const filteredClients = rawList.filter((c: any) => {
    if (!c) return false;
    const status = String(c.status || 'ACTIVE').toUpperCase();
    const matchesStatus =
      statusTab === 'ALL' ||
      (statusTab === 'ACTIVE' && status === 'ACTIVE') ||
      (statusTab === 'SUSPENDED' && (status === 'SUSPENDED' || status === 'INACTIVE' || status === 'CLOSED')) ||
      (statusTab === 'PENDING' && (status.includes('PENDING') || status === 'WAITING'));

    const email = String(c.email || '').toLowerCase();
    const name = `${c.profile?.first_name || c.name || c.firstname || ''} ${c.profile?.last_name || c.lastname || ''}`.toLowerCase();
    const company = String(c.profile?.company_name || c.company || c.companyname || '').toLowerCase();
    const query = String(searchQuery || '').trim().toLowerCase();
    const idStr = String(c.id || '');

    const matchesSearch =
      !query ||
      email.includes(query) ||
      name.includes(query) ||
      company.includes(query) ||
      idStr.includes(query);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="font-sans text-[#333] space-y-4">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#ddd] gap-2">
        <div>
          <div className="text-[11px] text-[#666] flex items-center space-x-1">
            <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">Clients</span>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">View/Search Clients</span>
          </div>
          <h1 className="text-xl font-normal text-[#333] mt-1">
            View / Search Clients ({rawList.length})
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/clients/add"
            className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Client</span>
          </Link>

          <button
            onClick={fetchClients}
            disabled={loading}
            className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* WHMCS Search Filter Box */}
      <div className="bg-white border border-[#ddd] rounded shadow-sm p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#555] mr-1">Status:</span>
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'ALL' ? 'bg-[#1A4D80] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              All Clients ({rawList.length})
            </button>
            <button
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'ACTIVE' ? 'bg-[#5cb85c] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusTab('SUSPENDED')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'SUSPENDED' ? 'bg-[#d9534f] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              Suspended / Closed
            </button>
            <button
              onClick={() => setStatusTab('PENDING')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'PENDING' ? 'bg-[#f0ad4e] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              Pending
            </button>
          </div>

          <div className="sm:col-span-4 flex items-center justify-end">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search Client ID, Name, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] placeholder-[#999] focus:outline-none focus:border-[#1A4D80]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* WHMCS Clients Table */}
      <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead style={{ backgroundColor: '#1A4D80', color: '#fff' }}>
              <tr>
                <th className="p-3 font-semibold">ID</th>
                <th className="p-3 font-semibold">First Name</th>
                <th className="p-3 font-semibold">Last Name</th>
                <th className="p-3 font-semibold">Company Name</th>
                <th className="p-3 font-semibold">Email Address</th>
                <th className="p-3 font-semibold">Created Date</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee]">
              {loading && rawList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#999]">
                    <div className="w-6 h-6 border-2 border-[#1A4D80] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading clients directory...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#777]">
                    <Users className="w-8 h-8 text-[#999] mx-auto mb-2" />
                    <div className="font-bold text-sm text-[#333]">No Clients Found</div>
                    <div className="text-[11px] text-[#999] mt-0.5">
                      No client accounts matching your selected criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client: any, idx: number) => {
                  const idStr = String(client.id || idx + 1);
                  const firstName = client.profile?.first_name || (client.name ? client.name.split(' ')[0] : (client.firstname || '—'));
                  const lastName = client.profile?.last_name || (client.name ? client.name.split(' ').slice(1).join(' ') : (client.lastname || '—'));
                  const company = client.profile?.company_name || client.company || client.companyname || 'Individual';
                  const email = client.email || '—';
                  const status = String(client.status || 'ACTIVE').toUpperCase();
                  const dateStr = client.created_at || client.dateCreated || client.datecreated;

                  return (
                    <tr key={idStr} className="hover:bg-[#eff2f9] transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1A4D80]">
                        #{idStr.length > 8 ? idStr.substring(0, 8) : idStr}
                      </td>

                      <td className="p-3 font-medium text-[#333]">{firstName}</td>

                      <td className="p-3 font-medium text-[#333]">{lastName}</td>

                      <td className="p-3 text-[#666]">{company}</td>

                      <td className="p-3">
                        <Link
                          href={`/admin/clients/${idStr}`}
                          className="font-bold text-[#1A4D80] hover:underline"
                        >
                          {email}
                        </Link>
                      </td>

                      <td className="p-3 text-[#666]">
                        {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
                      </td>

                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                            status === 'ACTIVE'
                              ? 'bg-[#5cb85c]'
                              : status === 'SUSPENDED' || status === 'INACTIVE' || status === 'CLOSED'
                              ? 'bg-[#d9534f]'
                              : 'bg-[#f0ad4e]'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/clients/${idStr}`}
                          className="bg-[#1A4D80] hover:bg-[#143d66] text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors inline-block"
                        >
                          Client Summary &raquo;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
