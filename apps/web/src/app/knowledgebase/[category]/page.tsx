'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, FileText, ArrowLeft, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';

export default function KnowledgebaseArticleOrCategory() {
  const params = useParams();
  const slug = params?.category as string;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            /{' '}
            <Link href="/knowledgebase" className="text-[#1A4D80] hover:underline">
              Knowledgebase
            </Link>{' '}
            / {slug || 'Tutorial'}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#1A4D80]" />
            How to Generate and Download a Full Backup of Your cPanel Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Category: Backup/Restore • Last Updated: 20th November 2026
          </p>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8">
        <article className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
          <div className="prose max-w-none text-[13.5px] text-slate-700 leading-relaxed space-y-4">
            <p>
              Taking regular backups of your cPanel web hosting account is the best security practice to safeguard your website files, MySQL databases, and email accounts.
            </p>

            <h3 className="text-base font-bold text-slate-900">Step 1: Log in to Your cPanel</h3>
            <p>
              Log into your SoftCents Client Area, navigate to <strong>Services &gt; My Services</strong>, click on your active hosting package, and choose <strong>Log in to cPanel</strong>.
            </p>

            <h3 className="text-base font-bold text-slate-900">Step 2: Navigate to Backup Wizard</h3>
            <p>
              Under the <strong>Files</strong> section, locate and click on <strong>Backup Wizard</strong> or <strong>Backup</strong>.
            </p>

            <h3 className="text-base font-bold text-slate-900">Step 3: Download Full Account Backup</h3>
            <p>
              Click on <strong>Download a Full Website Backup</strong>. Select <strong>Home Directory</strong> as the backup destination and enter your email address to receive a notification once the backup archive generation is finished.
            </p>

            <h3 className="text-base font-bold text-slate-900">Step 4: Save Archive to Your Computer</h3>
            <p>
              Once completed, click the generated <code>backup-date-username.tar.gz</code> link under &quot;Backups Available for Download&quot; to download the file directly to your local computer.
            </p>
          </div>

          {/* Feedback section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="font-semibold text-slate-700">
              Did you find this article helpful?
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => alert('Thank you for your feedback!')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-emerald-600 font-semibold shadow-2xs"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Thank you for your feedback! We will improve this article.')}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-100 text-rose-600 font-semibold shadow-2xs"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>No</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Link
              href="/knowledgebase"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1A4D80] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Knowledgebase</span>
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
