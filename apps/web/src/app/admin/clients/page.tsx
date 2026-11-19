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

export default function AdminClientsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/users', {}, token);
      if (res.ok) {
        setClients(res.data.items || res.data || []);
      }
    } catch (e) {
      console.error('Failed to load clients', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchClients();
  }, [token]);

  const filteredClients = clients.filter((c) => {
    const matchesStatus =
      statusTab === 'ALL' ||
      (statusTab === 'ACTIVE' && c.status === 'ACTIVE') ||
      (statusTab === 'SUSPENDED' && c.status === 'SUSPENDED') ||
      (statusTab === 'PENDING' && ['PENDING', 'PENDING_VERIFICATION'].includes(c.status));

    const email = c.email?.toLowerCase() || '';
    const name = `${c.profile?.first_name || ''} ${c.profile?.last_name || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || email.includes(query) || name.includes(query) || c.id?.includes(query);

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
          <h1 className="text-xl font-normal text-[#333] mt-1">View / Search Clients</h1>
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
              All Clients ({clients.length})
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
              Suspended
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
              {loading ? (
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
                filteredClients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-[#eff2f9] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1A4D80]">
                      #{client.id?.substring(0, 8) || idx + 1}
                    </td>

                    <td className="p-3 font-medium text-[#333]">
                      {client.profile?.first_name || '—'}
                    </td>

                    <td className="p-3 font-medium text-[#333]">
                      {client.profile?.last_name || '—'}
                    </td>

                    <td className="p-3 text-[#666]">
                      {client.profile?.company_name || 'Individual'}
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-bold text-[#1A4D80] hover:underline"
                      >
                        {client.email}
                      </Link>
                    </td>

                    <td className="p-3 text-[#666]">
                      {new Date(client.created_at || Date.now()).toLocaleDateString()}
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                          client.status === 'ACTIVE'
                            ? 'bg-[#5cb85c]'
                            : client.status === 'SUSPENDED'
                            ? 'bg-[#d9534f]'
                            : 'bg-[#f0ad4e]'
                        }`}
                      >
                        {client.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="bg-[#1A4D80] hover:bg-[#143d66] text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                      >
                        Client Summary &raquo;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
