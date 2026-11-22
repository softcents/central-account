'use client';

import React from 'react';
import Link from 'next/link';

export function WhmcsFooter() {
  return (
    <footer id="footer" className="bg-[#f8f9fa] border-t border-slate-200 py-8 text-xs text-slate-600 mt-12">
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Navigation Links */}
          <ul className="flex items-center space-x-6">
            <li>
              <Link href="/contact" className="hover:text-[#1A4D80] hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/announcements" className="hover:text-[#1A4D80] hover:underline">
                Announcements
              </Link>
            </li>
            <li>
              <Link href="/knowledgebase" className="hover:text-[#1A4D80] hover:underline">
                Knowledgebase
              </Link>
            </li>
            <li>
              <Link href="/networkissues" className="hover:text-[#1A4D80] hover:underline">
                Network Status
              </Link>
            </li>
          </ul>

          {/* Language & Currency Pill */}
          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 shadow-2xs font-medium cursor-default">
              <span>🇺🇸</span>
              <span>English / BDT</span>
            </span>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 text-center text-slate-400 text-[11px]">
          Copyright &copy; {new Date().getFullYear()} SoftCents Systems. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
