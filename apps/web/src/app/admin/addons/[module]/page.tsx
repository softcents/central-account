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
    description: 'Official SoftCents SMS gateway addon. Automated hooks for order acceptance, invoice generation, payment confirmations, 4-stage overdue reminders, welcome messages, and service lifecycle.',
    icon: MessageSquare,
    defaultSettings: {
      client_id: '000016',
      client_secret: '147b75d8-df28-4ffb-9776-aee1edaf57a0',
      sender_id: '8809617777121',
      dateformat: 'd-m-Y',
      send_invoice_alert: true,
      send_due_reminder: true,
      send_welcome_sms: true,
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

  // SMS Specific State
  const [smsBalance, setSmsBalance] = useState<string | number>('3,008.66');
  const [smsCurrency, setSmsCurrency] = useState('BDT');
  const [smsTemplates, setSmsTemplates] = useState<any[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [clientsList, setClientsList] = useState<any[]>([]);

  // Bulk SMS State
  const [bulkFilter, setBulkFilter] = useState<'all' | 'active' | 'custom'>('all');
  const [bulkCustomNumbers, setBulkCustomNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('Important announcement from Softcents Systems: Your services are active.');

  // Generic Datasets
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [unblockLogs, setUnblockLogs] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [voipLogs, setVoipLogs] = useState<any[]>([]);

  // Quick Forms
  const [quickSmsRecipient, setQuickSmsRecipient] = useState('8801730767616');
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
        if (d.smsBalance !== undefined) setSmsBalance(d.smsBalance);
        if (d.smsCurrency) setSmsCurrency(d.smsCurrency);
        if (d.smsTemplates) setSmsTemplates(d.smsTemplates);
        if (d.clients) setClientsList(d.clients);
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
      if (data.success || data.status === 200) {
        setActionToast({ ok: true, message: data.message || 'Action executed successfully.' });
        loadModuleData();
      } else {
        setActionToast({ ok: false, message: data.error || data.message || 'Action failed' });
      }
    } catch (err: any) {
      setActionToast({ ok: false, message: err.message || 'Network error' });
    } finally {
      setActionLoading(false);
    }
  };

  // SMS Template Save
  const handleSaveTemplate = async (templateItem: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'SOFTCENTS_SMS',
          action: 'update_template',
          payload: {
            id: templateItem.id,
            template: templateItem.template,
            active: templateItem.active,
            admingsm: templateItem.admingsm,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionToast({ ok: true, message: `Template '${templateItem.name}' saved successfully.` });
        loadModuleData();
        setEditingTemplate(null);
      } else {
        setActionToast({ ok: false, message: data.error || 'Failed to update template' });
      }
    } catch (e: any) {
      setActionToast({ ok: false, message: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk SMS Dispatch
  const handleBulkSmsDispatch = () => {
    let targetNumbers: string[] = [];
    if (bulkFilter === 'all') {
      targetNumbers = clientsList.map((c) => c.phonenumber).filter(Boolean);
    } else if (bulkFilter === 'active') {
      targetNumbers = clientsList.filter((c) => c.status === 'Active').map((c) => c.phonenumber).filter(Boolean);
    } else {
      targetNumbers = bulkCustomNumbers.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.length >= 8);
    }

    if (!targetNumbers.length) {
      setActionToast({ ok: false, message: 'No valid recipient phone numbers found for bulk dispatch.' });
      return;
    }

    executeModuleAction('bulk_sms', {
      recipients: targetNumbers,
      message: bulkMessage,
      sender: settings.sender_id || '8809617777121',
    });
  };

  const IconComponent = moduleInfo.icon;

  const clientTemplates = smsTemplates.filter((t) => t.type === 'client');
  const adminTemplates = smsTemplates.filter((t) => t.type === 'admin');

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
          {moduleId === 'SOFTCENTS_SMS' && (
            <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded flex items-center space-x-2 text-xs">
              <span className="text-emerald-700 font-semibold">SMS BALANCE:</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">
                ৳{typeof smsBalance === 'number' ? smsBalance.toFixed(2) : smsBalance} {smsCurrency}
              </span>
              <button
                onClick={loadModuleData}
                title="Refresh Live Balance"
                className="text-emerald-700 hover:text-emerald-900"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-bold bg-white p-1 rounded-t border overflow-x-auto">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'main' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>{moduleId === 'SOFTCENTS_SMS' ? 'Overview & Quick Send' : 'Module Workspace'}</span>
        </button>

        {moduleId === 'SOFTCENTS_SMS' && (
          <>
            <button
              onClick={() => setActiveTab('client_templates')}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'client_templates' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Client Templates ({clientTemplates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('admin_templates')}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'admin_templates' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Admin Templates ({adminTemplates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'bulk' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bulk SMS Broadcast</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'reminders' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Invoice Reminders Sweep</span>
            </button>
          </>
        )}

        {(moduleId === 'SOFTCENTS_SMS' || moduleId === 'bdhost_wa' || moduleId === 'unblockip') && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Transmission Logs ({moduleId === 'SOFTCENTS_SMS' ? smsLogs.length : moduleId === 'bdhost_wa' ? waLogs.length : unblockLogs.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
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
      {/* 1. SOFTCENTS_SMS Interactive Workspace (Quick Send & Stats) */}
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
                placeholder="88017XXXXXXXX or 017XXXXXXXX"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-500">Automated Bangladeshi number formatting ensures 880 prefix.</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sender ID</label>
              <input
                type="text"
                disabled
                value={settings.sender_id || '8809617777121'}
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
                Gateway: <strong>sms.softcents.com</strong> (Active WHMCS Live Credentials)
              </span>
              <button
                disabled={actionLoading}
                onClick={() =>
                  executeModuleAction('send_sms', {
                    recipient: quickSmsRecipient,
                    message: quickSmsMessage,
                    sender: settings.sender_id || '8809617777121',
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
                <span>SMS Gateway Status</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Online</span>
                </span>
              </h3>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Real-time Balance:</span>
                <span className="font-mono font-bold text-base text-[#1A4D80]">
                  ৳{typeof smsBalance === 'number' ? smsBalance.toFixed(2) : smsBalance} {smsCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Client ID:</span>
                <span className="font-mono font-bold text-slate-800">{settings.client_id || '000016'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Sender ID:</span>
                <span className="font-mono font-bold text-slate-800">{settings.sender_id || '8809617777121'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Registered Templates:</span>
                <span className="font-bold text-slate-800">{smsTemplates.length} Templates (20 Client + 9 Admin)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Date Format:</span>
                <span className="font-mono text-slate-800">{settings.dateformat || 'd-m-Y'}</span>
              </div>
              <button
                onClick={() => executeModuleAction('trigger')}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded font-semibold border border-slate-300 flex items-center justify-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Gateway Ping</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs space-y-2">
              <span className="font-bold text-blue-900 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Automated Overdue Reminders</span>
              </span>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                Automated daily cron checks invoices due today (Due alert) and overdue invoices at 1-3 days (1st Notice), 4-7 days (2nd Notice), and 8+ days (3rd Final Notice).
              </p>
              <button
                onClick={() => executeModuleAction('trigger_reminders')}
                className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-1.5 rounded font-bold text-[11px] shadow-sm flex items-center justify-center space-x-1"
              >
                <Play className="w-3 h-3" />
                <span>Run Overdue Invoices Sweep Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SOFTCENTS_SMS Client Templates Tab */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_SMS' && activeTab === 'client_templates' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#1A4D80]" />
                <span>Client SMS Notification Templates ({clientTemplates.length})</span>
              </h2>
              <p className="text-slate-500 text-[11px]">
                Templates automatically dispatched to clients on order creation, invoice generation, payment receipts, due reminders, and service provisioning.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search template name..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs w-64 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-3">
            {clientTemplates
              .filter((t) => t.name.toLowerCase().includes(templateSearch.toLowerCase()) || (t.description || '').toLowerCase().includes(templateSearch.toLowerCase()))
              .map((tpl) => {
                const isEditing = editingTemplate?.id === tpl.id;
                const currentTpl = isEditing ? editingTemplate : tpl;
                const varsList = (tpl.variables || '').split(',').map((v: string) => v.trim()).filter(Boolean);

                return (
                  <div
                    key={tpl.id}
                    className={`border rounded p-3 transition-colors ${
                      currentTpl.active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50/60 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[#1A4D80] font-mono">{tpl.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            currentTpl.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {currentTpl.active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                        {tpl.description && (
                          <span className="text-slate-500 text-[11px] hidden md:inline">({tpl.description})</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentTpl.active}
                            onChange={(e) => {
                              const updated = { ...currentTpl, active: e.target.checked };
                              setEditingTemplate(updated);
                              handleSaveTemplate(updated);
                            }}
                            className="w-4 h-4 rounded text-[#1A4D80]"
                          />
                          <span className="text-xs font-semibold text-slate-700">Enabled</span>
                        </label>

                        {!isEditing ? (
                          <button
                            onClick={() => setEditingTemplate({ ...tpl })}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded font-semibold text-xs border border-slate-300"
                          >
                            Edit
                          </button>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleSaveTemplate(editingTemplate)}
                              disabled={actionLoading}
                              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded font-bold text-xs flex items-center space-x-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingTemplate(null)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      {isEditing ? (
                        <div>
                          <textarea
                            rows={3}
                            value={editingTemplate.template}
                            onChange={(e) => setEditingTemplate({ ...editingTemplate, template: e.target.value })}
                            className="w-full bg-white border border-blue-400 rounded p-2 text-xs text-slate-800 font-sans"
                          />
                          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                            <span>Click any variable badge below to append it to template message.</span>
                            <span className="font-mono">
                              {editingTemplate.template.length} chars (~{Math.ceil(editingTemplate.template.length / 160) || 1} SMS)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 bg-slate-50 rounded p-2 text-xs font-mono border border-slate-200">
                          {tpl.template}
                        </p>
                      )}

                      {varsList.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 pt-1">
                          <span className="text-[11px] text-slate-500 font-semibold mr-1">Merge Fields:</span>
                          {varsList.map((v: string) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingTemplate({
                                    ...editingTemplate,
                                    template: `${editingTemplate.template} ${v}`,
                                  });
                                }
                              }}
                              className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-mono transition-colors"
                              title={isEditing ? 'Click to insert' : v}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SOFTCENTS_SMS Admin Templates Tab */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_SMS' && activeTab === 'admin_templates' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <div className="pb-3 border-b">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#1A4D80]" />
              <span>Administrator SMS Alerts ({adminTemplates.length})</span>
            </h2>
            <p className="text-slate-500 text-[11px]">
              Direct SMS alerts sent to administrative phones on new orders, ticket creations, logins, and service creations.
            </p>
          </div>

          <div className="space-y-3">
            {adminTemplates.map((tpl) => {
              const isEditing = editingTemplate?.id === tpl.id;
              const currentTpl = isEditing ? editingTemplate : tpl;
              const varsList = (tpl.variables || '').split(',').map((v: string) => v.trim()).filter(Boolean);

              return (
                <div
                  key={tpl.id}
                  className={`border rounded p-3 transition-colors ${
                    currentTpl.active ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#1A4D80] font-mono">{tpl.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          currentTpl.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {currentTpl.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentTpl.active}
                          onChange={(e) => {
                            const updated = { ...currentTpl, active: e.target.checked };
                            setEditingTemplate(updated);
                            handleSaveTemplate(updated);
                          }}
                          className="w-4 h-4 rounded text-[#1A4D80]"
                        />
                        <span className="text-xs font-semibold text-slate-700">Enabled</span>
                      </label>

                      {!isEditing ? (
                        <button
                          onClick={() => setEditingTemplate({ ...tpl })}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded font-semibold text-xs border border-slate-300"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleSaveTemplate(editingTemplate)}
                            disabled={actionLoading}
                            className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-3 py-1 rounded font-bold text-xs flex items-center space-x-1"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingTemplate(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600 font-semibold w-24">Admin GSM:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTemplate.admingsm || ''}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, admingsm: e.target.value })}
                          placeholder="88017XXXXXXXX"
                          className="bg-white border border-blue-400 rounded px-2 py-1 text-xs font-mono w-60"
                        />
                      ) : (
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {tpl.admingsm || 'Inherit default admin GSM'}
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={editingTemplate.template}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, template: e.target.value })}
                        className="w-full bg-white border border-blue-400 rounded p-2 text-xs text-slate-800 font-sans"
                      />
                    ) : (
                      <p className="text-slate-800 bg-slate-50 rounded p-2 text-xs font-mono border border-slate-200">
                        {tpl.template}
                      </p>
                    )}

                    {varsList.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1 pt-1">
                        <span className="text-[11px] text-slate-500 font-semibold mr-1">Variables:</span>
                        {varsList.map((v: string) => (
                          <span
                            key={v}
                            className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SOFTCENTS_SMS Bulk SMS Broadcast Tab */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_SMS' && activeTab === 'bulk' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <div className="pb-3 border-b">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#1A4D80]" />
              <span>Bulk SMS Broadcast to Clients</span>
            </h2>
            <p className="text-slate-500 text-[11px]">
              Broadcast promotional notifications, maintenance alerts, or emergency announcements to WHMCS clients.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFilter"
                    checked={bulkFilter === 'all'}
                    onChange={() => setBulkFilter('all')}
                  />
                  <span>All Clients ({clientsList.length})</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFilter"
                    checked={bulkFilter === 'active'}
                    onChange={() => setBulkFilter('active')}
                  />
                  <span>Active Clients Only ({clientsList.filter((c) => c.status === 'Active').length})</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="bulkFilter"
                    checked={bulkFilter === 'custom'}
                    onChange={() => setBulkFilter('custom')}
                  />
                  <span>Custom Phone List</span>
                </label>
              </div>
            </div>

            {bulkFilter === 'custom' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Phone Numbers (comma or newline separated)
                </label>
                <textarea
                  rows={3}
                  value={bulkCustomNumbers}
                  onChange={(e) => setBulkCustomNumbers(e.target.value)}
                  placeholder="88017XXXXXXXX, 88018XXXXXXXX..."
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-800 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Broadcast Message Content ({bulkMessage.length} chars)
              </label>
              <textarea
                rows={4}
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800"
              />
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-amber-900 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Please ensure compliance with Bangladesh BTRC SMS transmission guidelines. Broadcasts will deduct ৳0.39/SMS from your Softcents gateway balance.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                disabled={actionLoading}
                onClick={handleBulkSmsDispatch}
                className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-6 py-2 rounded font-bold shadow-sm flex items-center space-x-2 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Dispatch Bulk Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. SOFTCENTS_SMS Overdue Invoices Sweep Tab */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_SMS' && activeTab === 'reminders' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <div className="pb-3 border-b">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#1A4D80]" />
              <span>Automated Overdue Invoices & Reminders Sweep</span>
            </h2>
            <p className="text-slate-500 text-[11px]">
              WHMCS automated cron hook that inspects all unpaid invoices and dispatches the appropriate 4-stage reminder SMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="border border-blue-200 bg-blue-50/50 rounded p-3 space-y-1.5">
              <span className="font-bold text-blue-900 block text-xs">Stage 0: Due Today</span>
              <p className="text-[11px] text-slate-600">Dispatches template: <strong>InvoicePaymentReminder</strong> on due date.</p>
            </div>
            <div className="border border-amber-200 bg-amber-50/50 rounded p-3 space-y-1.5">
              <span className="font-bold text-amber-900 block text-xs">Stage 1: 1st Notice</span>
              <p className="text-[11px] text-slate-600">Dispatches template: <strong>InvoicePaymentReminderFirst</strong> for 1-3 days overdue.</p>
            </div>
            <div className="border border-orange-200 bg-orange-50/50 rounded p-3 space-y-1.5">
              <span className="font-bold text-orange-900 block text-xs">Stage 2: 2nd Notice</span>
              <p className="text-[11px] text-slate-600">Dispatches template: <strong>InvoicePaymentReminderSecond</strong> for 4-7 days overdue.</p>
            </div>
            <div className="border border-rose-200 bg-rose-50/50 rounded p-3 space-y-1.5">
              <span className="font-bold text-rose-900 block text-xs">Stage 3: 3rd Final Notice</span>
              <p className="text-[11px] text-slate-600">Dispatches template: <strong>InvoicePaymentReminderThird</strong> for 8+ days overdue.</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={actionLoading}
              onClick={() => executeModuleAction('trigger_reminders')}
              className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2.5 rounded font-bold shadow-sm flex items-center space-x-2 disabled:opacity-50"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Execute Automated Reminders Sweep Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. bdhost_wa (WhatsApp Pro) Interactive Workspace */}
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
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Instance ID:</span>
                <span className="font-mono font-bold text-slate-800">WA_INSTANCE_SOFTCENTS_PRO</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Battery Level:</span>
                <span className="font-bold text-slate-800">94% (Charging)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Webhook Status:</span>
                <span className="text-emerald-700 font-bold">200 OK Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. unblockip Interactive Workspace */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'unblockip' && activeTab === 'main' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
            <Lock className="w-4 h-4 text-[#1A4D80]" />
            <span>Server Firewall IP Unblock Tool (CSF & cPanel)</span>
          </h2>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">IP Address to Unblock *</label>
            <input
              type="text"
              value={ipToUnblock}
              onChange={(e) => setIpToUnblock(e.target.value)}
              placeholder="e.g. 103.145.118.66"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-800"
            />
          </div>
          <button
            disabled={actionLoading}
            onClick={() => executeModuleAction('unblock_ip', { ip: ipToUnblock })}
            className="bg-[#1A4D80] hover:bg-[#143d66] text-white px-5 py-2 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
          >
            {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Clear CSF Firewall & Unblock IP</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 8. Logs Tab (SMS / WhatsApp / Unblock Logs) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="bg-slate-50 p-3 font-bold text-slate-800 border-b flex items-center justify-between">
            <span>Transmission & Delivery Logs</span>
            <span className="font-mono text-slate-500 font-normal">Showing recent events</span>
          </div>
          {moduleId === 'SOFTCENTS_SMS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Message</th>
                    <th className="py-2.5 px-3">Sender</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {smsLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No sent SMS logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    smsLogs.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">{l.id}</td>
                        <td className="py-2.5 px-3 font-mono">{l.recipient}</td>
                        <td className="py-2.5 px-3 max-w-sm truncate text-slate-800" title={l.message}>
                          {l.message}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{l.sender}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              l.status === 'Delivered' || l.status === 'Sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {l.date ? new Date(l.date).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {moduleId === 'bdhost_wa' && (
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Log ID</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No sent WhatsApp logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  waLogs.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-green-700">{l.id}</td>
                      <td className="py-2.5 px-3 font-mono">{l.recipient}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate">{l.message}</td>
                      <td className="py-2.5 px-3 text-green-600 font-bold">{l.status}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(l.date).toLocaleString()}</td>
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
                  <th className="py-2.5 px-3">Action ID</th>
                  <th className="py-2.5 px-3">Unblocked IP</th>
                  <th className="py-2.5 px-3">Target Clusters</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unblockLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No unblock history recorded yet.
                    </td>
                  </tr>
                ) : (
                  unblockLogs.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A4D80]">{l.id}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{l.ip}</td>
                      <td className="py-2.5 px-3">{l.servers}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">{l.status}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(l.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 9. Configuration Settings (WHMCS tbladdonmodules Parameters) */}
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
            {savedSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Configuration changes saved successfully to WHMCS database store.</span>
              </div>
            )}

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
              <span>Test Connection / Diagnostic Ping</span>
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
