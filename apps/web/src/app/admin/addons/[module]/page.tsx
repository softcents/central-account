'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Volume2,
  Upload,
  Radio,
  FileAudio,
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
  SOFTCENTS_VSMS: {
    name: 'SOFTCENTS Voice SMS (vSMS)',
    version: 'v2.0',
    category: 'Voice & Telephony',
    description: 'Official SoftCents Voice SMS gateway (vsms.softcents.com). Dispatch pre-recorded voice calls, IVR campaigns, OTP calls, and automated voice invoice alerts.',
    icon: PhoneCall,
    defaultSettings: {
      api_url: 'https://vsms.softcents.com',
      api_token: '14|OCq2yZelYts6BhSf1mmK4RQO6HX4Q98RLiuxxDO6190d0518',
      caller_id: '369',
      default_due_audio_id: '419',
      default_overdue_audio_id: '420',
      default_welcome_audio_id: '421',
      auto_call_on_due: false,
      auto_call_on_overdue: true,
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

  // Voice SMS (vSMS) Specific State
  const [vsmsBalance, setVsmsBalance] = useState<number | string>(100000);
  const [vsmsCallers, setVsmsCallers] = useState<any[]>([]);
  const [vsmsAudios, setVsmsAudios] = useState<any[]>([]);
  const [voiceLogs, setVoiceLogs] = useState<any[]>([]);
  const [voiceRecipient, setVoiceRecipient] = useState('01329646689');
  const [selectedVoiceCaller, setSelectedVoiceCaller] = useState('369');
  const [selectedVoiceAudio, setSelectedVoiceAudio] = useState('419');

  // Audio Upload Form State
  const [uploadAudioTitle, setUploadAudioTitle] = useState('New Voice Notice');
  const [uploadAudioDesc, setUploadAudioDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<{ base64: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [quickSmsRecipient, setQuickSmsRecipient] = useState('8801329646689');
  const [quickSmsMessage, setQuickSmsMessage] = useState('Softcents SMS Integration Active & Verified.');
  const [waRecipient, setWaRecipient] = useState('8801711000111');
  const [waMessage, setWaMessage] = useState('Your SoftCents invoice #412 has been generated.');
  const [ipToUnblock, setIpToUnblock] = useState('103.145.118.66');

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
        if (d.vsmsBalance !== undefined) setVsmsBalance(d.vsmsBalance);
        if (d.vsmsCallers) setVsmsCallers(d.vsmsCallers);
        if (d.vsmsAudios) setVsmsAudios(d.vsmsAudios);
        if (d.clients) setClientsList(d.clients);
        if (d.smsLogs) setSmsLogs(d.smsLogs);
        if (d.voiceLogs) setVoiceLogs(d.voiceLogs);
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

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      if (data.success || data.status === 200 || data.call?.id) {
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

  // Handle File Input Change for Audio Upload
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadFile({
        base64: reader.result as string,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Upload Audio
  const handleUploadAudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setActionToast({ ok: false, message: 'Please select an MP3 or WAV audio file.' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'SOFTCENTS_VSMS',
          action: 'upload_voice_audio',
          payload: {
            title: uploadAudioTitle,
            description: uploadAudioDesc,
            fileBase64: uploadFile.base64,
            fileName: uploadFile.name,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionToast({ ok: true, message: 'Audio uploaded successfully to Voice SMS Gateway.' });
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadModuleData();
      } else {
        setActionToast({ ok: false, message: data.message || 'Upload failed' });
      }
    } catch (err: any) {
      setActionToast({ ok: false, message: err.message });
    } finally {
      setActionLoading(false);
    }
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

          {moduleId === 'SOFTCENTS_VSMS' && (
            <div className="bg-purple-50 border border-purple-300 px-3 py-1.5 rounded flex items-center space-x-2 text-xs">
              <span className="text-purple-700 font-semibold">VOICE BALANCE:</span>
              <span className="font-mono font-bold text-purple-900 text-sm">
                ৳{typeof vsmsBalance === 'number' ? vsmsBalance.toLocaleString() : vsmsBalance} BDT
              </span>
              <button
                onClick={loadModuleData}
                title="Refresh Live Balance"
                className="text-purple-700 hover:text-purple-900"
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
          <span>
            {moduleId === 'SOFTCENTS_SMS'
              ? 'Overview & Quick SMS'
              : moduleId === 'SOFTCENTS_VSMS'
              ? 'Voice Dispatcher & Overview'
              : 'Module Workspace'}
          </span>
        </button>

        {/* SMS Addon Specific Tabs */}
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

        {/* Voice SMS Addon Specific Tabs */}
        {moduleId === 'SOFTCENTS_VSMS' && (
          <>
            <button
              onClick={() => setActiveTab('audios')}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'audios' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Pre-recorded Audio Files ({vsmsAudios.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('triggers')}
              className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'triggers' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Voice Automation Triggers</span>
            </button>
          </>
        )}

        {(moduleId === 'SOFTCENTS_SMS' || moduleId === 'SOFTCENTS_VSMS' || moduleId === 'bdhost_wa' || moduleId === 'unblockip') && (
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'logs' ? 'bg-[#1A4D80] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              Logs (
              {moduleId === 'SOFTCENTS_SMS'
                ? smsLogs.length
                : moduleId === 'SOFTCENTS_VSMS'
                ? voiceLogs.length
                : moduleId === 'bdhost_wa'
                ? waLogs.length
                : unblockLogs.length}
              )
            </span>
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
      {/* 2. SOFTCENTS_VSMS Interactive Workspace (Voice SMS Calls) */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_VSMS' && activeTab === 'main' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b pb-2">
              <PhoneCall className="w-4 h-4 text-purple-600" />
              <span>Voice Call Dispatcher (Pre-recorded Voice)</span>
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Phone Number *</label>
              <input
                type="text"
                value={voiceRecipient}
                onChange={(e) => setVoiceRecipient(e.target.value)}
                placeholder="013XXXXXXXX or +88013XXXXXXXX"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-500">
                Direct telephony dispatch via Asterisk PBX Core (`vsms.softcents.com`).
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Caller ID / Number *</label>
              <select
                value={selectedVoiceCaller}
                onChange={(e) => setSelectedVoiceCaller(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono"
              >
                {vsmsCallers.length === 0 ? (
                  <option value="369">White Info &lt;09639228906&gt; (Default Online)</option>
                ) : (
                  vsmsCallers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caller_name} &lt;{c.caller_number}&gt; {c.enabled ? '(Online)' : '(Disabled)'}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Pre-recorded Voice Audio *</label>
              <select
                value={selectedVoiceAudio}
                onChange={(e) => setSelectedVoiceAudio(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-800 font-mono"
              >
                {vsmsAudios.length === 0 ? (
                  <>
                    <option value="419">Softcents Due Bill Reminder Voice (IVR 1/2 Click) [41s]</option>
                    <option value="420">Softcents Overdue Notice Voice [44s]</option>
                    <option value="421">Softcents Voice Greeting & Support [31s]</option>
                  </>
                ) : (
                  vsmsAudios.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.title} ({a.duration ? `${a.duration}s` : 'WAV/MP3'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Audio Preview Player */}
            {vsmsAudios.find((a) => String(a.id) === String(selectedVoiceAudio))?.converted_url && (
              <div className="bg-purple-50/50 border border-purple-200 rounded p-2.5 flex items-center justify-between">
                <span className="font-semibold text-purple-900 flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>Preview Audio:</span>
                </span>
                <audio
                  controls
                  className="h-8"
                  src={vsmsAudios.find((a) => String(a.id) === String(selectedVoiceAudio))?.converted_url}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Gateway: <strong>vsms.softcents.com</strong> (Pulse: 10s | 0 BDT Internal Cost)
              </span>
              <button
                disabled={actionLoading}
                onClick={() =>
                  executeModuleAction('send_voice_call', {
                    phone: voiceRecipient,
                    callerId: selectedVoiceCaller,
                    audioId: selectedVoiceAudio,
                  })
                }
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                <span>Make Voice Call Now</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded border border-slate-200 shadow-sm p-4 text-xs space-y-3">
              <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
                <span>Voice Gateway Status</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Online</span>
                </span>
              </h3>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Available Voice Balance:</span>
                <span className="font-mono font-bold text-base text-purple-700">
                  ৳{typeof vsmsBalance === 'number' ? vsmsBalance.toLocaleString() : vsmsBalance} BDT
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Asterisk Core Server:</span>
                <span className="font-mono font-bold text-slate-800">103.234.119.204:5038</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Active Callers (Online):</span>
                <span className="font-bold text-slate-800">{vsmsCallers.length || 9} Numbers Registered</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b">
                <span className="text-slate-600">Audio Library:</span>
                <span className="font-bold text-slate-800">{vsmsAudios.length} Pre-recorded Audios</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">IP Whitelist:</span>
                <span className="text-emerald-700 font-bold">127.0.0.1 / Localhost (Allowed)</span>
              </div>
              <button
                onClick={() => executeModuleAction('trigger')}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded font-semibold border border-slate-300 flex items-center justify-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Voice Gateway Ping</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SOFTCENTS_VSMS Pre-recorded Audios & Upload Tab */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_VSMS' && activeTab === 'audios' && (
        <div className="space-y-4 text-xs">
          {/* Upload New Audio Form */}
          <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2 border-b pb-2">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Upload New Pre-recorded Voice Audio File</span>
            </h3>

            <form onSubmit={handleUploadAudioSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audio Title *</label>
                <input
                  type="text"
                  value={uploadAudioTitle}
                  onChange={(e) => setUploadAudioTitle(e.target.value)}
                  placeholder="e.g. Due Bill Reminder Voice"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={uploadAudioDesc}
                  onChange={(e) => setUploadAudioDesc(e.target.value)}
                  placeholder="e.g. 1st notice audio for overdue bills"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Audio File (.mp3, .wav) *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/ogg"
                  onChange={handleAudioFileChange}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                />
              </div>

              <div className="md:col-span-3 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-1.5 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Upload & Auto-Convert for Asterisk</span>
                </button>
              </div>
            </form>
          </div>

          {/* Audio Library Table */}
          <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-3 font-bold text-slate-800 border-b flex items-center justify-between">
              <span>Pre-recorded Voice Audio Library ({vsmsAudios.length})</span>
              <button
                onClick={loadModuleData}
                className="text-xs text-[#1A4D80] hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh List</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Listen Audio Preview</th>
                    <th className="py-2.5 px-3">Quick Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vsmsAudios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No audio files found.
                      </td>
                    </tr>
                  ) : (
                    vsmsAudios.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">#{a.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {a.title}
                          {a.description && <span className="block text-[11px] text-slate-400">{a.description}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{a.duration ? `${a.duration} sec` : '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            {a.approval || 'Approved'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {a.converted_url ? (
                            <audio controls className="h-7 w-48" src={a.converted_url} />
                          ) : (
                            <span className="text-slate-400 italic">No audio preview</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => {
                              setSelectedVoiceAudio(String(a.id));
                              setActiveTab('main');
                            }}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1 rounded font-semibold text-[11px] flex items-center space-x-1"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Select & Call</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SOFTCENTS_VSMS Voice Automation Triggers Tab */}
      {/* ------------------------------------------------------------- */}
      {moduleId === 'SOFTCENTS_VSMS' && activeTab === 'triggers' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
          <div className="pb-3 border-b">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Radio className="w-4 h-4 text-purple-600" />
              <span>Voice Automation & Invoice Alerts Mapping</span>
            </h2>
            <p className="text-slate-500 text-[11px]">
              Configure which pre-recorded audio files will automatically be played when customers have due invoices, overdue notices, or new orders.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border border-slate-200 rounded p-3 space-y-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-xs">1. Invoice Due Date Voice Call</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_call_on_due || false}
                    onChange={(e) => handleInputChange('auto_call_on_due', e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span className="font-semibold text-slate-700">Enable Automated Voice Call on Due Date</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pre-recorded Audio for Due Date Call</label>
                <select
                  value={settings.default_due_audio_id || '419'}
                  onChange={(e) => handleInputChange('default_due_audio_id', e.target.value)}
                  className="w-full max-w-md bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-mono"
                >
                  {vsmsAudios.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.title} ({a.duration}s)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 space-y-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-xs">2. Overdue Notice Voice Call (2nd & 3rd Notice)</h3>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_call_on_overdue !== undefined ? settings.auto_call_on_overdue : true}
                    onChange={(e) => handleInputChange('auto_call_on_overdue', e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span className="font-semibold text-slate-700">Enable Automated Voice Call for Overdue Invoices</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pre-recorded Audio for Overdue Call</label>
                <select
                  value={settings.default_overdue_audio_id || '420'}
                  onChange={(e) => handleInputChange('default_overdue_audio_id', e.target.value)}
                  className="w-full max-w-md bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-mono"
                >
                  {vsmsAudios.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.title} ({a.duration}s)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 space-y-3 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-xs">3. Welcome / Support Greeting Voice Call</h3>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pre-recorded Audio for Welcome Calls</label>
                <select
                  value={settings.default_welcome_audio_id || '421'}
                  onChange={(e) => handleInputChange('default_welcome_audio_id', e.target.value)}
                  className="w-full max-w-md bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-mono"
                >
                  {vsmsAudios.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.title} ({a.duration}s)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={actionLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded font-bold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Voice Triggers Mapping</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Logs Tab (SMS / Voice / WhatsApp / Unblock Logs) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="bg-slate-50 p-3 font-bold text-slate-800 border-b flex items-center justify-between">
            <span>Transmission & Delivery Logs</span>
            <span className="font-mono text-slate-500 font-normal">Showing recent events</span>
          </div>

          {/* SOFTCENTS_SMS Logs */}
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

          {/* SOFTCENTS_VSMS Logs */}
          {moduleId === 'SOFTCENTS_VSMS' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Call ID</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Caller ID</th>
                    <th className="py-2.5 px-3">Audio Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voiceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No voice call logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    voiceLogs.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{l.id || l.call_id}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold">{l.phone_number}</td>
                        <td className="py-2.5 px-3 font-mono">{l.caller_id}</td>
                        <td className="py-2.5 px-3 text-slate-800">{l.audio_title || `Audio #${l.audio_id}`}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800">
                            {l.status || 'Initiated'}
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
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. Configuration Settings Form */}
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
