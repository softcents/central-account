'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ClientHeader } from '@/components/ClientHeader';
import { WhmcsFooter } from '@/components/WhmcsFooter';
import whmcsData from '@/data/whmcs_sync.json';

function ContactsContent() {
  const searchParams = useSearchParams();
  const impersonate = searchParams.get('impersonate') || searchParams.get('userid');
  const impQuery = impersonate ? `?impersonate=${encodeURIComponent(impersonate)}` : '';

  // Filter contacts
  const initialContacts = useMemo(() => {
    const list = whmcsData?.contacts || [];
    if (impersonate) {
      const matched = list.filter((c: any) => String(c.userid) === String(impersonate));
      if (matched.length > 0) return matched;
    }
    return list;
  }, [impersonate]);

  const [contactsList, setContactsList] = useState<any[]>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState<string>('new');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Bangladesh',
    isSubaccount: false,
    permissions: {
      profile: true,
      products: true,
      invoices: true,
      tickets: true,
      domains: false,
      emails: true,
    },
    emailPrefs: {
      general: true,
      invoice: true,
      support: true,
      product: true,
      domain: false,
    },
  });

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    setSaveMsg(null);
    if (id === 'new') {
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        address1: '',
        city: '',
        state: '',
        postcode: '',
        country: 'Bangladesh',
        isSubaccount: false,
        permissions: {
          profile: true,
          products: true,
          invoices: true,
          tickets: true,
          domains: false,
          emails: true,
        },
        emailPrefs: {
          general: true,
          invoice: true,
          support: true,
          product: true,
          domain: false,
        },
      });
    } else {
      const c = contactsList.find((item) => String(item.id) === String(id));
      if (c) {
        setFormData({
          firstName: c.firstname || '',
          lastName: c.lastname || '',
          company: c.companyname || '',
          email: c.email || '',
          phone: c.phonenumber || '',
          address1: c.address1 || '',
          city: c.city || '',
          state: c.state || '',
          postcode: c.postcode || '',
          country: c.country === 'BD' ? 'Bangladesh' : c.country || 'Bangladesh',
          isSubaccount: c.subaccount === '1' || c.subaccount === 1,
          permissions: {
            profile: true,
            products: true,
            invoices: true,
            tickets: true,
            domains: false,
            emails: true,
          },
          emailPrefs: {
            general: true,
            invoice: true,
            support: true,
            product: true,
            domain: false,
          },
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email) {
      alert('First Name and Email are required.');
      return;
    }

    if (selectedContactId === 'new') {
      const newContact = {
        id: `ct_${Date.now()}`,
        firstname: formData.firstName,
        lastname: formData.lastName,
        companyname: formData.company,
        email: formData.email,
        phonenumber: formData.phone,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country,
        subaccount: formData.isSubaccount ? '1' : '0',
      };
      setContactsList((prev) => [...prev, newContact]);
      setSelectedContactId(newContact.id);
      setSaveMsg('New contact created successfully!');
    } else {
      setContactsList((prev) =>
        prev.map((c) =>
          String(c.id) === String(selectedContactId)
            ? {
                ...c,
                firstname: formData.firstName,
                lastname: formData.lastName,
                companyname: formData.company,
                email: formData.email,
                phonenumber: formData.phone,
                address1: formData.address1,
                city: formData.city,
                state: formData.state,
                postcode: formData.postcode,
                country: formData.country,
                subaccount: formData.isSubaccount ? '1' : '0',
              }
            : c
        )
      );
      setSaveMsg('Contact updated successfully!');
    }

    setTimeout(() => setSaveMsg(null), 4000);
  };

  const handleDelete = () => {
    if (selectedContactId === 'new') return;
    if (confirm('Are you sure you want to delete this contact?')) {
      setContactsList((prev) => prev.filter((c) => String(c.id) !== String(selectedContactId)));
      handleSelectContact('new');
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
              <Link href={`/clientarea${impQuery}`}>Portal Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href={`/clientarea${impQuery}`}>Client Area</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Contacts/Sub-Accounts
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
                    <Link href={`/clientarea/profile${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-user fa-fw mr-2 text-muted"></i> My Details</span>
                    </Link>
                    <Link href={`/clientarea/contacts${impQuery}`} className="list-group-item list-group-item-action active">
                      <span><i className="fas fa-users fa-fw mr-2"></i> Contacts/Sub-Accounts</span>
                    </Link>
                    <Link href={`/clientarea/security${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-lock fa-fw mr-2 text-muted"></i> Security Settings</span>
                    </Link>
                    <Link href={`/clientarea/emails${impQuery}`} className="list-group-item list-group-item-action">
                      <span><i className="fas fa-envelope fa-fw mr-2 text-muted"></i> Email History</span>
                    </Link>
                  </div>
                </div>

                {/* Choose Contact Card */}
                <div className="card card-sidebar mb-3">
                  <div className="card-header">
                    <h3 className="card-title m-0">
                      <i className="fas fa-address-book mr-1 text-muted"></i> Choose Contact
                    </h3>
                  </div>
                  <div className="card-body">
                    <select
                      value={selectedContactId}
                      onChange={(e) => handleSelectContact(e.target.value)}
                      className="form-control"
                      style={{
                        padding: '6px 10px',
                        fontSize: '13px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        width: '100%',
                      }}
                    >
                      <option value="new">+ Add New Contact</option>
                      {contactsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstname} {c.lastname} {c.companyname ? `(${c.companyname})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Primary Content (col-lg-8 col-xl-9) */}
            <div className="col-lg-8 col-xl-9 primary-content">
              <div className="header-lined">
                <h1>Contacts/Sub-Accounts</h1>
              </div>

              {saveMsg && (
                <div className="alert alert-success mb-3 p-3 bg-green-100 text-green-800 rounded">
                  <i className="fas fa-check-circle mr-1"></i> {saveMsg}
                </div>
              )}

              {/* Contact Details Card */}
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title m-0">
                    <i className="fas fa-user-circle mr-1 text-muted"></i>{' '}
                    {selectedContactId === 'new' ? 'Add New Contact' : 'Edit Contact Details'}
                  </h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Address 1
                        </label>
                        <input
                          type="text"
                          value={formData.address1}
                          onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-4 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div className="col-md-4 mb-2 mb-md-0">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="font-weight-bold mb-1" style={{ fontSize: '13px' }}>
                          Postcode
                        </label>
                        <input
                          type="text"
                          value={formData.postcode}
                          onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                          className="form-control"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>

                    {/* Sub-account Access Toggle */}
                    <div className="card mb-4 bg-light">
                      <div className="card-body">
                        <label className="d-flex align-items-center cursor-pointer mb-0">
                          <input
                            type="checkbox"
                            checked={formData.isSubaccount}
                            onChange={(e) => setFormData({ ...formData, isSubaccount: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="font-weight-bold">
                            Activate Sub-Account (Allows client login access)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Email Preferences */}
                    <div className="mb-4">
                      <label className="font-weight-bold d-block mb-2" style={{ fontSize: '13px' }}>
                        Email Notifications
                      </label>
                      <div className="row">
                        <div className="col-sm-6 mb-1">
                          <label className="d-flex align-items-center">
                            <input type="checkbox" defaultChecked className="mr-2" /> General Emails
                          </label>
                        </div>
                        <div className="col-sm-6 mb-1">
                          <label className="d-flex align-items-center">
                            <input type="checkbox" defaultChecked className="mr-2" /> Invoice Emails
                          </label>
                        </div>
                        <div className="col-sm-6 mb-1">
                          <label className="d-flex align-items-center">
                            <input type="checkbox" defaultChecked className="mr-2" /> Support Emails
                          </label>
                        </div>
                        <div className="col-sm-6 mb-1">
                          <label className="d-flex align-items-center">
                            <input type="checkbox" defaultChecked className="mr-2" /> Product Emails
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Submit & Delete Buttons */}
                    <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                      <div>
                        {selectedContactId !== 'new' && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="btn btn-danger"
                          >
                            <i className="fas fa-trash mr-1"></i> Delete Contact
                          </button>
                        )}
                      </div>
                      <div className="d-flex" style={{ gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => handleSelectContact('new')}
                          className="btn btn-default"
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary font-weight-bold">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhmcsFooter />
    </div>
  );
}

export default function ClientContactsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-muted">
          <i className="fas fa-spinner fa-spin fa-2x mr-2"></i> Loading Contacts...
        </div>
      }
    >
      <ContactsContent />
    </Suspense>
  );
}
