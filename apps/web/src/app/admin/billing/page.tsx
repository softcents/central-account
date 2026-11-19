'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBillingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/invoices');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to WHMCS Invoices...
    </div>
  );
}
