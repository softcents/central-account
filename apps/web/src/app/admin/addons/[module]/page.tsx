'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

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
      epp_code_enabled: true,
      dns_management: true,
      id_protection_markup: '250.00',
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
      include_nid_status: true,
      delete_on_action: true,
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
      send_server_ready: true,
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
      require_document_back: true,
      auto_approve: true,
      enable_service_suspension: true,
      verification_deadline_days: '7',
      enable_daily_reminders: true,
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
      connection_status: 'Connected (Instance Online)',
      notify_invoice_created: true,
      notify_payment_received: true,
      notify_service_suspended: true,
      notify_ticket_reply: true,
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
      applicable_products: 'Shared Hosting, Cloud PBX, VPS Servers',
      auto_expire_days: '14',
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
      send_pre_termination_warning: true,
      backup_before_terminate: true,
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
      exempt_ticket_inactivity: true,
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
      ami_username: 'softcents_admin',
      sync_interval_minutes: '15',
      low_balance_threshold: '100.00',
      auto_notify_sms: true,
    },
  },
  italk_recharge: {
    name: 'Multi-Provider Auto Recharge',
    version: 'v6.5',
    category: 'Telephony & PBX',
    description: 'Automated balance top-up switch across upstream SIP carriers with real-time conversion rates.',
    icon: Zap,
    defaultSettings: {
      primary_carrier: 'BTCL / iTalk Live Gateway',
      backup_carrier: 'TeleTalk VoIP Route',
      conversion_rate: '1.0',
      auto_fallback: true,
      max_single_recharge_limit: '50000.00',
    },
  },
  price_updater: {
    name: 'Price Updater Pro',
    version: 'v1.1',
    category: 'Billing & Rates',
    description: 'Bulk product and addon price modifier supporting percentage-based adjustments and automated USD/BDT exchange rates.',
    icon: TrendingUp,
    defaultSettings: {
      usd_to_bdt_rate: '122.50',
      auto_sync_forex: true,
      round_to_nearest_integer: true,
      markup_percentage: '10',
    },
  },
  project_management: {
    name: 'Project Management',
    version: 'v2.3.2',
    category: 'Operations',
    description: 'Complete task management, staff assignment, time tracking, billable hour logging (৳100/hr), and client portal dashboard.',
    icon: Briefcase,
    defaultSettings: {
      hourly_rate: '100.00',
      status_values: 'Pending, In Progress, Awaiting, Abandoned, Completed',
      client_features: 'tasks, time, addtasks, staff, files',
      enable_clientarea: true,
    },
  },
  scrolling_notice: {
    name: 'Scrolling Notice Manager',
    version: 'v2.1',
    category: 'Client Area',
    description: 'Scrolling announcement ticker and marquee banner configured for client portal headers.',
    icon: Layers,
    defaultSettings: {
      banner_text: '⚠ Scheduled Maintenance Notice: Cloud PBX core routing upgrade scheduled for Sunday 02:00 AM - 04:00 AM BDT.',
      banner_type: 'warning',
      is_active: true,
      show_on_login_page: true,
      show_on_clientarea: true,
    },
  },
  suiten_genrenew: {
    name: 'Service Renewal',
    version: 'v1.4',
    category: 'Billing & Rates',
    description: 'Advance renewal invoice generator allowing clients to renew active hosting and PBX subscriptions before due dates.',
    icon: RefreshCw,
    defaultSettings: {
      advance_renewal_days: '30',
      allow_client_early_renew: true,
      apply_annual_discount: true,
      prevent_duplicate_invoices: true,
    },
  },
  tld_price_updater: {
    name: 'Domain & TLD Price Updater',
    version: 'v1.0',
    category: 'Domains',
    description: 'Automated registrar cost sync for .com, .net, .org, and .bd TLDs with configurable profit margins.',
    icon: Globe,
    defaultSettings: {
      margin_com: '15.0',
      margin_net: '15.0',
      margin_org: '15.0',
      margin_bd: '10.0',
      auto_update_client_pricing: true,
    },
  },
  unblockip: {
    name: 'ip Unblocker',
    version: 'v1.1',
    category: 'Security & Network',
    description: 'Server-side ConfigServer Security & Firewall (CSF) and cPanel IP address unban tool accessible by admins and clients.',
    icon: Lock,
    defaultSettings: {
      csf_command_path: '/usr/sbin/csf',
      rate_limit_per_client_per_hour: '5',
      allow_clientarea_unblock: true,
      log_unblock_actions: true,
    },
  },
  whois: {
    name: 'WHOIS for clientarea',
    version: 'v1.0',
    category: 'Domains',
    description: 'Integrated domain WHOIS lookup tool embedded into the client area for immediate domain availability and ownership checks.',
    icon: Search,
    defaultSettings: {
      whois_server: 'whois.iana.org',
      enable_tld_suggestions: true,
      show_order_now_button: true,
      embed_in_homepage: true,
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

  const [settings, setSettings] = useState<Record<string, any>>(() => {
    const fromSync = (whmcsData as any)?.addonSettingsMap?.[moduleId];
    return {
      ...moduleInfo.defaultSettings,
      ...(fromSync || {}),
    };
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/addons')
      .then((res) => res.json())
      .then((data) => {
        if (data.addonSettingsMap?.[moduleId]) {
          setSettings((prev) => ({
            ...prev,
            ...data.addonSettingsMap[moduleId],
          }));
        }
      })
      .catch(() => {});
  }, [moduleId]);

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleId,
          action: 'trigger',
        }),
      });
      const data = await res.json();
      setTestResult(data.message || 'Diagnostic trigger completed successfully.');
    } catch (err: any) {
      setTestResult(`Test failed: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const IconComponent = moduleInfo.icon;

  return (
    <div className="font-sans text-[#333] space-y-4 max-w-5xl mx-auto">
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
            <span>Back to Addons</span>
          </Link>
        </div>
      </div>

      {/* Module Description Banner */}
      <div className="bg-[#fcfcfc] border border-[#ddd] rounded p-3 text-xs text-[#555] leading-relaxed">
        {moduleInfo.description}
      </div>

      {/* Save Success Alert */}
      {savedSuccess && (
        <div className="bg-[#dff0d8] border border-[#d6e9c6] text-[#3c763d] px-4 py-2.5 rounded text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3c763d]" />
          <span>Configuration saved successfully! Addon module settings are active.</span>
        </div>
      )}

      {/* Test Connection Result Alert */}
      {testResult && (
        <div className="bg-[#d9edf7] border border-[#bce8f1] text-[#31708f] px-4 py-2.5 rounded text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#31708f]" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-[#ddd] rounded shadow-sm overflow-hidden">
        <div className="bg-[#f5f5f5] px-4 py-2.5 border-b border-[#ddd] flex items-center justify-between">
          <span className="font-bold text-xs text-[#333] flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#1A4D80]" />
            <span>Module Settings & Parameter Configuration</span>
          </span>

          <span className="text-[11px] text-[#777] font-mono">Module ID: {moduleId}</span>
        </div>

        <div className="p-4 space-y-4">
          {Object.keys(settings).length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No additional configuration required. This addon is operating with default system parameters.
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

        {/* Action Buttons */}
        <div className="bg-[#fafafa] border-t border-[#ddd] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="bg-white hover:bg-slate-50 border border-[#ccc] text-[#333] font-semibold text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>Test Connection / Trigger</span>
          </button>

          <button
            type="submit"
            className="bg-[#1A4D80] hover:bg-[#163f68] text-white font-bold text-xs px-4 py-1.5 rounded flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
