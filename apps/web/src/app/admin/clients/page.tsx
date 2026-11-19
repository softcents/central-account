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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  const fetchClients = async () => {
    setLoading(true);
    try {
      // Request up to 500 users from Central Account DB
      const res = await apiFetch<any>('/admin/users?limit=500', {}, token);
      if (res && res.ok && res.data) {
        const apiList = res.data.users || res.data.items || (Array.isArray(res.data) ? res.data : []);
        
        // Merge with full WHMCS synced dataset to ensure all 168+ clients exist
        const whmcsList = whmcsData?.clients || [];
        const mergedMap = new Map<string, any>();

        // First index all WHMCS clients
        whmcsList.forEach((c: any) => {
          mergedMap.set(String(c.id), {
            id: String(c.id),
            name: c.name,
            company: c.company,
            email: c.email,
            phone: c.phone,
            address1: c.address1,
            city: c.city,
            country: c.country,
            status: c.status || 'Active',
            credit: c.credit || '0.00',
            dateCreated: c.dateCreated,
            profile: {
              first_name: c.name?.split(' ')[0] || '',
              last_name: c.name?.split(' ').slice(1).join(' ') || '',
              phone_number: c.phone,
              company_name: c.company,
            },
          });
        });

        // Overlay with API user records
        apiList.forEach((u: any) => {
          const existing = mergedMap.get(String(u.id)) || {};
          mergedMap.set(String(u.id), {
            ...existing,
            ...u,
            id: String(u.id),
            email: u.email || existing.email,
            status: u.status || existing.status || 'ACTIVE',
            created_at: u.created_at || existing.dateCreated,
            profile: {
              first_name: u.profile?.first_name || existing.profile?.first_name || '',
              last_name: u.profile?.last_name || existing.profile?.last_name || '',
              phone_number: u.profile?.phone_number || existing.phone,
              company_name: u.customer_registration?.company_name || existing.company,
            },
          });
        });

        const combined = Array.from(mergedMap.values());
        setClients(combined.length > 0 ? combined : whmcsList);
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

  const rawList = Array.isArray(clients) && clients.length > 0 ? clients : (whmcsData?.clients || []);

  // Compute status counts
  const totalCount = rawList.length;
  const activeCount = rawList.filter((c: any) => {
    const s = String(c?.status || 'ACTIVE').toUpperCase();
    return s === 'ACTIVE';
  }).length;
  const suspendedCount = rawList.filter((c: any) => {
    const s = String(c?.status || '').toUpperCase();
    return s === 'SUSPENDED' || s === 'INACTIVE' || s === 'CLOSED';
  }).length;
  const pendingCount = rawList.filter((c: any) => {
    const s = String(c?.status || '').toUpperCase();
    return s.includes('PENDING') || s === 'WAITING';
  }).length;

  // Filter clients based on status and search query
  const filteredClients = rawList.filter((c: any) => {
    if (!c) return false;
    const status = String(c.status || 'ACTIVE').toUpperCase();
    const matchesStatus =
      statusTab === 'ALL' ||
      (statusTab === 'ACTIVE' && status === 'ACTIVE') ||
      (statusTab === 'SUSPENDED' && (status === 'SUSPENDED' || status === 'INACTIVE' || status === 'CLOSED')) ||
      (statusTab === 'PENDING' && (status.includes('PENDING') || status === 'WAITING'));

    const email = String(c.email || '').toLowerCase();
    const firstName = String(c.profile?.first_name || (c.name ? c.name.split(' ')[0] : (c.firstname || ''))).toLowerCase();
    const lastName = String(c.profile?.last_name || (c.name ? c.name.split(' ').slice(1).join(' ') : (c.lastname || ''))).toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const company = String(c.profile?.company_name || c.company || c.companyname || '').toLowerCase();
    const query = String(searchQuery || '').trim().toLowerCase();
    const idStr = String(c.id || '');
    const phoneStr = String(c.phone || c.profile?.phone_number || '').toLowerCase();

    const matchesSearch =
      !query ||
      email.includes(query) ||
      fullName.includes(query) ||
      company.includes(query) ||
      idStr.includes(query) ||
      phoneStr.includes(query);

    return matchesStatus && matchesSearch;
  });

  // Pagination calculation
  const totalItems = filteredClients.length;
  const effectivePerPage = itemsPerPage === -1 ? (totalItems || 1) : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePerPage));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePerPage;
  const endIndex = itemsPerPage === -1 ? totalItems : Math.min(startIndex + effectivePerPage, totalItems);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const handleTabChange = (tab: 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'PENDING') => {
    setStatusTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1);
  };

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
            View / Search Clients ({totalCount})
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
          <div className="sm:col-span-7 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#555] mr-1">Status:</span>
            <button
              onClick={() => handleTabChange('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'ALL' ? 'bg-[#1A4D80] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              All Clients ({totalCount})
            </button>
            <button
              onClick={() => handleTabChange('ACTIVE')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'ACTIVE' ? 'bg-[#5cb85c] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => handleTabChange('SUSPENDED')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'SUSPENDED' ? 'bg-[#d9534f] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              Suspended / Closed ({suspendedCount})
            </button>
            <button
              onClick={() => handleTabChange('PENDING')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                statusTab === 'PENDING' ? 'bg-[#f0ad4e] text-white' : 'bg-[#eee] text-[#555] hover:bg-[#ddd]'
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>

          <div className="sm:col-span-5 flex items-center justify-end space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search Client ID, Name, Email, Phone..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] placeholder-[#999] focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div className="flex items-center space-x-1 shrink-0 text-xs text-slate-600">
              <span>Show:</span>
              <select
                value={itemsPerPage}
                onChange={handlePerPageChange}
                className="p-1.5 border border-[#ccc] rounded bg-white font-semibold text-xs focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>All ({totalCount})</option>
              </select>
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
                <th className="p-3 font-semibold">Phone</th>
                <th className="p-3 font-semibold">Created Date</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee]">
              {loading && rawList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#999]">
                    <div className="w-6 h-6 border-2 border-[#1A4D80] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading clients directory...
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#777]">
                    <Users className="w-8 h-8 text-[#999] mx-auto mb-2" />
                    <div className="font-bold text-sm text-[#333]">No Clients Found</div>
                    <div className="text-[11px] text-[#999] mt-0.5">
                      No client accounts matching your selected criteria.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client: any, idx: number) => {
                  const idStr = String(client.id || idx + 1);
                  const firstName = client.profile?.first_name || (client.name ? client.name.split(' ')[0] : (client.firstname || '—'));
                  const lastName = client.profile?.last_name || (client.name ? client.name.split(' ').slice(1).join(' ') : (client.lastname || '—'));
                  const company = client.profile?.company_name || client.company || client.companyname || 'Individual';
                  const email = client.email || '—';
                  const phone = client.phone || client.profile?.phone_number || '—';
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

                      <td className="p-3 text-[#666] font-mono text-[11px]">{phone}</td>

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

        {/* Pagination Bar */}
        <div className="bg-[#f9fafb] border-t border-[#ddd] p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800">{endIndex}</strong> of{' '}
            <strong className="text-slate-800">{totalItems}</strong> clients
            {totalCount !== totalItems && ` (filtered from ${totalCount} total)`}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                disabled={validPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-[#ccc] bg-white disabled:opacity-40 hover:bg-slate-100 flex items-center space-x-1 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - validPage) <= 2)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <React.Fragment key={p}>
                      {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1 rounded border font-semibold ${
                          validPage === p
                            ? 'bg-[#1A4D80] text-white border-[#1A4D80]'
                            : 'bg-white text-slate-700 border-[#ccc] hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                disabled={validPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-[#ccc] bg-white disabled:opacity-40 hover:bg-slate-100 flex items-center space-x-1 font-semibold"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
