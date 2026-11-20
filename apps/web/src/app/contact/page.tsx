'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    department: 'Sales & Presales',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <ClientHeader />
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            / Contact Us
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#1A4D80]" />
            Contact Us & Presales Questions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Have questions about our cloud hosting, VPS, or PBX plans? Get in touch with our team.
          </p>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Send Us a Message</h2>
              <p className="text-xs text-slate-500 mb-6">
                Fill in the form below and our presales support engineers will get back to you within 30 minutes.
              </p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Thank you for reaching out, {formData.name}. Our presales team has received your message and will respond to{' '}
                    <strong>{formData.email}</strong> shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        subject: '',
                        department: 'Sales & Presales',
                        message: '',
                      });
                    }}
                    className="inline-block mt-2 text-xs font-semibold text-emerald-800 underline"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#1A4D80]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#1A4D80]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Subject <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Inquiry topic"
                        className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#1A4D80]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#1A4D80]"
                      >
                        <option value="Sales & Presales">Sales &amp; Presales</option>
                        <option value="Billing Department">Billing Department</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Enterprise / Dedicated PBX">Enterprise / Dedicated PBX</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please write your questions or details here..."
                      className="w-full p-2.5 border border-slate-300 rounded bg-white text-xs focus:outline-none focus:border-[#1A4D80]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center space-x-2 bg-[#1A4D80] hover:bg-[#143d66] text-white px-6 py-2.5 rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Details Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Company Information
              </h3>

              <div className="flex items-start space-x-3 text-slate-600">
                <MapPin className="w-4 h-4 text-[#1A4D80] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Corporate Address:</div>
                  <div>SoftCents Systems Ltd.</div>
                  <div>House #12, Road #04, Sector #03, Uttara</div>
                  <div>Dhaka-1230, Bangladesh</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-slate-600">
                <Phone className="w-4 h-4 text-[#1A4D80] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Support Hotline:</div>
                  <div>+880 1810-000000</div>
                  <div>+880 9610-000000</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-slate-600">
                <Mail className="w-4 h-4 text-[#1A4D80] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Direct Emails:</div>
                  <div>sales@softcents.com</div>
                  <div>support@softcents.com</div>
                  <div>billing@softcents.com</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-slate-600">
                <Clock className="w-4 h-4 text-[#1A4D80] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800">Working Hours:</div>
                  <div>Technical Support: 24/7/365</div>
                  <div>Billing &amp; Sales: Sat - Thu (10am - 8pm)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
