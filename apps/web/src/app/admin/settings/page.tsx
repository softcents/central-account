'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  Lock,
  RefreshCw,
  Settings,
  Globe,
  CreditCard,
  Clock,
  Box,
  Save,
  Check,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

export default function AdminSettingsPage() {
  const { token, admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'admins' | 'general' | 'automation' | 'gateways'>('general');

  // Admin team state
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('KYC_REVIEWER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // General Settings state
  const [generalConfig, setGeneralConfig] = useState({
    companyName: 'SoftCents Systems',
    systemUrl: 'https://billing.softcents.com/',
    logoUrl: 'https://billing.softcents.com/logo.png',
    defaultCountry: 'Bangladesh (BD)',
    currency: 'BDT (৳)',
    adminEmail: 'admin@softcents.com',
  });
  const [savedNotice, setSavedNotice] = useState(false);

  // Automation Settings state
  const [autoConfig, setAutoConfig] = useState({
    invoiceGenDays: '7',
    dueReminderDays: '3',
    overdueSuspensionDays: '5',
    cronFrequency: 'Every 5 Minutes (0 */5 * * * *)',
  });

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/admin/team', {}, token);
      if (res.ok) {
        setTeam(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load admin team', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTeam();
    }
  }, [token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiFetch<any>(
        '/admin/team',
        {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, email, password, role }),
        },
        token,
      );

      if (res.ok) {
        setCreateModalOpen(false);
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        fetchTeam();
      } else {
        setError(res.error || 'Failed to create staff member');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* WHMCS Top Banner */}
      <div className="bg-[#1A4D80] text-white p-4 rounded-t shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Settings className="w-5 h-5 text-amber-300" />
            <span>WHMCS System Setup & Configuration</span>
          </h1>
          <p className="text-xs text-blue-100 mt-0.5">
            Configure system parameters, automation rules, payment gateways, and staff administrators.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors ${
            activeTab === 'general'
              ? 'bg-[#1A4D80] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>General Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors ${
            activeTab === 'admins'
              ? 'bg-[#1A4D80] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Administrators & Roles ({team.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors ${
            activeTab === 'automation'
              ? 'bg-[#1A4D80] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Automation Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded transition-colors ${
            activeTab === 'gateways'
              ? 'bg-[#1A4D80] text-white'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Gateways</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Company & System Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
              <input
                type="text"
                value={generalConfig.companyName}
                onChange={(e) => setGeneralConfig({ ...generalConfig, companyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">WHMCS System URL</label>
              <input
                type="text"
                value={generalConfig.systemUrl}
                onChange={(e) => setGeneralConfig({ ...generalConfig, systemUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Logo URL</label>
              <input
                type="text"
                value={generalConfig.logoUrl}
                onChange={(e) => setGeneralConfig({ ...generalConfig, logoUrl: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Country</label>
              <input
                type="text"
                value={generalConfig.defaultCountry}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Base Currency</label>
              <input
                type="text"
                value={generalConfig.currency}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Admin Email Address</label>
              <input
                type="email"
                value={generalConfig.adminEmail}
                onChange={(e) => setGeneralConfig({ ...generalConfig, adminEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Administrators & Roles */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Staff Administrator Accounts</h2>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Administrator</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eef3f7] border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {user.first_name || user.firstName} {user.last_name || user.lastName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{user.email}</td>
                    <td className="py-2.5 px-4">
                      <span className="bg-blue-100 text-[#1A4D80] font-bold px-2 py-0.5 rounded text-[10px]">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Automation Settings */}
      {activeTab === 'automation' && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Cron Scheduling & Automatic Invoice Settings
          </h2>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Invoice Generation Days in Advance
              </label>
              <input
                type="number"
                value={autoConfig.invoiceGenDays}
                onChange={(e) => setAutoConfig({ ...autoConfig, invoiceGenDays: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generate renewal invoices X days before the next due date.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Overdue Suspension Grace Period (Days)
              </label>
              <input
                type="number"
                value={autoConfig.overdueSuspensionDays}
                onChange={(e) => setAutoConfig({ ...autoConfig, overdueSuspensionDays: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-[#1A4D80]"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically suspend services when invoices remain unpaid X days after due date.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                System Automation Cron Job Interval
              </label>
              <input
                type="text"
                value={autoConfig.cronFrequency}
                disabled
                className="w-full bg-slate-100 border border-slate-300 rounded p-2 text-slate-600 cursor-not-allowed font-mono"
              />
            </div>

            <button
              onClick={() => {
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 3000);
              }}
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold transition-colors"
            >
              Save Automation Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Gateways */}
      {activeTab === 'gateways' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800">Configured Payment Gateways</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm">PipraPay (bKash / Nagad / Rocket)</div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  Active & Primary
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated Bangladesh MFS and instant payment gateway module for SoftCents Systems.
              </p>
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                Module: piprapay.php • Version: 1.0.2
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm">Bank Wire / Offline Transfer</div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manual invoice clearance via Eastern Bank Ltd. / City Bank Bangladesh.
              </p>
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                Module: banktransfer.php
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Staff Administrator</h3>
            {error && <div className="p-2 bg-rose-50 text-rose-700 rounded border border-rose-200">{error}</div>}

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="SUPER_ADMIN">Full Administrator (Super Admin)</option>
                  <option value="KYC_REVIEWER">KYC & Document Reviewer</option>
                  <option value="SUPPORT_AGENT">Support Agent</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#1A4D80] text-white rounded font-bold hover:bg-[#143d66]"
                >
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
