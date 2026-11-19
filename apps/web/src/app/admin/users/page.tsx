'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/clients');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to WHMCS Clients...
    </div>
  );
}
