'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block mb-4">
          <img
            src="/whmcs/logo.png"
            alt="SoftCents Systems"
            className="h-10 w-auto mx-auto object-contain"
          />
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email address below and we will send you a password reset link.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                Password Reset Email Sent
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an account exists for <strong>{email}</strong>, you will receive an email instructions with a secure link to reset your password within the next 2 minutes.
              </p>
              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#1A4D80] hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#1A4D80]"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1A4D80] hover:bg-[#143d66] text-white py-2.5 px-4 rounded text-xs font-bold shadow-xs transition-colors"
              >
                {submitting ? 'Sending Link...' : 'Send Password Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-slate-500 hover:text-[#1A4D80] inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Remember password? Sign in</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
