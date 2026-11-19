'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminUserDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  useEffect(() => {
    if (userId) {
      router.replace(`/admin/clients/${userId}`);
    }
  }, [userId, router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to WHMCS Client Summary...
    </div>
  );
}
