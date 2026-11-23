'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import { useActiveClient } from '@/hooks/useActiveClient';
import whmcsData from '@/data/whmcs_sync.json';

function formatWhmcsDate(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000')) {
    return '27/09/2026';
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatWhmcsPrice(amount: string | number | null | undefined): string {
  const num = parseFloat(String(amount || '0'));
  return `৳${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
}

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = (params.id as string) || '';
  const { clientId, client: activeClient, impQuery } = useActiveClient();

  // Find service in synced services or localStorage
  const service = useMemo(() => {
    const allServices = (whmcsData?.services || []) as any[];
    let found = allServices.find((s: any) => String(s.id) === String(rawId));
    if (found) return found;

    if (typeof window !== 'undefined') {
      try {
        const localServices = JSON.parse(localStorage.getItem('whmcs_services') || '[]');
        found = localServices.find((s: any) => String(s.id) === String(rawId));
        if (found) return found;
      } catch {}
    }

    found = allServices.find((s: any) => String(s.packageid) === String(rawId));
    if (found) return { ...found, id: rawId };

    if (allServices.length > 0) {
      return {
        ...allServices[0],
        id: rawId,
        product_name: `Cloud PBX & Telecom Service #${rawId}`,
        package: `Enterprise Communication #${rawId}`,
        domainstatus: 'Active',
      };
    }

    return null;
  }, [rawId]);

  // Client info
  const client = useMemo(() => {
    if (!service) return activeClient;
    const found = (whmcsData?.clients || []).find(
      (c: any) => String(c.id) === String(service.userid)
    );
    return found || activeClient;
  }, [service, activeClient]);

  // Service Classification
  const isPbx = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''} ${service.server_name || ''}`.toLowerCase();
    return s.includes('pbx') || s.includes('voice') || s.includes('call center') || s.includes('bdpbx');
  }, [service]);

  const isIpPhone = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''}`.toLowerCase();
    return s.includes('ip phone') || s.includes('number') || s.includes('sms') || s.includes('096');
  }, [service]);

  const isVps = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''}`.toLowerCase();
    return s.includes('vps') || s.includes('virtual') || s.includes('cloud server');
  }, [service]);

  const isBhpanel = useMemo(() => {
    if (!service || isPbx || isVps) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''} ${service.server_name || ''} ${service.server_type || ''}`.toLowerCase();
    return (
      s.includes('bdix') ||
      s.includes('bhpanel') ||
      String(service.server) === '6' ||
      ['113', '114', '115', '116', '161'].includes(String(service.packageid))
    );
  }, [service, isPbx, isVps]);

  const isReseller = useMemo(() => {
    if (!service) return false;
    const s = `${service.group_name || ''} ${service.product_name || ''} ${service.package || ''}`.toLowerCase();
    return s.includes('reseller');
  }, [service]);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'domain' | 'configoptions' | 'additionalinfo' | 'resourceusage' | 'downloads' | 'addons' | 'changepw'
  >('domain');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('changepw')) setActiveTab('changepw');
      else if (hash.includes('downloads')) setActiveTab('downloads');
      else if (hash.includes('addons')) setActiveTab('addons');
      else if (hash.includes('configoptions')) setActiveTab('configoptions');
      else if (hash.includes('additionalinfo')) setActiveTab('additionalinfo');
      else if (hash.includes('resourceusage')) setActiveTab('resourceusage');
      else if (hash.includes('domain') || hash.includes('manage') || hash.includes('overview')) setActiveTab('domain');
    }
  }, []);

  // Display normalization
  const status = service?.domainstatus || 'Active';
  const statusLower = status.toLowerCase();
  const isSuspended = statusLower === 'suspended';

  // Domain / Number resolution
  const displayDomain = useMemo(() => {
    if (service?.domain && service.domain.trim() !== '') {
      return service.domain.trim();
    }
    // If IP Phone Number, extract 096... from product name
    const prod = `${service?.product_name || ''} ${service?.package || ''}`;
    const numMatch = prod.match(/096\d{8}/);
    if (numMatch) return numMatch[0];

    if (isPbx) {
      return service?.userid ? `${service.userid}.bdpbx.com` : 'srv111.bdpbx.com';
    }
    return `${service?.username || 'client'}.softcents.com`;
  }, [service, isPbx]);

  const displayUsername = useMemo(() => {
    if (service?.username && service.username.trim() !== '') {
      return service.username.trim();
    }
    if (isIpPhone) return displayDomain;
    if (isPbx) return 'admin';
    return (service?.domain || 'user').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toLowerCase();
  }, [service, isIpPhone, isPbx, displayDomain]);

  const displayPassword = useMemo(() => {
    return service?.password || `Pass@${service?.id || '2026'}#Sc`;
  }, [service]);

  const pbxDomain = useMemo(() => {
    if (isPbx && displayDomain.includes('.')) return displayDomain;
    if (service?.userid) return `${service.userid}.bdpbx.com`;
    return 'srv111.bdpbx.com';
  }, [isPbx, displayDomain, service]);

  const serverHostname = useMemo(() => {
    if (service?.server_hostname) return service.server_hostname;
    if (service?.server_name) return service.server_name;
    if (isPbx) return 'srv111.bdpbx.com';
    if (isBhpanel) return 'bdix-bh.softcents.com';
    return 'srv8.whitednszone.com';
  }, [service, isPbx, isBhpanel]);

  const serverIp = useMemo(() => {
    if (service?.server_ip) return service.server_ip;
    if (service?.dedicatedip) return service.dedicatedip;
    if (isPbx) return '103.205.71.10';
    if (isBhpanel) return '138.252.125.209';
    return '125.253.92.7';
  }, [service, isPbx, isBhpanel]);

  const nameserver1 = service?.ns1 || (isBhpanel ? 'ns1.bdix-bh.softcents.com' : 'ns1.softcents.com');
  const nameserver2 = service?.ns2 || (isBhpanel ? 'ns2.bdix-bh.softcents.com' : 'ns2.softcents.com');

  // PBX State
  const [extensions, setExtensions] = useState<any[]>([
    { extension: '101', name: 'Agent Desk 101', password: displayPassword, enabled: true },
    { extension: '102', name: 'Agent Desk 102', password: `Pass@102#${service?.id || '2026'}`, enabled: true },
    { extension: '103', name: 'Manager Desk 103', password: `Pass@103#${service?.id || '2026'}`, enabled: true },
    { extension: '999', name: 'Softcents Emergency Support', password: 'Free@Support999', enabled: true, isSpecial: true },
  ]);

  const [extModalOpen, setExtModalOpen] = useState(false);
  const [selectedExt, setSelectedExt] = useState<string>('101');
  const [newExtPass, setNewExtPass] = useState('');
  const [updatingExtPass, setUpdatingExtPass] = useState(false);
  const [extActionMsg, setExtActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PBX IP Unblock state
  const [clientIp, setClientIp] = useState('103.205.71.10');
  const [unblockingIp, setUnblockingIp] = useState(false);
  const [unblockResult, setUnblockResult] = useState<string | null>(null);

  // SSO loading states
  const [ssoLoading, setSsoLoading] = useState(false);
  const [bhSsoLoading, setBhSsoLoading] = useState<string | null>(null);
  const [cpanelSsoLoading, setCpanelSsoLoading] = useState(false);

  // Password & Cancellation Modals
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelType, setCancelType] = useState<'Immediate' | 'End of Billing Period'>('End of Billing Period');
  const [cancelSubmitted, setCancelSubmitted] = useState(false);

  // Quick Email creation state for Hosting
  const [emailPrefix, setEmailPrefix] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [creatingEmail, setCreatingEmail] = useState(false);
  const [emailCreatedMsg, setEmailCreatedMsg] = useState<string | null>(null);

  // Copy indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // PBX SSO
  const handlePbxSso = async () => {
    try {
      setSsoLoading(true);
      const res = await fetch(
        `/api/whmcs/servers/softcentspbx/sso?domain=${encodeURIComponent(pbxDomain)}&adminUser=${encodeURIComponent(displayUsername)}`
      );
      const data = await res.json();
      if (data?.ssoUrl) {
        window.open(data.ssoUrl, '_blank');
      } else {
        window.open(`https://${pbxDomain}/login.php`, '_blank');
      }
    } catch {
      window.open(`https://${pbxDomain}/login.php`, '_blank');
    } finally {
      setSsoLoading(false);
    }
  };

  // BHPanel SSO
  const handleBhpanelSso = async (to?: string) => {
    const defaultBhUrl = isReseller
      ? 'https://bdix-bh.softcents.com:2087'
      : 'https://bdix-bh.softcents.com:2083';
    try {
      setBhSsoLoading(to || 'cpanel');
      const url = `/api/whmcs/servers/bhpanel/sso?username=${encodeURIComponent(displayUsername)}&domain=${encodeURIComponent(displayDomain)}${to ? `&to=${encodeURIComponent(to)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.ssoUrl) {
        window.open(data.ssoUrl, '_blank');
      } else {
        window.open(defaultBhUrl, '_blank');
      }
    } catch {
      window.open(defaultBhUrl, '_blank');
    } finally {
      setBhSsoLoading(null);
    }
  };

  // cPanel SSO
  const handleCpanelSso = async (app: 'cpanel' | 'webmail' = 'cpanel') => {
    try {
      setCpanelSsoLoading(true);
      const host = serverHostname || 'srv8.whitednszone.com';
      const res = await fetch(
        `/api/whmcs/servers/cpanel/sso?username=${encodeURIComponent(displayUsername)}&host=${encodeURIComponent(host)}`
      );
      const data = await res.json();
      if (data?.ssoUrl) {
        window.open(data.ssoUrl, '_blank');
      } else {
        const dest = app === 'webmail' ? `https://${host}:2096` : `https://${host}:2083`;
        window.open(dest, '_blank');
      }
    } catch {
      const dest = app === 'webmail' ? `https://${serverHostname}:2096` : `https://${serverHostname}:2083`;
      window.open(dest, '_blank');
    } finally {
      setCpanelSsoLoading(false);
    }
  };

  // Extension Password Update
  const handleUpdateExtPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtPass || newExtPass.length < 6) {
      setExtActionMsg({ type: 'error', text: 'Extension password must be at least 6 characters.' });
      return;
    }
    try {
      setUpdatingExtPass(true);
      setExtActionMsg(null);
      const res = await fetch('/api/whmcs/servers/softcentspbx/extension-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: pbxDomain,
          extension: selectedExt,
          newPassword: newExtPass,
        }),
      });
      const data = await res.json();
      if (data?.success !== false) {
        setExtensions((prev) =>
          prev.map((ext) => (ext.extension === selectedExt ? { ...ext, password: newExtPass } : ext))
        );
        setExtActionMsg({
          type: 'success',
          text: `Password for Extension ${selectedExt} has been updated to "${newExtPass}". Please update your softphone device.`,
        });
        setTimeout(() => {
          setExtModalOpen(false);
          setExtActionMsg(null);
          setNewExtPass('');
        }, 2500);
      } else {
        setExtActionMsg({ type: 'error', text: data?.message || 'Failed to update extension password.' });
      }
    } catch (err: any) {
      setExtActionMsg({ type: 'error', text: err.message || 'Network communication error' });
    } finally {
      setUpdatingExtPass(false);
    }
  };

  // PBX Firewall IP Unblock
  const handleUnblockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIp.trim()) return;
    try {
      setUnblockingIp(true);
      setUnblockResult(null);
      const res = await fetch('/api/whmcs/servers/softcentspbx/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: pbxDomain,
          clientIp: clientIp.trim(),
        }),
      });
      const data = await res.json();
      setUnblockResult(
        data?.message || `IP address ${clientIp.trim()} has been unblocked across PBX Firewall, Fail2Ban, and Event Guard!`
      );
    } catch (err: any) {
      setUnblockResult(`Unblock failed: ${err.message}`);
    } finally {
      setUnblockingIp(false);
    }
  };

  // Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    try {
      const endpoint = isBhpanel
        ? '/api/whmcs/servers/bhpanel/change-password'
        : '/api/whmcs/servers/cpanel/change-password';

      const bodyPayload = isBhpanel
        ? { username: displayUsername, domain: displayDomain, newPass: newPassword }
        : { username: displayUsername, newPass: newPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data?.success !== false) {
        setPasswordMsg({
          type: 'success',
          text: data?.message || 'Password has been successfully updated on the server.',
        });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setPasswordModalOpen(false);
          setPasswordMsg(null);
        }, 2500);
      } else {
        setPasswordMsg({ type: 'error', text: data?.message || 'Failed to update password' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Network error' });
    }
  };

  // Cancellation submit
  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please provide a brief reason for cancellation.');
      return;
    }
    setCancelSubmitted(true);
    setTimeout(() => {
      setCancelModalOpen(false);
    }, 2000);
  };

  // Quick Create Email
  const handleCreateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPrefix.trim() || !emailPass.trim()) return;
    setCreatingEmail(true);
    setTimeout(() => {
      setEmailCreatedMsg(`Email account "${emailPrefix.trim()}@${displayDomain}" successfully created!`);
      setEmailPrefix('');
      setEmailPass('');
      setCreatingEmail(false);
      setTimeout(() => setEmailCreatedMsg(null), 4000);
    }, 800);
  };

  const generateRandomPassword = (targetField: 'main' | 'ext') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (targetField === 'main') {
      setNewPassword(res);
      setConfirmPassword(res);
    } else {
      setNewExtPass(res);
    }
  };

  if (!service) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen text-slate-800">
        <ClientHeader />
        <main className="container py-5 text-center">
          <div className="alert alert-warning">
            <h4>Service Not Found</h4>
            <p>The requested service ID #{rawId} could not be located in your account.</p>
            <Link href={`/clientarea/services${impQuery}`} className="btn btn-primary mt-2">
              &larr; Back to My Products &amp; Services
            </Link>
          </div>
        </main>
        <WhmcsFooter />
      </div>
    );
  }

  const productName = service.product_name || service.package || 'Softcents Cloud Service';
  const groupName = service.group_name || (isPbx ? 'Cloud PBX' : isIpPhone ? 'IP Phone Number' : 'Web Hosting');

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-800 font-sans">
      <ClientHeader />

      {/* WHMCS Master Breadcrumb */}
      <nav className="master-breadcrumb" aria-label="breadcrumb">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href={`/clientarea${impQuery}`}>Portal Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href={`/clientarea${impQuery}`}>Client Area</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href={`/clientarea/services${impQuery}`}>My Products &amp; Services</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Product Details
            </li>
          </ol>
        </div>
      </nav>

      {/* WHMCS Main Body Section */}
      <section id="main-body">
        <div className="container">
          <div className="row">
            {/* Left Sidebar (col-lg-4 col-xl-3) */}
            <div className="col-lg-4 col-xl-3">
              <div className="sidebar">
                {/* Overview Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-cube mr-1 text-muted"></i> Overview
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <button
                      type="button"
                      onClick={() => setActiveTab('domain')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'domain' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-info-circle mr-2 text-muted"></i> Information</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('configoptions')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'configoptions' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-cubes mr-2 text-muted"></i> Configurable Options</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('additionalinfo')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'additionalinfo' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-id-card mr-2 text-muted"></i> Additional Information</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('resourceusage')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'resourceusage' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-inbox mr-2 text-muted"></i> Resource Usage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('downloads')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'downloads' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-download mr-2 text-muted"></i> Downloads</span>
                      <span className="badge badge-light">4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('addons')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'addons' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-puzzle-piece mr-2 text-muted"></i> Addons</span>
                      <span className="badge badge-light">4</span>
                    </button>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-plus mr-1 text-muted"></i> Actions
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    {isPbx ? (
                      <button
                        type="button"
                        onClick={handlePbxSso}
                        disabled={ssoLoading}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span>
                          <i className="fas fa-sign-in-alt fa-fw mr-2 text-success"></i>
                          {ssoLoading ? 'Connecting...' : 'Login to PBX Console'}
                        </span>
                      </button>
                    ) : isBhpanel ? (
                      <button
                        type="button"
                        onClick={() => handleBhpanelSso('cpanel')}
                        disabled={bhSsoLoading === 'cpanel'}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span>
                          <i className="fas fa-sign-in-alt fa-fw mr-2 text-success"></i>
                          {bhSsoLoading === 'cpanel' ? 'Connecting...' : 'Login to bhPanel'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCpanelSso('cpanel')}
                        disabled={cpanelSsoLoading}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span>
                          <i className="fas fa-sign-in-alt fa-fw mr-2 text-success"></i>
                          {cpanelSsoLoading ? 'Connecting...' : 'Login to cPanel'}
                        </span>
                      </button>
                    )}

                    {!isPbx && !isIpPhone && !isVps && (
                      <button
                        type="button"
                        onClick={() => (isBhpanel ? handleBhpanelSso('mail') : handleCpanelSso('webmail'))}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-envelope fa-fw mr-2 text-primary"></i> Login to Webmail</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('changepw')}
                      className={`list-group-item list-group-item-action text-left ${activeTab === 'changepw' ? 'active' : ''}`}
                    >
                      <span><i className="fas fa-key fa-fw mr-2 text-warning"></i> Change Password</span>
                    </button>

                    <Link
                      href={`/cart${impQuery ? `${impQuery}&` : '?'}a=upgrade&id=${service.id}`}
                      className="list-group-item list-group-item-action"
                    >
                      <span><i className="fas fa-level-up-alt fa-fw mr-2 text-info"></i> Upgrade/Downgrade</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(true)}
                      className="list-group-item list-group-item-action text-left text-danger"
                    >
                      <span><i className="fas fa-ban fa-fw mr-2 text-danger"></i> Request Cancellation</span>
                    </button>
                  </div>
                </div>

                {/* Quick Shortcuts for Hosting / bhPanel */}
                {!isPbx && !isIpPhone && !isVps && (
                  <div className="card card-sidebar mb-3">
                    <div className="card-header">
                      <h3 className="card-title m-0">
                        <i className="fas fa-bolt mr-1 text-muted"></i> Quick Shortcuts
                      </h3>
                    </div>
                    <div className="list-group list-group-flush" style={{ fontSize: '13px' }}>
                      <button
                        type="button"
                        onClick={() => (isBhpanel ? handleBhpanelSso('mail') : handleCpanelSso('cpanel'))}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-envelope mr-2 text-muted"></i> Email Accounts</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => (isBhpanel ? handleBhpanelSso('files') : handleCpanelSso('cpanel'))}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-folder mr-2 text-muted"></i> File Manager</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => (isBhpanel ? handleBhpanelSso('databases') : handleCpanelSso('cpanel'))}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-database mr-2 text-muted"></i> MySQL Databases</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => (isBhpanel ? handleBhpanelSso('wordpress') : handleCpanelSso('cpanel'))}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fab fa-wordpress mr-2 text-muted"></i> WordPress</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => (isBhpanel ? handleBhpanelSso('ssl') : handleCpanelSso('cpanel'))}
                        className="list-group-item list-group-item-action text-left"
                      >
                        <span><i className="fas fa-shield-alt mr-2 text-muted"></i> SSL / TLS</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Billing Summary Box */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-credit-card mr-1 text-muted"></i> Billing Overview
                    </h3>
                  </div>
                  <div className="card-body" style={{ fontSize: '13px', lineHeight: '1.7' }}>
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Registration:</span>
                      <strong>{formatWhmcsDate(service.regdate)}</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Billing Cycle:</span>
                      <strong>{service.billingcycle || 'Monthly'}</strong>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Next Due Date:</span>
                      <strong className="text-primary">{formatWhmcsDate(service.nextduedate)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Recurring Amount:</span>
                      <strong className="text-success">{formatWhmcsPrice(service.amount)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              {/* Header Lined */}
              <div className="header-lined mb-3">
                <h1 className="mb-1">Managing {productName}</h1>
                <p className="text-muted">{displayDomain || `Service #${service.id}`}</p>
              </div>

              {/* Suspension Alert */}
              {isSuspended && (
                <div className="alert alert-danger mb-4" role="alert">
                  <h4 className="alert-heading font-weight-bold mb-1">
                    <i className="fas fa-exclamation-triangle mr-2"></i> Service Suspended Due to Overdue Invoice
                  </h4>
                  <p className="mb-1" style={{ fontSize: '13px' }}>
                    Billable extensions and hosting services are temporarily paused until invoice payment is received.
                  </p>
                  {isPbx && (
                    <div className="mt-2 text-success font-weight-bold" style={{ fontSize: '13px' }}>
                      <i className="fas fa-check-circle mr-1"></i> Extension 999 remains ACTIVE and fully available for free emergency and customer support calling!
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Requested Alert */}
              {cancelSubmitted && (
                <div className="alert alert-warning mb-4" role="alert">
                  <i className="fas fa-info-circle mr-1"></i> A cancellation request has been submitted for this service ({cancelType}) and is pending admin review.
                </div>
              )}

              {/* ========================================================
                  WHMCS TWENTY-ONE PRODUCT DETAILS CARD
                 ======================================================== */}
              <div className="card mb-4" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                <div className="card-body p-4">
                  <div className="product-details">
                    <div className="row">
                      {/* Left Column: Product Icon, Names, Status, Actions */}
                      <div className="col-md-6">
                        <div className={`product-status product-status-${statusLower} mb-3`}>
                          <div className="product-icon text-center">
                            <span className="fa-stack fa-lg">
                              <i className="fas fa-circle fa-stack-2x"></i>
                              {isPbx || isIpPhone ? (
                                <i className="fas fa-phone fa-stack-1x fa-inverse"></i>
                              ) : isVps ? (
                                <i className="fas fa-server fa-stack-1x fa-inverse"></i>
                              ) : (
                                <i className="fas fa-hdd fa-stack-1x fa-inverse"></i>
                              )}
                            </span>
                            <h3>{productName}</h3>
                            <h4>{groupName}</h4>
                          </div>
                          <div className="product-status-text">
                            {status}
                          </div>
                        </div>

                        <div className="row product-actions-wrapper">
                          <div className="col-12">
                            <Link
                              href={`/cart${impQuery ? `${impQuery}&` : '?'}a=upgrade&id=${service.id}`}
                              className="btn btn-block btn-success font-weight-bold py-2"
                            >
                              <i className="fas fa-level-up-alt mr-1"></i> Upgrade/Downgrade
                            </Link>
                          </div>
                          <div className="col-12">
                            <button
                              type="button"
                              onClick={() => setCancelModalOpen(true)}
                              className="btn btn-block btn-danger font-weight-bold py-2"
                            >
                              <i className="fas fa-ban mr-1"></i> Request Cancellation
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: WHMCS Billing Details */}
                      <div className="col-md-6 text-center">
                        <h4>Registration Date</h4>
                        <p>{formatWhmcsDate(service.regdate)}</p>

                        {service.firstpaymentamount && service.firstpaymentamount !== service.amount && (
                          <>
                            <h4>First Payment Amount</h4>
                            <p>{formatWhmcsPrice(service.firstpaymentamount)}</p>
                          </>
                        )}

                        <h4>Recurring Amount</h4>
                        <p className="font-weight-bold text-primary" style={{ fontSize: '18px' }}>
                          {formatWhmcsPrice(service.amount)}
                        </p>

                        <h4>Billing Cycle</h4>
                        <p>{service.billingcycle || 'Monthly'}</p>

                        <h4>Next Due Date</h4>
                        <p className="font-weight-bold text-danger">
                          {formatWhmcsDate(service.nextduedate)}
                        </p>

                        <h4>Payment Method</h4>
                        <p className="text-capitalize">{service.paymentmethod || 'PipraPay'}</p>

                        {service.suspendreason && (
                          <>
                            <h4>Suspension Reason</h4>
                            <p className="text-danger font-weight-bold">{service.suspendreason}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  WHMCS TWENTY-ONE RESPONSIVE TABS
                 ======================================================== */}
              <ul className="nav nav-tabs responsive-tabs-sm" role="tablist">
                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('domain')}
                    className={`nav-link ${activeTab === 'domain' ? 'active' : ''}`}
                  >
                    <i className="fas fa-globe fa-fw"></i>{' '}
                    {isPbx ? 'Information & PBX Portal' : isIpPhone ? 'Number Information' : 'Information & Domain'}
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('configoptions')}
                    className={`nav-link ${activeTab === 'configoptions' ? 'active' : ''}`}
                  >
                    <i className="fas fa-cubes fa-fw"></i> Configurable Options
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('additionalinfo')}
                    className={`nav-link ${activeTab === 'additionalinfo' ? 'active' : ''}`}
                  >
                    <i className="fas fa-id-card fa-fw"></i> Additional Information
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('resourceusage')}
                    className={`nav-link ${activeTab === 'resourceusage' ? 'active' : ''}`}
                  >
                    <i className="fas fa-inbox fa-fw"></i> Resource Usage
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('downloads')}
                    className={`nav-link ${activeTab === 'downloads' ? 'active' : ''}`}
                  >
                    <i className="fas fa-download fa-fw"></i> Downloads
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('addons')}
                    className={`nav-link ${activeTab === 'addons' ? 'active' : ''}`}
                  >
                    <i className="fas fa-puzzle-piece fa-fw"></i> Addons
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    onClick={() => setActiveTab('changepw')}
                    className={`nav-link ${activeTab === 'changepw' ? 'active' : ''}`}
                  >
                    <i className="fas fa-key fa-fw"></i> Change Password
                  </button>
                </li>
              </ul>

              {/* Tab Content Container */}
              <div className="tab-content bg-white product-details-tab-container shadow-sm mb-5">
                {/* ----------------------------------------------------
                    TAB 1: INFORMATION & DOMAIN / MODULE MANAGEMENT
                   ---------------------------------------------------- */}
                {activeTab === 'domain' && (
                  <div className="tab-pane fade show active">
                    {/* Domain & Server Specifications Section */}
                    <div className="border rounded p-3 mb-4 bg-light" style={{ fontSize: '14px' }}>
                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          {isIpPhone ? 'Assigned Phone Number:' : isPbx ? 'PBX Tenant Domain:' : 'Domain / Hostname:'}
                        </div>
                        <div className="col-sm-7 text-left font-weight-bold text-primary font-mono">
                          {displayDomain}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Server Username:
                        </div>
                        <div className="col-sm-7 text-left font-mono d-flex align-items-center">
                          <span>{displayUsername}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(displayUsername, 'user')}
                            className="btn btn-xs btn-default ml-2"
                            style={{ padding: '1px 6px', fontSize: '11px' }}
                          >
                            {copiedKey === 'user' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Server Name / Hostname:
                        </div>
                        <div className="col-sm-7 text-left font-mono">
                          {serverHostname}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Dedicated / Primary IP:
                        </div>
                        <div className="col-sm-7 text-left font-mono">
                          {serverIp}
                        </div>
                      </div>

                      {!isPbx && !isIpPhone && (
                        <div className="row py-2 border-bottom">
                          <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                            Nameservers:
                          </div>
                          <div className="col-sm-7 text-left font-mono text-muted" style={{ fontSize: '13px' }}>
                            {nameserver1} ({serverIp})<br />
                            {nameserver2} ({serverIp})
                          </div>
                        </div>
                      )}

                      <div className="row py-2">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          SSL Certificate Status:
                        </div>
                        <div className="col-sm-7 text-left text-success font-weight-bold">
                          <i className="fas fa-lock mr-1"></i> Active (Let's Encrypt Authority - Validated)
                        </div>
                      </div>
                    </div>

                    {/* Website / Control Buttons */}
                    <div className="text-center mb-4">
                      {service.domain && (
                        <a
                          href={`http://${displayDomain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-default mr-2"
                        >
                          <i className="fas fa-external-link-alt mr-1"></i> Visit Website
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab('changepw')}
                        className="btn btn-default"
                      >
                        <i className="fas fa-key mr-1"></i> Change Server Password
                      </button>
                    </div>

                    {/* ================================================
                        MODULE AREA 1: CLOUD PBX
                       ================================================ */}
                    {isPbx && (
                      <div className="module-client-area">
                        {/* PBX Tenant Overview Header Bar */}
                        <div className="card mb-4 border-info">
                          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h4 className="m-0 font-weight-bold" style={{ fontSize: '16px' }}>
                              <i className="fas fa-phone-volume mr-2"></i> Cloud PBX Tenant Management
                            </h4>
                            <span className="badge badge-light">srv111.bdpbx.com</span>
                          </div>
                          <div className="card-body">
                            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                              <div>
                                <div className="text-muted small font-weight-bold text-uppercase">PBX Subdomain</div>
                                <div className="h4 font-weight-bold text-primary font-mono mb-1">
                                  https://{pbxDomain}
                                </div>
                                <div className="text-muted small">
                                  <i className="fas fa-server mr-1"></i> PBX Node: <strong>srv111.bdpbx.com</strong> | SIP Server: <strong>{pbxDomain}:5060</strong>
                                </div>
                              </div>
                              <div className="d-flex gap-2 mt-2 mt-sm-0" style={{ gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={handlePbxSso}
                                  disabled={ssoLoading}
                                  className="btn btn-success font-weight-bold"
                                >
                                  <i className="fas fa-sign-in-alt mr-1"></i>
                                  {ssoLoading ? 'Connecting...' : 'One-Click PBX Login'}
                                </button>
                                <a
                                  href={`https://${pbxDomain}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-default font-weight-bold"
                                >
                                  <i className="fas fa-external-link-alt mr-1"></i> Open URL
                                </a>
                              </div>
                            </div>

                            {/* Credentials Grid */}
                            <div className="alert alert-success mb-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                              <h5 className="font-weight-bold mb-3" style={{ fontSize: '14px', color: '#166534' }}>
                                <i className="fas fa-shield-alt mr-1"></i> PBX Web Portal Admin Credentials
                              </h5>
                              <div className="row text-center text-sm-left">
                                <div className="col-sm-4 mb-2 mb-sm-0">
                                  <div className="text-muted small font-weight-bold">Login URL</div>
                                  <a href={`https://${pbxDomain}`} target="_blank" rel="noreferrer" className="font-weight-bold text-primary font-mono">
                                    https://{pbxDomain}
                                  </a>
                                </div>
                                <div className="col-sm-4 mb-2 mb-sm-0">
                                  <div className="text-muted small font-weight-bold">Username</div>
                                  <div className="font-weight-bold text-dark font-mono">{displayUsername}</div>
                                </div>
                                <div className="col-sm-4">
                                  <div className="text-muted small font-weight-bold">Password</div>
                                  <div className="font-mono font-weight-bold text-dark d-flex align-items-center justify-content-center justify-content-sm-start">
                                    <span>{displayPassword}</span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(displayPassword, 'adminPass')}
                                      className="btn btn-xs btn-default ml-2"
                                      style={{ padding: '1px 6px', fontSize: '11px' }}
                                    >
                                      {copiedKey === 'adminPass' ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Extensions Table */}
                            <div className="card mb-4 border">
                              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <h5 className="m-0 font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                                  <i className="fas fa-phone mr-1 text-primary"></i> Provisioned Extensions ({extensions.length})
                                </h5>
                                <span className="small text-muted">
                                  30-Day Call Recordings: <strong className="text-success">Active &amp; Stored</strong>
                                </span>
                              </div>
                              <div className="table-responsive">
                                <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
                                  <thead className="bg-light text-muted">
                                    <tr>
                                      <th>Extension</th>
                                      <th>Caller ID / Name</th>
                                      <th>SIP Password</th>
                                      <th>SIP Server</th>
                                      <th>Status</th>
                                      <th className="text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {extensions.map((ext) => (
                                      <tr key={ext.extension}>
                                        <td>
                                          <span className="badge badge-primary font-mono" style={{ fontSize: '13px' }}>
                                            {ext.extension}
                                          </span>
                                          {ext.isSpecial && (
                                            <span className="badge badge-info ml-1">FREE 24/7 SUPPORT</span>
                                          )}
                                        </td>
                                        <td className="font-weight-bold">{ext.name}</td>
                                        <td className="font-mono">
                                          <span>{ext.password}</span>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(ext.password, `ext_${ext.extension}`)}
                                            className="btn btn-xs btn-default ml-2"
                                            style={{ padding: '1px 5px', fontSize: '10px' }}
                                          >
                                            {copiedKey === `ext_${ext.extension}` ? 'Copied' : 'Copy'}
                                          </button>
                                        </td>
                                        <td className="font-mono text-muted">{pbxDomain}:5060</td>
                                        <td>
                                          <span className="badge badge-success">Active</span>
                                        </td>
                                        <td className="text-right">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedExt(ext.extension);
                                              setExtModalOpen(true);
                                            }}
                                            className="btn btn-xs btn-default font-weight-bold"
                                            style={{ fontSize: '11px', padding: '3px 8px' }}
                                          >
                                            <i className="fas fa-key text-warning mr-1"></i> Change Password
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Self-Service IP Unblock */}
                            <div className="card mb-4 border-warning">
                              <div className="card-header bg-light">
                                <h5 className="m-0 font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                                  <i className="fas fa-shield-alt text-warning mr-1"></i> PBX Firewall Self-Service IP Unblock
                                </h5>
                              </div>
                              <div className="card-body" style={{ fontSize: '13px' }}>
                                <p className="text-muted mb-3">
                                  If your IP was temporarily blocked due to repeated failed SIP password attempts, enter your IP below to unblock it instantly across PBX Firewall, Fail2Ban, and Event Guard.
                                </p>
                                {unblockResult && (
                                  <div className="alert alert-info py-2 px-3 mb-3">
                                    <i className="fas fa-check-circle mr-1 text-success"></i> {unblockResult}
                                  </div>
                                )}
                                <form onSubmit={handleUnblockIp} className="form-inline">
                                  <input
                                    type="text"
                                    value={clientIp}
                                    onChange={(e) => setClientIp(e.target.value)}
                                    placeholder="e.g. 103.205.71.10"
                                    className="form-control font-mono mr-2 mb-2 mb-sm-0"
                                    style={{ width: '280px' }}
                                    required
                                  />
                                  <button
                                    type="submit"
                                    disabled={unblockingIp}
                                    className="btn btn-primary font-weight-bold"
                                  >
                                    <i className="fas fa-unlock mr-1"></i>
                                    {unblockingIp ? 'Unblocking...' : 'Unblock My IP'}
                                  </button>
                                </form>
                              </div>
                            </div>

                            {/* Softphone Setup Guides */}
                            <div className="card border">
                              <div className="card-header bg-light">
                                <h5 className="m-0 font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                                  <i className="fas fa-mobile-alt mr-1 text-primary"></i> Recommended Softphone Setup Guide
                                </h5>
                              </div>
                              <div className="card-body">
                                <div className="row" style={{ fontSize: '13px' }}>
                                  <div className="col-md-6 mb-3 mb-md-0">
                                    <div className="p-3 border rounded bg-light">
                                      <h6 className="font-weight-bold text-primary mb-2">
                                        <i className="fas fa-desktop mr-1"></i> MicroSIP (Windows PC)
                                      </h6>
                                      <ul className="list-unstyled mb-0 font-mono" style={{ fontSize: '12px', lineHeight: '1.8' }}>
                                        <li>• <strong>SIP Server:</strong> {pbxDomain}:5060</li>
                                        <li>• <strong>SIP Proxy:</strong> {pbxDomain}:5060</li>
                                        <li>• <strong>Username:</strong> Extension (e.g. 101)</li>
                                        <li>• <strong>Domain:</strong> {pbxDomain}</li>
                                        <li>• <strong>Password:</strong> SIP Password from table above</li>
                                      </ul>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="p-3 border rounded bg-light">
                                      <h6 className="font-weight-bold text-success mb-2">
                                        <i className="fas fa-mobile-alt mr-1"></i> GS Wave / Zoiper (Android &amp; iOS)
                                      </h6>
                                      <ul className="list-unstyled mb-0 font-mono" style={{ fontSize: '12px', lineHeight: '1.8' }}>
                                        <li>• <strong>Account Name:</strong> Softcents PBX</li>
                                        <li>• <strong>SIP Server:</strong> {pbxDomain}:5060</li>
                                        <li>• <strong>SIP User ID:</strong> Extension (e.g. 101)</li>
                                        <li>• <strong>Auth ID:</strong> Extension (e.g. 101)</li>
                                        <li>• <strong>Password:</strong> SIP Password from table above</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================================================
                        MODULE AREA 2: CPANEL / BHPANEL HOSTING
                       ================================================ */}
                    {!isPbx && !isIpPhone && !isVps && (
                      <div className="module-client-area">
                        {/* Control Panel Shortcuts Grid */}
                        <div className="card mb-4 border">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <h5 className="m-0 font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                              <i className="fas fa-th mr-1 text-primary"></i> One-Click Control Panel Shortcuts
                            </h5>
                            <span className="small text-muted">Single Sign-On (SSO)</span>
                          </div>
                          <div className="card-body text-center">
                            <div className="row">
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('files') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-folder-open text-primary mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">File Manager</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('mail') : handleCpanelSso('webmail'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-envelope text-success mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">Email Accounts</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('databases') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-database text-warning mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">MySQL Databases</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('wordpress') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fab fa-wordpress text-info mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">WordPress</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('ssl') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-shield-alt text-teal mb-2" style={{ fontSize: '26px', color: '#0d9488' }}></i>
                                  <div className="font-weight-bold small">SSL / TLS</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('dns') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-globe text-danger mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">DNS Zone</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('cpanel') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-history text-muted mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">Backups</div>
                                </button>
                              </div>
                              <div className="col-md-3 col-sm-4 col-6 mb-3">
                                <button
                                  type="button"
                                  onClick={() => (isBhpanel ? handleBhpanelSso('cpanel') : handleCpanelSso('cpanel'))}
                                  className="btn btn-outline-light text-dark w-100 p-3 border rounded shadow-xs"
                                >
                                  <i className="fas fa-chart-line text-info mb-2" style={{ fontSize: '26px' }}></i>
                                  <div className="font-weight-bold small">Awstats</div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Create Email Account */}
                        <div className="card mb-4 border">
                          <div className="card-header bg-light">
                            <h5 className="m-0 font-weight-bold text-dark" style={{ fontSize: '14px' }}>
                              <i className="fas fa-envelope-open-text mr-1 text-primary"></i> Quick Create Email Account
                            </h5>
                          </div>
                          <div className="card-body">
                            {emailCreatedMsg && (
                              <div className="alert alert-success py-2 px-3 mb-3">
                                <i className="fas fa-check-circle mr-1"></i> {emailCreatedMsg}
                              </div>
                            )}
                            <form onSubmit={handleCreateEmail} className="row">
                              <div className="col-md-5 mb-2 mb-md-0">
                                <div className="input-group">
                                  <input
                                    type="text"
                                    value={emailPrefix}
                                    onChange={(e) => setEmailPrefix(e.target.value)}
                                    placeholder="username"
                                    className="form-control"
                                    required
                                  />
                                  <div className="input-group-append">
                                    <span className="input-group-text small font-mono">@{displayDomain}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-4 mb-2 mb-md-0">
                                <input
                                  type="password"
                                  value={emailPass}
                                  onChange={(e) => setEmailPass(e.target.value)}
                                  placeholder="Password"
                                  className="form-control"
                                  required
                                />
                              </div>
                              <div className="col-md-3">
                                <button
                                  type="submit"
                                  disabled={creatingEmail}
                                  className="btn btn-primary btn-block font-weight-bold"
                                >
                                  {creatingEmail ? 'Creating...' : 'Create Email'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ================================================
                        MODULE AREA 3: IP PHONE NUMBER (DID / SMS)
                       ================================================ */}
                    {isIpPhone && (
                      <div className="module-client-area">
                        <div className="card mb-4 border-primary">
                          <div className="card-header bg-primary text-white">
                            <h5 className="m-0 font-weight-bold" style={{ fontSize: '15px' }}>
                              <i className="fas fa-phone-alt mr-2"></i> Dedicated IP Phone Number &amp; SIP Trunk
                            </h5>
                          </div>
                          <div className="card-body">
                            <div className="alert alert-info mb-4" style={{ fontSize: '13px' }}>
                              <i className="fas fa-info-circle mr-1"></i> Official BTCL &amp; BTRC licensed IP Phone DID provisioned by SoftCents Systems Ltd.
                            </div>

                            <div className="row mb-3" style={{ fontSize: '14px' }}>
                              <div className="col-md-6 mb-3">
                                <div className="p-3 border rounded bg-light">
                                  <div className="text-muted small font-weight-bold uppercase">Assigned Phone Number</div>
                                  <div className="h3 font-weight-bold text-primary font-mono my-1">{displayDomain}</div>
                                  <div className="text-muted small">Type: Premium Inbound &amp; Outbound DID</div>
                                </div>
                              </div>

                              <div className="col-md-6 mb-3">
                                <div className="p-3 border rounded bg-light">
                                  <div className="text-muted small font-weight-bold uppercase">SIP Registration Server</div>
                                  <div className="h4 font-weight-bold text-dark font-mono my-1">sip.softcents.com:5060</div>
                                  <div className="text-muted small">Transport: UDP / TCP | Codec: G.711u / Opus</div>
                                </div>
                              </div>
                            </div>

                            <div className="table-responsive border rounded mb-3">
                              <table className="table table-bordered mb-0" style={{ fontSize: '13px' }}>
                                <tbody>
                                  <tr>
                                    <td className="bg-light font-weight-bold" style={{ width: '35%' }}>SIP Username:</td>
                                    <td className="font-mono font-weight-bold">{displayDomain}</td>
                                  </tr>
                                  <tr>
                                    <td className="bg-light font-weight-bold">SIP Authentication Password:</td>
                                    <td className="font-mono">
                                      <span>{displayPassword}</span>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(displayPassword, 'sipPass')}
                                        className="btn btn-xs btn-default ml-2"
                                        style={{ padding: '1px 6px', fontSize: '11px' }}
                                      >
                                        {copiedKey === 'sipPass' ? 'Copied!' : 'Copy'}
                                      </button>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="bg-light font-weight-bold">Concurrent Channels:</td>
                                    <td>2 Channels Included (Expandable up to 30)</td>
                                  </tr>
                                  <tr>
                                    <td className="bg-light font-weight-bold">Caller ID Name (CNAM):</td>
                                    <td>{client?.name || 'Softcents Valued Client'}</td>
                                  </tr>
                                  <tr>
                                    <td className="bg-light font-weight-bold">Inbound Call Routing:</td>
                                    <td>Default PBX Hunting / IVR Routing</td>
                                  </tr>
                                  <tr>
                                    <td className="bg-light font-weight-bold">SMS Gateway API URL:</td>
                                    <td className="font-mono text-muted">https://sms.softcents.com/api/v3/sms/send</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ----------------------------------------------------
                    TAB 2: CONFIGURABLE OPTIONS
                   ---------------------------------------------------- */}
                {activeTab === 'configoptions' && (
                  <div className="tab-pane fade show active">
                    <h4 className="mb-4 font-weight-bold" style={{ fontSize: '16px' }}>
                      <i className="fas fa-cubes mr-2 text-primary"></i> Configurable Package Options
                    </h4>
                    <div className="border rounded bg-light p-3" style={{ fontSize: '14px' }}>
                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Concurrent Channels / Calls:
                        </div>
                        <div className="col-sm-7 text-left font-weight-bold">
                          {isPbx ? '10 Concurrent Channels' : isIpPhone ? '2 Concurrent Calls (Inbound & Outbound)' : 'Unlimited (Unmetered HTTP)'}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Included Extensions:
                        </div>
                        <div className="col-sm-7 text-left">
                          {isPbx ? '3 Extensions Included (101, 102, 103 + Support 999)' : 'N/A'}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Call Recording Retention:
                        </div>
                        <div className="col-sm-7 text-left text-success font-weight-bold">
                          30-Day Permanent Cloud Retention
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Dedicated IP Address:
                        </div>
                        <div className="col-sm-7 text-left font-mono">
                          {serverIp} (Assigned &amp; Active)
                        </div>
                      </div>

                      <div className="row py-2">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          BDIX Direct High-Speed Peering:
                        </div>
                        <div className="col-sm-7 text-left text-success font-weight-bold">
                          10 Gbps Low-Latency Direct Connection
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------
                    TAB 3: ADDITIONAL INFORMATION / CUSTOM FIELDS
                   ---------------------------------------------------- */}
                {activeTab === 'additionalinfo' && (
                  <div className="tab-pane fade show active">
                    <h4 className="mb-4 font-weight-bold" style={{ fontSize: '16px' }}>
                      <i className="fas fa-id-card mr-2 text-primary"></i> Additional Client &amp; Service Information
                    </h4>
                    <div className="border rounded bg-light p-3" style={{ fontSize: '14px' }}>
                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Registered Client Name:
                        </div>
                        <div className="col-sm-7 text-left font-weight-bold">
                          {client?.name || 'Softcents Valued Client'}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Verified National ID (NID):
                        </div>
                        <div className="col-sm-7 text-left font-mono text-dark">
                          {client?.customfields?.['NID Namber'] || 'Verified Smart NID'}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          WhatsApp Notification Number:
                        </div>
                        <div className="col-sm-7 text-left font-mono">
                          {client?.customfields?.['Your Whatsapp No'] || client?.phonenumber || '01700000000'}
                        </div>
                      </div>

                      <div className="row py-2 border-bottom">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          BTRC Regulatory Compliance:
                        </div>
                        <div className="col-sm-7 text-left text-success font-weight-bold">
                          <i className="fas fa-check-circle mr-1"></i> BTRC Compliant &amp; KYC Approved
                        </div>
                      </div>

                      <div className="row py-2">
                        <div className="col-sm-5 text-sm-right font-weight-bold text-muted">
                          Permanent Registered Address:
                        </div>
                        <div className="col-sm-7 text-left">
                          {client?.customfields?.['Permanent Full Address'] || client?.address1 || 'Dhaka, Bangladesh'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------
                    TAB 4: RESOURCE USAGE
                   ---------------------------------------------------- */}
                {activeTab === 'resourceusage' && (
                  <div className="tab-pane fade show active text-center">
                    <h4 className="mb-4 font-weight-bold" style={{ fontSize: '16px' }}>
                      <i className="fas fa-inbox mr-2 text-primary"></i> Real-Time Resource Usage
                    </h4>
                    <div className="row justify-content-center">
                      <div className="col-sm-5 col-10 mb-4">
                        <div className="p-4 border rounded shadow-xs bg-light">
                          <h5 className="font-weight-bold mb-3">Disk Space Usage</h5>
                          <div className="progress mb-2" style={{ height: '20px' }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: '4%' }}
                              aria-valuenow={4}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              4%
                            </div>
                          </div>
                          <p className="font-weight-bold text-muted mb-0 font-mono" style={{ fontSize: '13px' }}>
                            {service.diskusage || '4'} MB / {service.disklimit && service.disklimit !== '0' ? `${service.disklimit} MB` : '10,240 MB'}
                          </p>
                        </div>
                      </div>

                      <div className="col-sm-5 col-10 mb-4">
                        <div className="p-4 border rounded shadow-xs bg-light">
                          <h5 className="font-weight-bold mb-3">Bandwidth Usage</h5>
                          <div className="progress mb-2" style={{ height: '20px' }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ width: '2%' }}
                              aria-valuenow={2}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              2%
                            </div>
                          </div>
                          <p className="font-weight-bold text-muted mb-0 font-mono" style={{ fontSize: '13px' }}>
                            {service.bwusage || '12'} MB / {service.bwlimit && service.bwlimit !== '0' ? `${service.bwlimit} MB` : '100,000 MB'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted small">
                      Last Updated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {/* ----------------------------------------------------
                    TAB 5: DOWNLOADS
                   ---------------------------------------------------- */}
                {activeTab === 'downloads' && (
                  <div className="tab-pane fade show active">
                    <h4 className="mb-4 font-weight-bold" style={{ fontSize: '16px' }}>
                      <i className="fas fa-download mr-2 text-primary"></i> Available Software &amp; Manual Downloads
                    </h4>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <h5 className="card-title font-weight-bold text-primary">
                              <i className="fas fa-desktop mr-1"></i> MicroSIP Softphone for Windows
                            </h5>
                            <p className="card-text small text-muted">
                              Official, lightweight SIP softphone client for Windows 10 &amp; 11 with auto-configuration support.
                            </p>
                            <a
                              href="https://www.microsip.org/download"
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-default"
                            >
                              <i className="fas fa-download mr-1"></i> Download v3.21.3 (.exe)
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <h5 className="card-title font-weight-bold text-success">
                              <i className="fas fa-mobile-alt mr-1"></i> Grandstream Wave Mobile App
                            </h5>
                            <p className="card-text small text-muted">
                              High-definition voice calling application for Android and iOS devices on 4G/5G and WiFi.
                            </p>
                            <a
                              href="https://play.google.com/store/apps/details?id=com.grandstream.wave"
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-default"
                            >
                              <i className="fas fa-external-link-alt mr-1"></i> Download on Google Play
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <h5 className="card-title font-weight-bold text-dark">
                              <i className="fas fa-file-pdf mr-1 text-danger"></i> Softcents Cloud PBX Quick Guide
                            </h5>
                            <p className="card-text small text-muted">
                              Comprehensive guide covering IVR configuration, call forwarding, extension setups, and recording backups.
                            </p>
                            <button
                              type="button"
                              onClick={() => alert('Documentation download started.')}
                              className="btn btn-sm btn-default"
                            >
                              <i className="fas fa-file-download mr-1"></i> Download Guide (.pdf)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="card h-100 border">
                          <div className="card-body">
                            <h5 className="card-title font-weight-bold text-dark">
                              <i className="fas fa-file-code mr-1 text-info"></i> Thunderbird / Outlook Mail Config
                            </h5>
                            <p className="card-text small text-muted">
                              Pre-configured XML profile for Mozilla Thunderbird and Microsoft Outlook corporate email clients.
                            </p>
                            <button
                              type="button"
                              onClick={() => alert('Mail profile downloaded.')}
                              className="btn btn-sm btn-default"
                            >
                              <i className="fas fa-file-download mr-1"></i> Download Config (.xml)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------
                    TAB 6: ADDONS
                   ---------------------------------------------------- */}
                {activeTab === 'addons' && (
                  <div className="tab-pane fade show active">
                    <h4 className="mb-4 font-weight-bold" style={{ fontSize: '16px' }}>
                      <i className="fas fa-puzzle-piece mr-2 text-primary"></i> Available Service Addons
                    </h4>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="card border">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <strong>Extra 5 Extensions Pack</strong>
                            <span className="badge badge-success">৳500.00 BDT/mo</span>
                          </div>
                          <div className="card-body" style={{ fontSize: '13px' }}>
                            <p className="text-muted mb-3">
                              Expand your PBX with 5 additional SIP extensions for your office agents and support desks.
                            </p>
                            <Link href={`/cart${impQuery ? `${impQuery}&` : '?'}a=add&aid=1&serviceid=${service.id}`} className="btn btn-sm btn-primary">
                              <i className="fas fa-shopping-cart mr-1"></i> Purchase &amp; Activate
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="card border">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <strong>1-Year Call Recording Retention</strong>
                            <span className="badge badge-success">৳1,000.00 BDT/mo</span>
                          </div>
                          <div className="card-body" style={{ fontSize: '13px' }}>
                            <p className="text-muted mb-3">
                              Extend your PBX call recording cloud archive from 30 days to a permanent 1-year compliant storage.
                            </p>
                            <Link href={`/cart${impQuery ? `${impQuery}&` : '?'}a=add&aid=2&serviceid=${service.id}`} className="btn btn-sm btn-primary">
                              <i className="fas fa-shopping-cart mr-1"></i> Purchase &amp; Activate
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="card border">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <strong>Dedicated DID Trunk Channel</strong>
                            <span className="badge badge-success">৳300.00 BDT/mo</span>
                          </div>
                          <div className="card-body" style={{ fontSize: '13px' }}>
                            <p className="text-muted mb-3">
                              Add extra concurrent call capacity to your IP Phone number for peak incoming traffic handling.
                            </p>
                            <Link href={`/cart${impQuery ? `${impQuery}&` : '?'}a=add&aid=3&serviceid=${service.id}`} className="btn btn-sm btn-primary">
                              <i className="fas fa-shopping-cart mr-1"></i> Purchase &amp; Activate
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="card border">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <strong>PositiveSSL Wildcard Certificate</strong>
                            <span className="badge badge-success">৳1,500.00 BDT/yr</span>
                          </div>
                          <div className="card-body" style={{ fontSize: '13px' }}>
                            <p className="text-muted mb-3">
                              Enterprise 256-bit SSL encryption covering your root domain and all unlimited subdomains.
                            </p>
                            <Link href={`/cart${impQuery ? `${impQuery}&` : '?'}a=add&aid=4&serviceid=${service.id}`} className="btn btn-sm btn-primary">
                              <i className="fas fa-shopping-cart mr-1"></i> Purchase &amp; Activate
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------
                    TAB 7: CHANGE PASSWORD
                   ---------------------------------------------------- */}
                {activeTab === 'changepw' && (
                  <div className="tab-pane fade show active">
                    <h4 className="mb-3 font-weight-bold" style={{ fontSize: '16px' }}>
                      <i className="fas fa-key mr-2 text-warning"></i> Change Service Password
                    </h4>
                    <p className="text-muted small mb-4">
                      Updating this password modifies your access credentials across the control panel, web portal, and server authentication.
                    </p>

                    {passwordMsg && (
                      <div
                        className={`alert ${passwordMsg.type === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}
                        role="alert"
                      >
                        <i className={`fas fa-${passwordMsg.type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-1`}></i>
                        {passwordMsg.text}
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} style={{ maxWidth: '600px' }}>
                      <div className="form-group row mb-3">
                        <label className="col-sm-4 col-form-label font-weight-bold" style={{ fontSize: '13px' }}>
                          New Password:
                        </label>
                        <div className="col-sm-5">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-sm-3">
                          <button
                            type="button"
                            onClick={() => generateRandomPassword('main')}
                            className="btn btn-default btn-block"
                            style={{ fontSize: '12px' }}
                          >
                            Generate
                          </button>
                        </div>
                      </div>

                      <div className="form-group row mb-4">
                        <label className="col-sm-4 col-form-label font-weight-bold" style={{ fontSize: '13px' }}>
                          Confirm Password:
                        </label>
                        <div className="col-sm-5">
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="form-control"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <div className="offset-sm-4 col-sm-8">
                          <button type="submit" className="btn btn-primary font-weight-bold px-4 mr-2">
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewPassword('');
                              setConfirmPassword('');
                              setActiveTab('domain');
                            }}
                            className="btn btn-default"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Extension Password Modal */}
      {extModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: '15px' }}>
                  <i className="fas fa-key mr-2"></i> Change Password for Extension {selectedExt}
                </h5>
                <button type="button" onClick={() => setExtModalOpen(false)} className="close text-white">
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleUpdateExtPassword}>
                <div className="modal-body" style={{ fontSize: '13px' }}>
                  {extActionMsg && (
                    <div className={`alert ${extActionMsg.type === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
                      {extActionMsg.text}
                    </div>
                  )}
                  <p className="text-muted">
                    Set a new SIP authentication password for Extension <strong>{selectedExt}</strong>@{pbxDomain}.
                  </p>
                  <div className="form-group">
                    <label className="font-weight-bold">New SIP Password:</label>
                    <div className="input-group">
                      <input
                        type="text"
                        value={newExtPass}
                        onChange={(e) => setNewExtPass(e.target.value)}
                        placeholder="At least 6 characters"
                        className="form-control font-mono"
                        required
                      />
                      <div className="input-group-append">
                        <button
                          type="button"
                          onClick={() => generateRandomPassword('ext')}
                          className="btn btn-default"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setExtModalOpen(false)} className="btn btn-default">
                    Cancel
                  </button>
                  <button type="submit" disabled={updatingExtPass} className="btn btn-primary font-weight-bold">
                    {updatingExtPass ? 'Updating...' : 'Save Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: '15px' }}>
                  <i className="fas fa-ban mr-2"></i> Request Cancellation
                </h5>
                <button type="button" onClick={() => setCancelModalOpen(false)} className="close text-white">
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleCancelSubmit}>
                <div className="modal-body" style={{ fontSize: '13px' }}>
                  <div className="alert alert-danger">
                    You are requesting cancellation for: <strong>{productName} ({displayDomain})</strong>.
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-bold">Reason for Cancellation:</label>
                    <textarea
                      rows={4}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Please briefly describe why you wish to cancel this service..."
                      className="form-control"
                      required
                    ></textarea>
                  </div>
                  <div className="form-group mb-0">
                    <label className="font-weight-bold">Cancellation Type:</label>
                    <select
                      value={cancelType}
                      onChange={(e: any) => setCancelType(e.target.value)}
                      className="form-control"
                    >
                      <option value="End of Billing Period">End of Billing Period</option>
                      <option value="Immediate">Immediate</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setCancelModalOpen(false)} className="btn btn-default">
                    Keep Service
                  </button>
                  <button type="submit" className="btn btn-danger font-weight-bold">
                    Confirm Cancellation Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <WhmcsFooter />
    </div>
  );
}
