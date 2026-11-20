'use client';

import React from 'react';
import Link from 'next/link';
import { ClientHeader } from '@/components/ClientHeader';
import { Megaphone, Calendar, Share2, Twitter, Facebook, ArrowRight } from 'lucide-react';

export default function AnnouncementsPage() {
  const announcements = [
    {
      id: 1,
      title: 'Same IP Number Voice SMS এখন চালু',
      date: '16th November 2025',
      summary:
        'আমরা অত্যন্ত আনন্দের সাথে জানাচ্ছি যে আমাদের প্ল্যাটফর্মে Same IP Number Voice SMS ফিচারটি এখন সফলভাবে সক্রিয় করা হয়েছে। এখন থেকে গ্রাহকরা তাদের নির্ধারিত নির্দিষ্ট আইপি ব্যবহার করে নিরাপদে এবং নিরবচ্ছিন্নভাবে ভয়েস এসএমএস ক্যাম্পেইন পরিচালনা করতে পারবেন। যেকোনো প্রযুক্তিগত সহায়তার জন্য আমাদের সাপোর্ট টিকিট ওপেন করুন।',
    },
    {
      id: 2,
      title: 'Scheduled Cloud PBX Infrastructure Upgrades',
      date: '10th November 2025',
      summary:
        'To ensure higher call concurrency, crystal-clear audio quality, and zero-downtime redundancy, our core Asterisk Cloud PBX infrastructure will undergo a scheduled network enhancement. No interruption to active SIP trunks is anticipated.',
    },
    {
      id: 3,
      title: 'PipraPay Automated Payment Gateway Integration',
      date: '1st November 2025',
      summary:
        'Instant automated invoice settlement is now live via PipraPay. You can now pay all invoices and add wallet funds using bKash, Nagad, Rocket, and Upay with instant real-time account activation.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <ClientHeader />
      {/* Top Breadcrumb & Header */}
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            / Announcements
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#1A4D80]" />
            News & Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay informed with the latest updates, maintenance notices, and product releases from SoftCents Systems.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-[1240px] mx-auto px-4 py-8">
        <div className="space-y-6">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <Link
                  href={`/announcements/${item.id}`}
                  className="text-lg font-bold text-[#1A4D80] hover:underline"
                >
                  {item.title}
                </Link>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
              </div>

              <p className="text-[13px] text-slate-600 leading-relaxed mb-4">
                {item.summary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Link
                  href={`/announcements/${item.id}`}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-[#1A4D80] hover:text-[#143d66]"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share:</span>
                  </span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(`https://account.softcents.com/announcements/${item.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-sky-500 hover:bg-sky-50 rounded transition-colors"
                    title="Share on Twitter"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://account.softcents.com/announcements/${item.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
