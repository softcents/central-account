'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';

export default function ClientSecurityPage() {
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA State
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState('JBSWY3DPEHPK3PXP');
  const [totpCode, setTotpCode] = useState('');
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwdMsg({ type: 'success', text: 'Your account password has been updated successfully.' });
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdMsg(null), 4000);
  };

  const handleCopySecret = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(twoFaSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify2Fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setTwoFaMsg({ type: 'error', text: 'Please enter a valid 6-digit verification code.' });
      return;
    }
    setTwoFaEnabled(true);
    setTwoFaMsg({ type: 'success', text: 'Two-Factor Authentication (2FA) is now enabled for your account!' });
    setTimeout(() => {
      setTwoFaModalOpen(false);
      setTwoFaMsg(null);
      setTotpCode('');
    }, 2000);
  };

  const handleDisable2Fa = () => {
    if (confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      setTwoFaEnabled(false);
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-800">
      <ClientHeader />

      {/* WHMCS Master Breadcrumb */}
      <nav className="master-breadcrumb" aria-label="breadcrumb">
        <div className="container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/clientarea">Portal Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/clientarea">Client Area</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Security Settings
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
                {/* My Account Menu Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-user mr-1 text-muted"></i> My Account
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href="/clientarea/profile" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-user fa-fw mr-2 text-muted"></i> My Details</span>
                    </Link>
                    <Link href="/clientarea/contacts" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-users fa-fw mr-2 text-muted"></i> Contacts/Sub-Accounts</span>
                    </Link>
                    <Link href="/clientarea/security" className="list-group-item list-group-item-action active">
                      <span><i className="fas fa-lock fa-fw mr-2"></i> Security Settings</span>
                    </Link>
                    <Link href="/clientarea/emails" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-envelope fa-fw mr-2 text-muted"></i> Email History</span>
                    </Link>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-arrow-left mr-1 text-muted"></i> Actions
                    </h3>
                  </div>
                  <div className="list-group list-group-flush">
                    <Link href="/clientarea" className="list-group-item list-group-item-action">
                      <span><i className="fas fa-home fa-fw mr-2 text-muted"></i> Back to Client Area</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>Security Settings</h1>
              </div>

              {pwdMsg && (
                <div
                  className={`alert mb-4 p-3 rounded ${
                    pwdMsg.type === 'success' ? 'alert-success bg-green-100 text-green-800' : 'alert-danger bg-red-100 text-red-800'
                  }`}
                >
                  <i className={`fas fa-${pwdMsg.type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2`}></i>
                  {pwdMsg.text}
                </div>
              )}

              {/* Two-Factor Authentication Card */}
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title m-0">
                    <i className="fas fa-shield-alt mr-1 text-primary"></i> Two-Factor Authentication
                  </h3>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    Two-Factor Authentication status:{' '}
                    <strong>{twoFaEnabled ? 'Enabled' : 'Disabled'}</strong>
                  </p>

                  <div className="alert alert-warning mb-3">
                    <i className="fas fa-info-circle mr-1"></i> Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.
                  </div>

                  {twoFaEnabled ? (
                    <button
                      type="button"
                      onClick={handleDisable2Fa}
                      className="btn btn-danger"
                    >
                      <i className="fas fa-times mr-1"></i> Disable Two-Factor Authentication
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTwoFaModalOpen(true)}
                      className="btn btn-success"
                    >
                      <i className="fas fa-key mr-1"></i> Enable Two-Factor Authentication
                    </button>
                  )}
                </div>
              </div>

              {/* Change Password Card */}
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title m-0">
                    <i className="fas fa-lock mr-1 text-muted"></i> Change Password
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePasswordChange}>
                    <div className="form-group mb-3">
                      <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                        Existing Password
                      </label>
                      <input
                        type="password"
                        value={currPassword}
                        onChange={(e) => setCurrPassword(e.target.value)}
                        className="form-control"
                        style={{
                          maxWidth: '400px',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '13px',
                        }}
                        required
                      />
                    </div>

                    <div className="form-group mb-3">
                      <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="form-control"
                        style={{
                          maxWidth: '400px',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '13px',
                        }}
                        required
                      />
                    </div>

                    <div className="form-group mb-4">
                      <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-control"
                        style={{
                          maxWidth: '400px',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '13px',
                        }}
                        required
                      />
                    </div>

                    <div className="d-flex" style={{ gap: '10px' }}>
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                      <button
                        type="reset"
                        onClick={() => {
                          setCurrPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="btn btn-default"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2FA Setup Modal */}
      {twoFaModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '15px',
          }}
        >
          <div className="card max-w-md w-100" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="card-title text-white m-0" style={{ fontSize: '16px' }}>
                <i className="fas fa-qrcode mr-1"></i> Setup Two-Factor Authentication
              </h3>
              <button
                type="button"
                onClick={() => setTwoFaModalOpen(false)}
                className="close text-white"
                style={{ background: 'none', border: 0, fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div className="card-body">
              {twoFaMsg && (
                <div className={`alert mb-3 ${twoFaMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                  {twoFaMsg.text}
                </div>
              )}

              <p className="small text-muted mb-2">
                Scan this QR code with Google Authenticator or enter secret key manually:
              </p>

              <div className="text-center my-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/SoftCents:client@softcents.com?secret=${twoFaSecret}&issuer=SoftCents`}
                  alt="2FA QR Code"
                  style={{ display: 'inline-block', border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}
                />
                <div className="mt-2 font-monospace font-weight-bold" style={{ letterSpacing: '1px' }}>
                  {twoFaSecret}
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="btn btn-default btn-xs ml-2"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerify2Fa}>
                <div className="form-group mb-3">
                  <label className="font-weight-bold small mb-1">Enter 6-digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="form-control text-center font-monospace font-weight-bold"
                    style={{ fontSize: '18px', letterSpacing: '3px' }}
                    required
                  />
                </div>
                <div className="d-flex justify-content-end" style={{ gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTwoFaModalOpen(false)}
                    className="btn btn-default"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Verify &amp; Enable
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
