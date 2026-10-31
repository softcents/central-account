'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Hide consumer footer inside admin portal
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4">
        &copy; {new Date().getFullYear()} Central Account Platform. Centralized Identity and Verification.
      </div>
    </footer>
  );
}
