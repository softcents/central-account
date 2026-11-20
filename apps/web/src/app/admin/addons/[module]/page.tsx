'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Boxes,
  ArrowLeft,
  Settings,
  Save,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  PhoneCall,
  Globe,
  Tag,
  Clock,
  Briefcase,
  Layers,
  Lock,
  Search,
  Bell,
  Zap,
  TrendingUp,
  Send,
  Users,
  QrCode,
  FileText,
  Trash2,
  Play,
  Check,
  X,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import whmcsData from '@/data/whmcs_sync.json';

interface ModuleMetadata {
  name: string;
  version: string;
  description: string;
  category: string;
  icon: any;
  defaultSettings: Record<string, any>;
}

const MODULES_MAP: Record<string, ModuleMetadata> = {
  DomainsReseller: {
    name: 'Domains Reseller',
    version: 'v2.3.0',
    category: 'Domains',
    description: 'Domain reseller API automation, registrar sync, TLD pricing, nameserver updates, and automated renewal triggers.',
    icon: Globe,
    defaultSettings: {
      api_url: 'https://api.domainsreseller.com/v2',
      api_key: 'dres_live_89f0291ba4c920194827',
      reseller_id: 'RSL-9082',
      auto_renew: true,
      dns_management: true,
    },
  },
  RegistrationAlert: {
    name: 'Registration Email Alert',
    version: 'v2.1',
    category: 'Alerts & Email',
    description: 'Instant notification dispatch to administrators upon new user registration and account onboarding.',
    icon: Bell,
    defaultSettings: {
      notification_email: 'admin@softcents.com, support@softcents.com',
      alert_subject: '[SoftCents Alert] New Client Registered: {client_name}',
      notify_on_individual: true,
      notify_on_business: true,
    },
  },
  SOFTCENTS_SMS: {
    name: 'SOFTCENTS SMS Gateway',
    version: 'v1.7',
    category: 'Messaging',
    description: 'Masked and non-masked SMS dispatch gateway for OTP verification, invoice alerts, overdue reminders, and server provisioning.',
    icon: MessageSquare,
    defaultSettings: {
      gateway_url: 'https://sms.softcents.com/api/v3/send',
      api_token: 'sc_sms_live_90184719284719284',
      sender_id: 'SoftCents',
      otp_template: 'Your SoftCents verification code is: {otp}. Valid for 5 minutes.',
      send_invoice_alert: true,
      send_due_reminder: true,
      balance_warning_threshold: '500',
    },
  },
  advanced_client_verification: {
    name: 'Advanced Client Verification',
    version: 'v2.2',
    category: 'Identity & KYC',
    description: 'Bangladesh Smart NID verification, OCR extraction, Face biometric liveness, and mandatory Trade License KYB.',
    icon: ShieldCheck,
    defaultSettings: {
      verification_mode: 'api_only',
      license_key: 'MLS-ACV-30c7aa9ca8a20c5d8180',
      api_key: 'EmkjVnzCPRa2-MMZMt2VPOQ-RFMUsI8LB5irU4lMNko',
      workflow_id: '2ac4f3a2-1065-49dd-afcc-76cd25d6eb59',
      webhook_secret: 'flV7SkpcG8XLVgwL40c1y5PxsyofxQGY5lZQLDRK7dA',
      require_trade_license: true,
      require_selfie: true,
      auto_approve: true,
      verification_deadline_days: '7',
    },
  },
  bdhost_wa: {
    name: 'Bdhost WhatsApp Pro',
    version: 'v8.4',
    category: 'Messaging',
    description: 'Automated multi-device WhatsApp notification gateway for invoice generation, payment confirmations, and support tickets.',
    icon: MessageSquare,
    defaultSettings: {
      instance_id: 'WA_INSTANCE_SOFTCENTS_PRO',
      access_token: 'wa_tok_8923748912739487123984',
      notify_invoice_created: true,
      notify_payment_received: true,
      notify_service_suspended: true,
      country_code_prefix: '880',
    },
  },
  dynamiccoupon: {
    name: 'Dynamic Coupon Generator',
    version: 'v1.1',
    category: 'Marketing',
    description: 'Automated dynamic promo code generator with redemption limits, cycle constraints, and custom promotional banners.',
    icon: Tag,
    defaultSettings: {
      coupon_prefix: 'FLASH',
      discount_percentage: '15',
      max_uses_per_client: '1',
      valid_billing_cycles: 'Monthly, Annually',
    },
  },
  expiredproducts: {
    name: 'Expired Products Manager',
    version: 'v1.8',
    category: 'Automation',
    description: 'Automated post-expiration product lifecycle manager, grace period reminders, and scheduled server termination.',
    icon: Clock,
    defaultSettings: {
      grace_period_days: '5',
      suspend_after_days: '1',
      terminate_after_days: '14',
    },
  },
  forceclientactive: {
    name: 'Force Client Active',
    version: 'v1.0',
    category: 'Client Management',
    description: 'Administrative override mechanism ensuring client accounts remain active across automated billing sweeps.',
    icon: CheckCircle2,
    defaultSettings: {
      auto_whitelist_enterprise: true,
      prevent_auto_closure: true,
    },
  },
  italk_balance: {
    name: 'iTalk Balance & PBX Sync',
    version: 'v3.0',
    category: 'Telephony & PBX',
    description: 'Real-time Cloud PBX balance lookup, VoIP balance syncer, and automated low-balance customer notifications.',
    icon: PhoneCall,
    defaultSettings: {
      asterisk_ami_host: '127.0.0.1',
      asterisk_ami_port: '5038',
    },
  },
  italk_recharge: {
    name: 'Multi-Provider Auto Recharge',
    version: 'v6.5',
    category: 'Telephony & PBX',
    description: 'Automated balance top-up switch across upstream SIP carriers with real-time conversion rates.',
    icon: Zap,
    defaultSettings: {
      conversion_rate: '1.00',
      upstream_gateway: 'SoftCents Carrier Pool',
    },
  },
  unblockip: {
    name: 'ip Unblocker',
    version: 'v1.1',
    category: 'Security & Network',
    description: 'Server-side ConfigServer Security & Firewall (CSF) and cPanel IP address unban tool accessible by admins and clients.',
    icon: Lock,
    defaultSettings: {
      rate_limit_per_client_per_hour: '5',
      allow_clientarea_unblock: true,
    },
  },
};

