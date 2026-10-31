'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Rocket,
  Building2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgFromUrl = searchParams.get('org'); // pre-selected org ID from create flow

  const { token } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [userTenants, setUserTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(orgFromUrl || '');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [subscribingCode, setSubscribingCode] = useState<string | null>(null);
  const [activatedOrg, setActivatedOrg] = useState<{ name: string; planName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, tenantsRes] = await Promise.all([
        apiFetch<any>('/billing/plans', {}),
        apiFetch<any>('/tenants', {}, token),
      ]);

      if (plansRes.ok) {
        setPlans(plansRes.data || []);
      }
      if (tenantsRes.ok) {
        const tenants = tenantsRes.data || [];
        setUserTenants(tenants);
        // If org came from URL, use it; otherwise fall back to first
        if (orgFromUrl) {
          setSelectedTenantId(orgFromUrl);
        } else if (tenants.length > 0 && !selectedTenantId) {
          setSelectedTenantId(tenants[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load subscription plans', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleSubscribe = async (planCode: string, startTrial = false) => {
    if (!selectedTenantId) {
      setErrorMsg('Please select or create an organization first.');
      return;
    }

    setSubscribingCode(planCode);
    setErrorMsg(null);
    setActivatedOrg(null);

    try {
      const res = await apiFetch<any>(
        '/billing/subscribe',
        {
          method: 'POST',
          body: JSON.stringify({
            tenantId: selectedTenantId,
            planCode,
            billingCycle,
            startTrial,
          }),
        },
        token,
      );

      if (res.ok) {
        const orgName = userTenants.find((t) => t.id === selectedTenantId)?.name || 'Your Organization';
        const planObj = plans.find((p) => p.code === planCode);
        const trialSuffix = startTrial ? ' (14-day trial)' : '';
        setActivatedOrg({
          name: orgName,
          planName: (planObj?.name || planCode) + trialSuffix,
        });
        fetchData();
      } else {
        throw new Error(res.data?.message || 'Subscription failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error subscribing to plan');
    } finally {
      setSubscribingCode(null);
    }
  };

  const selectedTenant = userTenants.find((t) => t.id === selectedTenantId);
  const currentPlanCode = selectedTenant?.subscriptions?.[0]?.plan?.code || null;
  const isPendingActivation = selectedTenant?.status === 'SUSPENDED';

  // ── Activation Success Screen ──
  if (activatedOrg) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Rocket className="w-9 h-9 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              🎉 Organization Activated!
            </h2>
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">{activatedOrg.name}</span> is now live
              on the <span className="text-violet-400 font-semibold">{activatedOrg.planName}</span> plan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>What&apos;s unlocked</span>
            </div>
            <div className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>Run KYC identity verifications</span></div>
            <div className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>Register businesses for KYB compliance</span></div>
            <div className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>Invite team members to your workspace</span></div>
            <div className="flex items-center space-x-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /><span>Generate API keys for backend integration</span></div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/organizations"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm text-center shadow-lg shadow-indigo-600/25 transition-all inline-flex items-center justify-center space-x-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Go to My Organizations</span>
            </Link>
            <Link
              href="/identity"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm text-center transition-all inline-flex items-center justify-center space-x-2"
            >
              <span>Start KYC Verification</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10">
      {/* Pending Activation Notice */}
      {isPendingActivation && (
        <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start space-x-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-300">
              {selectedTenant?.name} is awaiting activation
            </div>
            <div className="text-xs text-amber-400/80 mt-0.5">
              Select a plan below to activate your organization. You can always upgrade later.
            </div>
          </div>
        </div>
      )}

      {/* Title & Organization Selector */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Flexible SaaS Subscription Tiers</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          {isPendingActivation ? 'Activate Your Organization' : 'Scale Your Identity Infrastructure'}
        </h1>
        <p className="text-sm text-slate-400">
          Transparent pricing for automated KYC, corporate KYB verification, and global SSO identity.
        </p>

        {userTenants.length > 0 && (
          <div className="pt-2 flex items-center justify-center space-x-2 text-xs text-slate-300">
            <span>Applying plan to:</span>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500/60"
            >
              {userTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.status === 'SUSPENDED' ? ' ⚠️ (Pending Activation)' : ` (${t.subscriptions?.[0]?.plan?.name || 'Free'})`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Monthly / Yearly Toggle */}
        <div className="pt-4 flex items-center justify-center space-x-3">
          <span className={`text-xs font-semibold ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-slate-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
            className="w-12 h-6 rounded-full bg-slate-800 p-0.5 relative transition-colors focus:outline-none"
          >
            <div
              className={`w-5 h-5 rounded-full bg-indigo-500 transition-transform ${
                billingCycle === 'YEARLY' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-semibold flex items-center space-x-1.5 ${billingCycle === 'YEARLY' ? 'text-white' : 'text-slate-400'}`}>
            <span>Annual</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading subscription tiers...
          </div>
        ) : (
          plans.map((p) => {
            const isCurrent = currentPlanCode === p.code && !isPendingActivation;
            const price = billingCycle === 'YEARLY' ? p.price_yearly : p.price_monthly;
            const isFeatured = p.code === 'BUSINESS';

            return (
              <div
                key={p.id}
                className={`p-6 rounded-2xl flex flex-col justify-between transition-all relative ${
                  isFeatured
                    ? 'bg-slate-900 border-2 border-indigo-500/60 shadow-xl shadow-indigo-600/15'
                    : 'bg-slate-900/60 border border-slate-800'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="font-bold text-base text-white">{p.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 min-h-[32px]">{p.description}</div>

                  <div className="mt-4 pb-4 border-b border-slate-800">
                    <span className="text-3xl font-extrabold text-white">${price}</span>
                    <span className="text-xs text-slate-500">/{billingCycle === 'YEARLY' ? 'yr' : 'mo'}</span>
                  </div>

                  {/* Quotas */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">KYC/mo:</span>
                      <span className="font-semibold text-white">{p.max_kyc_monthly}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">KYB/mo:</span>
                      <span className="font-semibold text-white">{p.max_kyb_monthly}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">API Calls:</span>
                      <span className="font-semibold text-white">
                        {p.max_api_calls_monthly >= 1000000
                          ? `${(p.max_api_calls_monthly / 1000000).toFixed(0)}M`
                          : `${(p.max_api_calls_monthly / 1000).toFixed(0)}K`}
                      </span>
                    </div>
                  </div>

                  {/* Feature list */}
                  {p.features?.length > 0 && (
                    <div className="mt-5 space-y-2 pt-4 border-t border-slate-800">
                      {p.features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold text-center">
                      Current Plan
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSubscribe(p.code, false)}
                        disabled={subscribingCode === p.code}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                          isFeatured
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        {subscribingCode === p.code
                          ? 'Activating...'
                          : isPendingActivation
                          ? `Activate with ${p.name}`
                          : 'Subscribe'}
                      </button>

                      {p.code !== 'FREE' && (
                        <button
                          onClick={() => handleSubscribe(p.code, true)}
                          disabled={subscribingCode === p.code}
                          className="w-full py-1.5 rounded-lg text-[11px] text-indigo-400 hover:text-indigo-300 font-medium text-center transition-colors"
                        >
                          Start 14-Day Free Trial
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Loading plans...
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}
