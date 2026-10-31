'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LifeBuoy,
  ArrowLeft,
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Building,
  HelpCircle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NewSupportTicketPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();

  const [category, setCategory] = useState<string>('GENERAL_SUPPORT');
  const [priority, setPriority] = useState<string>('NORMAL');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachments, setAttachments] = useState<Array<{ fileName: string; fileBase64: string; mimeType: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a description');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<any>(
        '/support/tickets',
        {
          method: 'POST',
          body: JSON.stringify({
            category,
            priority,
            subject: subject.trim(),
            description: description.trim(),
            attachments: attachments.length > 0 ? attachments : undefined,
          }),
        },
        accessToken,
      );

      if (res.ok && res.data?.id) {
        router.push(`/support/${res.data.id}`);
      } else {
        setError(res.data?.message || 'Failed to create support ticket');
      }
    } catch {
      setError('An unexpected error occurred while submitting ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading form...</div>;
  }

  const categoryOptions = [
    {
      id: 'GENERAL_SUPPORT',
      name: 'General Support',
      desc: 'Inquiries, portal questions, and technical help',
      icon: <HelpCircle className="w-5 h-5 text-slate-400" />,
    },
    {
      id: 'IDENTITY_VERIFICATION',
      name: 'Identity Verification (KYC)',
      desc: 'Issues with personal ID document, OCR, or biometrics',
      icon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'BUSINESS_VERIFICATION',
      name: 'Business Entity (KYB)',
      desc: 'Corporate trade license or shareholder review assistance',
      icon: <Building className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'ACCOUNT_SECURITY',
      name: 'Account & Security',
      desc: 'MFA issues, device access, or security lockouts',
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'EMAIL_CHANGE',
      name: 'Email Change',
      desc: 'Requesting to update primary account email (requires KYC Level 2+)',
      icon: <Mail className="w-5 h-5 text-violet-400" />,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
      {/* Back button */}
      <Link
        href="/support"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tickets</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <LifeBuoy className="w-7 h-7 text-indigo-400" />
          <span>Open a Support Ticket</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Our compliance and support engineering team responds within 24 hours.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Ticket Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => setCategory(opt.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  category === opt.id
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {opt.icon}
                  <div>
                    <h4 className="text-xs font-bold text-white">{opt.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Subject
            </label>
            <input
              type="text"
              placeholder="Brief summary of your inquiry..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none cursor-pointer"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Detailed Description
          </label>
          <textarea
            rows={5}
            placeholder="Please describe your issue, steps taken, or specific request in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-xs text-white outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Attachment Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Attachments (Optional)
          </label>
          <div className="border border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-5 text-center bg-slate-950/40 relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Upload file"
            />
            <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
            <p className="text-xs text-slate-300 font-medium">Click or drag files here to attach</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Images, PDFs, or documents up to 10MB each</p>
          </div>

          {/* Uploaded attachments list */}
          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-2">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate">{att.fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-end space-x-3">
          <Link
            href="/support"
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