export default function AddonModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = String(params?.module || '');

  const moduleInfo = MODULES_MAP[moduleId] || {
    name: moduleId.replace(/_/g, ' '),
    version: 'v1.0',
    category: 'Custom Addon',
    description: 'WHMCS custom addon module integration.',
    icon: Boxes,
    defaultSettings: {},
  };

  const [activeTab, setActiveTab] = useState('main');
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const fromSync = (whmcsData as any)?.addonSettingsMap?.[moduleId];
    return {
      ...moduleInfo.defaultSettings,
      ...(fromSync || {}),
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionToast, setActionToast] = useState<{ ok: boolean; message: string } | null>(null);

  // Module Specific State & Datasets
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [unblockLogs, setUnblockLogs] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [voipLogs, setVoipLogs] = useState<any[]>([]);

  // Interactive Form Inputs
  const [quickSmsRecipient, setQuickSmsRecipient] = useState('01711000111');
  const [quickSmsMessage, setQuickSmsMessage] = useState('Hello from SoftCents Systems! Your account is active.');
  const [waRecipient, setWaRecipient] = useState('8801711000111');
  const [waMessage, setWaMessage] = useState('Your SoftCents invoice #412 has been generated.');
  const [ipToUnblock, setIpToUnblock] = useState('103.145.118.66');
  const [newCouponCode, setNewCouponCode] = useState('PROMO2026');
  const [newCouponDiscount, setNewCouponDiscount] = useState('20%');
  const [voipExtension, setVoipExtension] = useState('101');
  const [voipAmount, setVoipAmount] = useState('500');

  const loadModuleData = async () => {
    try {
      const res = await fetch(`/api/admin/addons?module=${encodeURIComponent(moduleId)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.addonSettingsMap?.[moduleId]) {
          setSettings((prev) => ({ ...prev, ...d.addonSettingsMap[moduleId] }));
        }
        if (d.smsLogs) setSmsLogs(d.smsLogs);
        if (d.waLogs) setWaLogs(d.waLogs);
        if (d.unblockLogs) setUnblockLogs(d.unblockLogs);
        if (d.coupons) setCoupons(d.coupons);
        if (d.voipLogs) setVoipLogs(d.voipLogs);
      }
    } catch {}
  };

  useEffect(() => {
    loadModuleData();
  }, [moduleId]);

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSavedSuccess(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleId,
          settings,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch {}
    setActionLoading(false);
  };

  const executeModuleAction = async (action: string, payload?: any) => {
    setActionLoading(true);
    setActionToast(null);
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleId,
          action,
          payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionToast({ ok: true, message: data.message });
        loadModuleData();
      } else {
        setActionToast({ ok: false, message: data.error || 'Action failed' });
      }
    } catch (err: any) {
      setActionToast({ ok: false, message: err.message || 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  const IconComponent = moduleInfo.icon;

  return (
    <div className="font-sans text-[#333] space-y-4 max-w-[1400px] mx-auto pb-16">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#ddd] gap-2">
        <div>
          <div className="text-[11px] text-[#666] flex items-center space-x-1">
            <Link href="/admin/dashboard" className="text-[#1A4D80] hover:underline">
              Home
            </Link>
            <span>&gt;</span>
            <Link href="/admin/addons" className="text-[#1A4D80] hover:underline">
              Addons
            </Link>
            <span>&gt;</span>
            <span className="text-[#333] font-semibold">{moduleInfo.name}</span>
          </div>

          <div className="flex items-center space-x-3 mt-1.5">
            <div className="p-2 bg-[#1A4D80]/10 text-[#1A4D80] rounded">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-normal text-[#333] tracking-tight flex items-center space-x-2">
                <span>{moduleInfo.name}</span>
                <span className="text-xs bg-[#5cb85c] text-white font-bold px-2 py-0.5 rounded uppercase">
                  Active
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-300">
                  {moduleInfo.version}
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/admin/addons"
            className="bg-[#eee] hover:bg-[#ddd] border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Addons Hub</span>
          </Link>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-bold bg-white p-1 rounded-t border">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 ${
            activeTab === 'main' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Module Workspace</span>
        </button>

        {moduleId === 'SOFTCENTS_SMS' && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 ${
              activeTab === 'logs' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SMS Logs ({smsLogs.length})</span>
          </button>
        )}

        {moduleId === 'bdhost_wa' && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 ${
              activeTab === 'logs' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>WhatsApp Logs ({waLogs.length})</span>
          </button>
        )}

        {moduleId === 'unblockip' && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 ${
              activeTab === 'logs' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Unblock History ({unblockLogs.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 ${
            activeTab === 'settings' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configuration Settings</span>
        </button>
      </div>

      {/* Action / Result Toast Banner */}
      {actionToast && (
        <div
          className={`p-3 rounded text-xs flex items-center space-x-2 font-medium ${
            actionToast.ok
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          {actionToast.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionToast.message}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. SOFTCENTS_SMS Interactive Workspace */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_SMS' && activeTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
              <Send className="w-4 h-4 text-[#1A4D80]" />
              <span>Quick SMS Dispatcher</span>
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Mobile Number *</label>
              <input
                type="text"
                value={quickSmsRecipient}
                onChange={(e) => setQuickSmsRecipient(e.target.value)}
                placeholder="017xxxxxxxx or 018xxxxxxxx"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sender ID</label>
              <input
                type="text"
                disabled
                value={settings.sender_id || 'SoftCents'}
                className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-slate-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Message Content ({quickSmsMessage.length} chars - {Math.ceil(quickSmsMessage.length / 160) || 1} SMS)
              </label>
              <textarea
                rows={4}
                value={quickSmsMessage}
                onChange={(e) => setQuickSmsMessage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Gateway: <strong>sms.softcents.com</strong> (Masked Route)
              </span>
              <button
                disabled={actionLoading}
                onClick={() =>
                  executeModuleAction('send_sms', {
                    recipient: quickSmsRecipient,
                    message: quickSmsMessage,
                    sender: settings.sender_id || 'SoftCents',
                  })
                }
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send SMS Now</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded border border-slate-200 shadow-sm p-4 text-xs space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
                <span>SMS Gateway Stats</span>
                <span className="text-emerald-600 font-normal">● Online</span>
              </h3>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Available Balance:</span>
                <span className="font-mono font-bold text-base text-[#1A4D80]">1,480 SMS</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Sender ID:</span>
                <span className="font-bold text-slate-800">{settings.sender_id || 'SoftCents'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">SMS Route:</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                  Direct DLR Non-Masking
                </span>
              </div>
              <button
                onClick={() => executeModuleAction('trigger')}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded font-semibold border border-slate-300 flex items-center justify-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Gateway Ping</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. bdhost_wa (WhatsApp Pro) Interactive Workspace */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'bdhost_wa' && activeTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              <span>Send WhatsApp Notification</span>
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number (with country code) *</label>
              <input
                type="text"
                value={waRecipient}
                onChange={(e) => setWaRecipient(e.target.value)}
                placeholder="88017xxxxxxxx"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notification Message</label>
              <textarea
                rows={4}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Instance: <strong>WA_INSTANCE_SOFTCENTS_PRO</strong> (Multi-Device Active)
              </span>
              <button
                disabled={actionLoading}
                onClick={() =>
                  executeModuleAction('send_wa', {
                    recipient: waRecipient,
                    message: waMessage,
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Dispatch WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded border border-slate-200 shadow-sm p-4 text-xs space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
                <span>Instance Connection</span>
                <span className="text-emerald-600 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Online</span>
                </span>
              </h3>
              <div className="text-center py-3 bg-slate-50 rounded border border-dashed border-slate-300">
                <QrCode className="w-16 h-16 text-slate-700 mx-auto mb-1" />
                <span className="text-[11px] text-slate-500 font-medium block">
                  Session Paired: 8801711000111
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-600">Battery Level:</span>
                <span className="font-bold text-slate-800">96% (Charging)</span>
              </div>
              <button
                onClick={() => executeModuleAction('trigger')}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded font-semibold border border-slate-300 flex items-center justify-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Connection State</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. unblockip Interactive Workspace */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'unblockip' && activeTab === 'main' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-5 space-y-4 text-xs max-w-2xl">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
            <Lock className="w-4 h-4 text-[#1A4D80]" />
            <span>Search & Unblock Client IP from CSF Firewall</span>
          </h2>
          <p className="text-slate-600 text-[11px]">
            Instantly clears IP blocks caused by repeated failed cPanel, Webmail, FTP, SSH, or PBX SIP authentication attempts across all servers (srv8, srv5, srv7, bdix111).
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Client IP Address *</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={ipToUnblock}
                onChange={(e) => setIpToUnblock(e.target.value)}
                placeholder="e.g. 103.145.118.66"
                className="flex-1 bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-800"
              />
              <button
                disabled={actionLoading}
                onClick={() => executeModuleAction('unblock_ip', { ip: ipToUnblock })}
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Unblock from all Servers</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. dynamiccoupon Interactive Workspace */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'dynamiccoupon' && activeTab === 'main' && (
        <div className="space-y-4">
          <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-3 text-xs max-w-2xl">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Create Dynamic Promo Code</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 uppercase font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount *</label>
                <input
                  type="text"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(e.target.value)}
                  placeholder="e.g. 20% or 100 BDT"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-bold"
                />
              </div>
            </div>
            <button
              onClick={() => executeModuleAction('create_coupon', { code: newCouponCode, discount: newCouponDiscount })}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold shadow-sm"
            >
              Generate Promo Code
            </button>
          </div>

          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="bg-slate-50 p-3 font-bold text-slate-800 border-b">
              Active Promo Coupons ({coupons.length})
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Coupon Code</th>
                  <th className="py-2.5 px-3">Discount</th>
                  <th className="py-2.5 px-3">Uses / Max</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{c.code}</td>
                    <td className="py-2.5 px-3 font-semibold">{c.discount}</td>
                    <td className="py-2.5 px-3 font-mono">{c.uses || 0} / {c.maxUses}</td>
                    <td className="py-2.5 px-3">{c.expiry}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => executeModuleAction('delete_coupon', { code: c.code })}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. italk_recharge & italk_balance Interactive Workspace */}
      {/* ------------------------------------------------------------- */}
      {(moduleId === 'italk_recharge' || moduleId === 'italk_balance') && activeTab === 'main' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-5 space-y-4 text-xs max-w-xl">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
            <PhoneCall className="w-4 h-4 text-cyan-600" />
            <span>Cloud PBX Balance Top-Up</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SIP Extension / Account *</label>
              <input
                type="text"
                value={voipExtension}
                onChange={(e) => setVoipExtension(e.target.value)}
                placeholder="101, 102 or customer"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recharge Amount (BDT) *</label>
              <input
                type="number"
                value={voipAmount}
                onChange={(e) => setVoipAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-bold"
              />
            </div>
          </div>
          <button
            disabled={actionLoading}
            onClick={() => executeModuleAction('recharge_voip', { extension: voipExtension, amount: voipAmount })}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded font-bold shadow-sm disabled:opacity-50"
          >
            Recharge PBX Balance
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. advanced_client_verification Workspace */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'advanced_client_verification' && activeTab === 'main' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Advanced Smart NID & KYB Verification Module</span>
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Full-featured KYC/KYB identity engine with Smart NID OCR extraction, Face biometric liveness, and Trade License validation.
              </p>
            </div>
            <div className="flex space-x-2">
              <Link
                href="/admin/kyc"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded font-bold shadow-sm flex items-center space-x-1"
              >
                <span>Open KYC Verifications</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/admin/kyb"
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3.5 py-1.5 rounded font-bold shadow-sm flex items-center space-x-1"
              >
                <span>Open KYB Business Verifications</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. Logs Tab (SMS / WhatsApp / Unblock Logs) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="bg-slate-50 p-3 font-bold text-slate-800 border-b">
            Module Activity & Transmission Logs
          </div>
          {moduleId === 'SOFTCENTS_SMS' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3">Log ID</th>
                  <th className="py-2 px-3">Recipient</th>
                  <th className="py-2 px-3">Message</th>
                  <th className="py-2 px-3">Sender</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {smsLogs.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">No sent SMS logs recorded yet.</td></tr>
                ) : (
                  smsLogs.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-[#1A4D80]">{l.id}</td>
                      <td className="py-2 px-3 font-mono">{l.recipient}</td>
                      <td className="py-2 px-3 max-w-xs truncate">{l.message}</td>
                      <td className="py-2 px-3">{l.sender}</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">{l.status}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(l.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {moduleId === 'bdhost_wa' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3">Log ID</th>
                  <th className="py-2 px-3">Recipient</th>
                  <th className="py-2 px-3">Message</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waLogs.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">No sent WhatsApp logs recorded yet.</td></tr>
                ) : (
                  waLogs.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-green-700">{l.id}</td>
                      <td className="py-2 px-3 font-mono">{l.recipient}</td>
                      <td className="py-2 px-3 max-w-xs truncate">{l.message}</td>
                      <td className="py-2 px-3 text-green-600 font-bold">{l.status}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(l.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {moduleId === 'unblockip' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3">Action ID</th>
                  <th className="py-2 px-3">Unblocked IP</th>
                  <th className="py-2 px-3">Target Clusters</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unblockLogs.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">No unblock history recorded yet.</td></tr>
                ) : (
                  unblockLogs.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-[#1A4D80]">{l.id}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{l.ip}</td>
                      <td className="py-2 px-3">{l.servers}</td>
                      <td className="py-2 px-3 text-emerald-700 font-bold">{l.status}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(l.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. Settings Form (WHMCS tbladdonmodules Configuration) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden text-xs">
          <div className="bg-[#f5f5f5] px-4 py-2.5 border-b border-[#ddd] flex items-center justify-between">
            <span className="font-bold text-xs text-[#333] flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#1A4D80]" />
              <span>Module Parameters & Credentials (WHMCS tbladdonmodules)</span>
            </span>
            <span className="text-[11px] text-[#777] font-mono">Module: {moduleId}</span>
          </div>

          <div className="p-4 space-y-4">
            {Object.keys(settings).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No additional parameters required for this module.
              </div>
            ) : (
              Object.entries(settings).map(([key, val]) => {
                const label = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase());

                if (typeof val === 'boolean') {
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-[#eee]">
                      <div>
                        <label className="block text-xs font-bold text-[#333]">{label}</label>
                        <span className="text-[11px] text-[#777]">Toggle activation for this feature.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => handleInputChange(key, e.target.checked)}
                        className="w-4 h-4 cursor-pointer text-[#1A4D80] rounded"
                      />
                    </div>
                  );
                }

                return (
                  <div key={key} className="py-2 border-b border-[#eee]">
                    <label className="block text-xs font-bold text-[#333] mb-1">{label}</label>
                    <input
                      type="text"
                      value={String(val)}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full bg-white border border-[#ccc] rounded px-3 py-1.5 text-xs text-[#333] focus:outline-none focus:border-[#1A4D80]"
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-[#fafafa] border-t border-[#ddd] px-4 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => executeModuleAction('trigger')}
              disabled={actionLoading}
              className="bg-white hover:bg-slate-50 border border-[#ccc] text-[#333] font-semibold text-xs px-3.5 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Test Connection / Trigger</span>
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="bg-[#1A4D80] hover:bg-[#163f68] text-white font-bold text-xs px-5 py-1.5 rounded flex items-center space-x-1.5 shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
