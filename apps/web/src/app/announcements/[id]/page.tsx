'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Megaphone, Calendar, Share2, Twitter, Facebook, ArrowLeft } from 'lucide-react';

export default function SingleAnnouncementPage() {
  const params = useParams();
  const id = params?.id;

  const announcement = {
    id: id || 1,
    title: 'Same IP Number Voice SMS এখন চালু',
    date: '16th November 2025',
    content: `
      আমরা অত্যন্ত আনন্দের সাথে জানাচ্ছি যে আমাদের প্ল্যাটফর্মে Same IP Number Voice SMS ফিচারটি এখন সফলভাবে সক্রিয় করা হয়েছে।
      
      এখন থেকে গ্রাহকরা তাদের নির্ধারিত নির্দিষ্ট আইপি ব্যবহার করে নিরাপদে এবং নিরবচ্ছিন্নভাবে ভয়েস এসএমএস ক্যাম্পেইন পরিচালনা করতে পারবেন। 
      
      মূল সুবিধাগুলো:
      1. ডেডিকেটেড আইপি থেকে সরাসরি কল রাউটিং।
      2. উচ্চ কনকারেন্সি এবং ক্রিস্টাল ক্লিয়ার অডিও ট্রাফিকের নিশ্চয়তা।
      3. রিয়েল-টাইম ডায়ালিং অ্যানালিটিক্স এবং ডেলিভারি স্ট্যাটাস রিপোর্ট।
      4. স্বয়ংক্রিয় পেমেন্ট সেটেলমেন্ট এবং তাৎক্ষণিক ব্যালেন্স রিচার্জ।

      যেকোনো প্রযুক্তিগত সহায়তার জন্য আমাদের সাপোর্ট টিকিট ওপেন করুন অথবা হটলাইনে যোগাযোগ করুন। ধন্যবাদ!
    `,
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-800">
      <div className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="text-xs text-slate-500 mb-1">
            <Link href="/" className="text-[#1A4D80] hover:underline">
              Portal Home
            </Link>{' '}
            /{' '}
            <Link href="/announcements" className="text-[#1A4D80] hover:underline">
              Announcements
            </Link>{' '}
            / View Announcement
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#1A4D80]" />
            {announcement.title}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Published on {announcement.date}</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 py-8">
        <article className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="prose max-w-none text-[14px] text-slate-700 leading-relaxed whitespace-pre-line mb-8">
            {announcement.content}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200">
            <Link
              href="/announcements"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1A4D80] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Announcements</span>
            </Link>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share:</span>
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(announcement.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-sky-500 hover:bg-sky-50 rounded transition-colors"
                title="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://account.softcents.com/announcements')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
