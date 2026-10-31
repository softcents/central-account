'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RegistrationGuardProps {
  children: React.ReactNode;
}

export function RegistrationGuard({ children }: RegistrationGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isPublicOrExcluded =
    !pathname ||
    pathname.startsWith('/admin') ||
    pathname === '/customer-registration' ||
    pathname === '/verify-email' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/verify-email-change' ||
    pathname === '/';

  const requiresRegistration =
    !isLoading &&
    user &&
    user.emailVerified &&
    user.customerRegistrationCompleted === false;

  useEffect(() => {
    if (requiresRegistration && !isPublicOrExcluded) {
      router.replace('/customer-registration');
    }
  }, [requiresRegistration, isPublicOrExcluded, router]);

  if (requiresRegistration && !isPublicOrExcluded) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/80 border border-amber-500/30 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Customer Registration Required
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Your email is verified, but you must provide your mandatory KYC & personal details
            before accessing Central Account platform services.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link
              href="/customer-registration"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>Complete KYC & Customer Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
