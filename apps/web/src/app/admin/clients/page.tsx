'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronDown,
  ArrowUpDown,
  Box,
  Share2,
  Server,
  Globe,
  Tag,
  Receipt,
  Activity,
  UserCheck,
  ChevronUp,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';
import whmcsData from '@/data/whmcs_sync.json';

function formatWhmcsDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y.length === 4 && m.length <= 2 && d.length <= 2) {
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function AdminClientsPage() {
  const { token } = useAdminAuth();
  const router = useRouter();

  // Search Filter Form States
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterGroup, setFilterGroup] = useState('Any');
  const [filterStatus, setFilterStatus] = useState('Any');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hideInactive, setHideInactive] = useState(true);

  // Advanced Filters
  const [filterAddress, setFilterAddress] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCountry, setFilterCountry] = useState('Any');

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [jumpToPageToggle, setJumpToPageToggle] = useState(true);

  // Selected Clients for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Base Clients from WHMCS Data
  const baseWhmcsList = useMemo(() => {
    return (whmcsData?.clients || []).map((c: any) => ({
      id: String(c.id),
      numericId: parseInt(c.id, 10) || 0,
      firstname: (c.firstname || (c.name ? c.name.split(' ')[0] : '')).trim(),
      lastname: (c.lastname || (c.name ? c.name.split(' ').slice(1).join(' ') : '')).trim(),
      companyname: (c.companyname || c.company || '').trim(),
      email: (c.email || '').trim().toLowerCase(),
      phonenumber: (c.phonenumber || c.phone || '').trim(),
      datecreated: c.datecreated || c.dateCreated || '',
      status: c.status || 'Active',
      services_count: c.services_count || `${c.active_services || 0} (${c.total_services || 0})`,
      active_services: parseInt(c.active_services || 0, 10),
      total_services: parseInt(c.total_services || 0, 10),
      credit: c.credit || '0.00',
      address1: c.address1 || '',
      city: c.city || '',
      country: c.country || 'BD',
    }));
  }, []);

  const [clients, setClients] = useState<any[]>(baseWhmcsList);

  // Fetch updated records from API & overlay
  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/users?limit=500', {}, token);
      if (res && res.ok && res.data) {
        const apiList = res.data.users || res.data.items || (Array.isArray(res.data) ? res.data : []);
        
        // Map WHMCS clients by email & id
        const emailMap = new Map<string, any>();
        baseWhmcsList.forEach((c) => {
          if (c.email) emailMap.set(c.email, { ...c });
        });

        // Overlay any new database user accounts that might have registered on Central Account
        apiList.forEach((u: any) => {
          const uEmail = (u.email || '').trim().toLowerCase();
          if (uEmail && !emailMap.has(uEmail)) {
            // New user not present in WHMCS
            const fname = u.profile?.first_name || u.customer_registration?.full_name?.split(' ')[0] || 'User';
            const lname = u.profile?.last_name || u.customer_registration?.full_name?.split(' ').slice(1).join(' ') || '';
            const cname = u.customer_registration?.company_name || '';
            const phone = u.profile?.phone_number || u.customer_registration?.phone_number || '';
            const dcreated = u.created_at ? u.created_at.split('T')[0] : '';
            
            emailMap.set(uEmail, {
              id: String(u.id).substring(0, 8),
              numericId: 999999,
              firstname: fname,
              lastname: lname,
              companyname: cname,
              email: uEmail,
              phonenumber: phone,
              datecreated: dcreated,
              status: u.status === 'ACTIVE' ? 'Active' : (u.status || 'Active'),
              services_count: '0 (0)',
              active_services: 0,
              total_services: 0,
              credit: '0.00',
              address1: '',
              city: '',
              country: u.profile?.country_code || 'BD',
            });
          }
        });

        const combined = Array.from(emailMap.values());
        setClients(combined);
      }
    } catch (e) {
      console.error('Failed to sync api clients', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [token]);

  // Compute Inactive Count (Inactive, Closed, Suspended)
  const inactiveCount = useMemo(() => {
    return clients.filter((c) => {
      const s = String(c.status || '').toLowerCase();
      return s === 'inactive' || s === 'closed' || s === 'suspended';
    }).length;
  }, [clients]);

  // Apply Search & Filters
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Hide Inactive Clients Filter
      if (hideInactive) {
        const s = String(c.status || '').toLowerCase();
        if (s === 'inactive' || s === 'closed') {
          return false;
        }
      }

      // Status Dropdown Filter
      if (filterStatus !== 'Any') {
        const s = String(c.status || '').toLowerCase();
        if (filterStatus.toLowerCase() !== s) {
          return false;
        }
      }

      // Name / Company Filter
      if (filterName.trim()) {
        const q = filterName.trim().toLowerCase();
        const fname = String(c.firstname || '').toLowerCase();
        const lname = String(c.lastname || '').toLowerCase();
        const cname = String(c.companyname || '').toLowerCase();
        const fullName = `${fname} ${lname}`.trim();
        if (!fname.includes(q) && !lname.includes(q) && !cname.includes(q) && !fullName.includes(q)) {
          return false;
        }
      }

      // Email Filter
      if (filterEmail.trim()) {
        const q = filterEmail.trim().toLowerCase();
        if (!String(c.email || '').toLowerCase().includes(q)) {
          return false;
        }
      }

      // Phone Filter
      if (filterPhone.trim()) {
        const q = filterPhone.trim().replace(/[^0-9]/g, '');
        const phone = String(c.phonenumber || '').replace(/[^0-9]/g, '');
        if (!phone.includes(q)) {
          return false;
        }
      }

      // Advanced Filters
      if (showAdvanced) {
        if (filterAddress.trim()) {
          const q = filterAddress.trim().toLowerCase();
          if (!String(c.address1 || '').toLowerCase().includes(q)) return false;
        }
        if (filterCity.trim()) {
          const q = filterCity.trim().toLowerCase();
          if (!String(c.city || '').toLowerCase().includes(q)) return false;
        }
        if (filterCountry !== 'Any') {
          if (String(c.country || '').toUpperCase() !== filterCountry.toUpperCase()) return false;
        }
      }

      return true;
    });
  }, [clients, hideInactive, filterStatus, filterName, filterEmail, filterPhone, showAdvanced, filterAddress, filterCity, filterCountry]);

  // Apply Sorting
  const sortedClients = useMemo(() => {
    const list = [...filteredClients];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'id') {
        valA = a.numericId || parseInt(a.id, 10) || 0;
        valB = b.numericId || parseInt(b.id, 10) || 0;
      } else if (sortField === 'services') {
        valA = a.total_services || 0;
        valB = b.total_services || 0;
      } else if (sortField === 'datecreated') {
        valA = new Date(a.datecreated || 0).getTime();
        valB = new Date(b.datecreated || 0).getTime();
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredClients, sortField, sortOrder]);

  // Pagination Variables
  const totalRecords = sortedClients.length;
  const effectivePerPage = itemsPerPage === -1 ? totalRecords || 1 : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalRecords / effectivePerPage));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * effectivePerPage;
  const endIndex = itemsPerPage === -1 ? totalRecords : Math.min(startIndex + effectivePerPage, totalRecords);
  const paginatedClients = sortedClients.slice(startIndex, endIndex);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Checkbox Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedClients.map((c) => String(c.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex gap-4 font-sans text-[#333]">
      {/* 1. WHMCS LEFT SIDEBAR */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-12' : 'w-56'
        } shrink-0 transition-all duration-200 hidden md:flex flex-col gap-3 select-none`}
      >
        {!sidebarCollapsed ? (
          <div className="bg-white border border-[#ddd] rounded shadow-sm text-xs overflow-hidden">
            {/* Clients Menu */}
            <div className="border-b border-[#ddd]">
              <div className="bg-[#f5f5f5] px-3 py-2 font-bold text-[#333] flex items-center space-x-2 border-b border-[#eee]">
                <Users className="w-3.5 h-3.5 text-[#1A4D80]" />
                <span>Clients</span>
              </div>
              <ul className="py-1">
                <li>
                  <Link
                    href="/admin/clients"
                    className="block px-3 py-1.5 font-bold text-[#1A4D80] bg-[#eef4fa] border-l-2 border-[#1A4D80]"
                  >
                    View/Search Clients
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/add"
                    className="block px-3 py-1.5 text-[#555] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    Add New Client
                  </Link>
                </li>
              </ul>
            </div>

            {/* Products/Services Menu */}
            <div className="border-b border-[#ddd]">
              <div className="bg-[#f5f5f5] px-3 py-2 font-bold text-[#333] flex items-center space-x-2 border-b border-[#eee]">
                <Box className="w-3.5 h-3.5 text-[#1A4D80]" />
                <span>Products/Services</span>
              </div>
              <ul className="py-1 text-[11px]">
                <li>
                  <Link
                    href="/admin/clients/services"
                    className="block px-3 py-1 text-[#555] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    List All Products/Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/services?type=hosting"
                    className="block px-4 py-1 text-[#666] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    - Shared Hosting
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/services?type=reseller"
                    className="block px-4 py-1 text-[#666] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    - Reseller Accounts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/services?type=vps"
                    className="block px-4 py-1 text-[#666] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    - VPS/Servers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/services?type=other"
                    className="block px-4 py-1 text-[#666] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    - Other Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/addons"
                    className="block px-3 py-1 text-[#555] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    Service Addons
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/domains"
                    className="block px-3 py-1 text-[#555] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    Domain Registrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/clients/cancellations"
                    className="block px-3 py-1 text-[#555] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    Cancellation Requests
                  </Link>
                </li>
              </ul>
            </div>

            {/* Affiliates Menu */}
            <div className="border-b border-[#ddd]">
              <div className="bg-[#f5f5f5] px-3 py-2 font-bold text-[#333] flex items-center space-x-2 border-b border-[#eee]">
                <Share2 className="w-3.5 h-3.5 text-[#1A4D80]" />
                <span>Affiliates</span>
              </div>
              <ul className="py-1 text-[11px]">
                <li>
                  <Link
                    href="/admin/clients/affiliates"
                    className="block px-3 py-1.5 text-[#555] hover:text-[#1A4D80] hover:bg-slate-50"
                  >
                    Manage Affiliates
                  </Link>
                </li>
              </ul>
            </div>

            {/* Advanced Search Box */}
            <div className="border-b border-[#ddd] p-3">
              <div className="font-bold text-[#333] flex items-center space-x-1.5 mb-2">
                <Filter className="w-3.5 h-3.5 text-[#1A4D80]" />
                <span>Advanced Search</span>
              </div>
              <select className="w-full text-xs p-1.5 border border-[#ccc] rounded mb-2 bg-white text-[#333] focus:outline-none focus:border-[#1A4D80]">
                <option value="clients">Clients</option>
                <option value="orders">Orders</option>
                <option value="services">Services</option>
                <option value="domains">Domains</option>
                <option value="invoices">Invoices</option>
                <option value="tickets">Tickets</option>
              </select>
              <input
                type="text"
                placeholder="Client Name"
                className="w-full text-xs p-1.5 border border-[#ccc] rounded mb-2 bg-white text-[#333] focus:outline-none focus:border-[#1A4D80]"
              />
              <button className="w-full bg-[#1A4D80] hover:bg-[#163f68] text-white font-bold py-1 px-2 rounded text-xs transition-colors">
                Search
              </button>
            </div>

            {/* Staff Online */}
            <div className="p-3 bg-[#fafafa]">
              <div className="font-bold text-[#333] flex items-center space-x-1.5 mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#5cb85c]" />
                <span>Staff Online</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-[#555]">
                <span className="w-2 h-2 rounded-full bg-[#5cb85c]"></span>
                <span className="font-semibold text-[#333]">raju</span>
              </div>
            </div>

            {/* Minimise Sidebar Button */}
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="w-full bg-[#f5f5f5] hover:bg-[#e9e9e9] border-t border-[#ddd] py-1.5 text-center text-[11px] text-[#666] font-semibold transition-colors"
            >
              « Minimise Sidebar
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[#ddd] rounded shadow-sm py-2 flex flex-col items-center space-y-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-1.5 hover:bg-slate-100 rounded text-[#1A4D80]"
              title="Expand Sidebar"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* 2. MAIN CLIENTS CONTENT AREA */}
      <div className="flex-1 min-w-0 space-y-3.5">
        {/* Page Title Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-normal text-[#333] tracking-tight">
            View/Search Clients
          </h1>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin/clients/add"
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-sm transition-colors"
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

        {/* Search Filter Box (Exact WHMCS Box from Screenshot) */}
        <div className="bg-[#fbfbfb] border border-[#ddd] rounded p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Green Circular Search Icon */}
            <div className="shrink-0 hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-[#6db33f] text-white shadow-inner">
              <Search className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Form Inputs Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {/* 1. Client / Company Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Client/Company Name
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => {
                    setFilterName(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-[#ccc] rounded px-2.5 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              {/* 2. Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  value={filterEmail}
                  onChange={(e) => {
                    setFilterEmail(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-[#ccc] rounded px-2.5 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                />
              </div>

              {/* 3. Phone Number with Flag Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="inline-flex items-center px-2 border border-r-0 border-[#ccc] bg-[#eee] text-xs text-[#555] rounded-l">
                    <span>🇧🇩 +880</span>
                  </div>
                  <input
                    type="text"
                    placeholder="01711-..."
                    value={filterPhone}
                    onChange={(e) => {
                      setFilterPhone(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white border border-[#ccc] rounded-r px-2 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                  />
                </div>
              </div>

              {/* 4. Client Group */}
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Client Group
                </label>
                <select
                  value={filterGroup}
                  onChange={(e) => {
                    setFilterGroup(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-[#ccc] rounded px-2 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                >
                  <option value="Any">Any</option>
                  <option value="VIP">VIP Clients</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              {/* 5. Status */}
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-[#ccc] rounded px-2 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                >
                  <option value="Any">Any</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Actions: + Advanced & Search */}
            <div className="shrink-0 flex items-end gap-1.5 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="bg-white hover:bg-slate-50 border border-[#ccc] text-[#333] font-semibold text-xs px-2.5 py-1.5 rounded flex items-center space-x-1"
              >
                <span>{showAdvanced ? '- Simple' : '+ Advanced'}</span>
              </button>

              <button
                type="button"
                className="bg-[#1A4D80] hover:bg-[#163f68] text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center space-x-1.5 shadow-sm transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Expandable Advanced Options */}
          {showAdvanced && (
            <div className="mt-3 pt-3 border-t border-[#eee] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">Address / Street</label>
                <input
                  type="text"
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                  className="w-full bg-white border border-[#ccc] rounded px-2.5 py-1 text-xs text-[#333]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">City</label>
                <input
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full bg-white border border-[#ccc] rounded px-2.5 py-1 text-xs text-[#333]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">Country</label>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full bg-white border border-[#ccc] rounded px-2.5 py-1 text-xs text-[#333]"
                >
                  <option value="Any">Any</option>
                  <option value="BD">Bangladesh (BD)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sub-bar: Records Count & Page Controls (Exact WHMCS sub-bar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#555] py-1">
          <div className="font-semibold text-[#444]">
            {totalRecords} Records Found, Showing {totalRecords === 0 ? 0 : startIndex + 1} to {endIndex}
          </div>

          <div className="flex items-center space-x-2">
            {/* Jump to Page Toggle Button */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-[#666]">Jump to Page:</span>
              <button
                onClick={() => setJumpToPageToggle(!jumpToPageToggle)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  jumpToPageToggle ? 'bg-[#1A4D80] text-white' : 'bg-[#ddd] text-[#666]'
                }`}
              >
                ON
              </button>
            </div>

            {/* Hide Inactive Clients Button */}
            <button
              onClick={() => setHideInactive(!hideInactive)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                hideInactive
                  ? 'bg-[#1A4D80] text-white border-[#1A4D80]'
                  : 'bg-white hover:bg-[#eee] text-[#555] border-[#ccc]'
              }`}
            >
              Hide Inactive Clients ({inactiveCount})
            </button>

            {/* Jump To Page Dropdown */}
            {totalPages > 1 && (
              <select
                value={validPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                className="bg-white border border-[#ccc] text-[#333] font-semibold text-xs rounded px-2 py-1 focus:outline-none"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {/* Items Per Page Selector */}
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-[#666]">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#ccc] text-[#333] font-semibold text-xs rounded px-2 py-1 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>All ({totalRecords})</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. CLIENTS TABLE (1:1 Match to Screenshot) */}
        <div className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              {/* WHMCS Dark Blue Table Header */}
              <thead style={{ backgroundColor: '#1A4D80', color: '#ffffff' }}>
                <tr className="border-b border-[#133c66]">
                  <th className="p-2.5 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedClients.length > 0 && selectedIds.length === paginatedClients.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>

                  <th
                    onClick={() => handleSort('id')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      {sortField === 'id' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('firstname')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>First Name</span>
                      {sortField === 'firstname' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('lastname')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Name</span>
                      {sortField === 'lastname' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('companyname')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Company Name</span>
                      {sortField === 'companyname' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('email')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email Address</span>
                      {sortField === 'email' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('services')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68] text-center"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Services</span>
                      {sortField === 'services' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('datecreated')}
                    className="p-2.5 font-bold cursor-pointer select-none hover:bg-[#163f68]"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {sortField === 'datecreated' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>

                  <th className="p-2.5 font-bold text-center">
                    Status
                  </th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-[#eee]">
                {loading && paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#777]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1A4D80]" />
                      Loading clients directory...
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#777]">
                      <Users className="w-8 h-8 text-[#999] mx-auto mb-2" />
                      <div className="font-bold text-sm text-[#333]">No Clients Found</div>
                      <div className="text-[11px] text-[#999] mt-0.5">
                        Try modifying search filters or show inactive clients.
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client: any, idx: number) => {
                    const idStr = String(client.id || idx + 1);
                    const isSelected = selectedIds.includes(idStr);
                    const statusStr = String(client.status || 'Active').toUpperCase();
                    const isActive = statusStr === 'ACTIVE';
                    const dateFormatted = formatWhmcsDate(client.datecreated || client.dateCreated);

                    return (
                      <tr
                        key={idStr}
                        className={`hover:bg-[#f2f7fc] transition-colors ${
                          idx % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'
                        } ${isSelected ? 'bg-[#eaf2fb]' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(idStr)}
                            className="cursor-pointer"
                          />
                        </td>

                        {/* ID Link */}
                        <td className="p-2.5 font-mono text-[11px] font-semibold">
                          <Link
                            href={`/admin/clients/${idStr}`}
                            className="text-[#1A4D80] hover:underline"
                          >
                            {idStr}
                          </Link>
                        </td>

                        {/* First Name Link */}
                        <td className="p-2.5 font-semibold text-[#333]">
                          <Link
                            href={`/admin/clients/${idStr}`}
                            className="text-[#1A4D80] hover:underline"
                          >
                            {client.firstname || '—'}
                          </Link>
                        </td>

                        {/* Last Name Link */}
                        <td className="p-2.5 font-semibold text-[#333]">
                          <Link
                            href={`/admin/clients/${idStr}`}
                            className="text-[#1A4D80] hover:underline"
                          >
                            {client.lastname || '—'}
                          </Link>
                        </td>

                        {/* Company Name Link */}
                        <td className="p-2.5 text-[#555]">
                          {client.companyname ? (
                            <Link
                              href={`/admin/clients/${idStr}`}
                              className="text-[#1A4D80] hover:underline"
                            >
                              {client.companyname}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Email Address Link */}
                        <td className="p-2.5 font-mono text-[11px]">
                          <Link
                            href={`/admin/clients/${idStr}`}
                            className="text-[#1A4D80] hover:underline"
                          >
                            {client.email || '—'}
                          </Link>
                        </td>

                        {/* Services (active / total) */}
                        <td className="p-2.5 font-mono text-center text-[#333] font-semibold">
                          {client.services_count || '0 (0)'}
                        </td>

                        {/* Created Date (DD/MM/YYYY) */}
                        <td className="p-2.5 font-mono text-[11px] text-[#555]">
                          {dateFormatted}
                        </td>

                        {/* Status Badge */}
                        <td className="p-2.5 text-center">
                          {isActive ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#5cb85c] text-white tracking-wider">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#d9534f] text-white tracking-wider">
                              {statusStr}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation Footer */}
          <div className="bg-[#f9fafb] border-t border-[#ddd] p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <strong className="text-slate-800">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-slate-800">{endIndex}</strong> of{' '}
              <strong className="text-slate-800">{totalRecords}</strong> clients
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
    </div>
  );
}
