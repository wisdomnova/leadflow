'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'active' | 'past_due' | 'trialing' | 'inactive'>('loading');
  const router = useRouter();

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/billing/subscription');
        const data = await res.json();
        // 'canceling' users still have access until end of billing period
        // 'past_due' users get a grace period while Stripe retries payment
        if (data.status === 'active' || data.status === 'trialing' || data.status === 'canceling') {
          setStatus('active');
        } else if (data.status === 'past_due') {
          setStatus('past_due');
        } else {
          setStatus('inactive');
        }
      } catch (err) {
        setStatus('inactive');
      }
    }
    check();
  }, []);

  if (status === 'loading') {
    return null; // or a skeleton
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500">
          <Lock className="w-8 h-8" />
        </div>
        <div className="max-w-md">
          <h3 className="text-2xl font-black text-[#101828] mb-2 tracking-tight">Subscription Required</h3>
          <p className="text-gray-500 font-medium">To access this feature, you need an active subscription. Refer friends to get up to 100% off!</p>
        </div>
        <Link 
          href="/dashboard/billing"
          className="px-8 py-3.5 bg-[#101828] text-white rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10"
        >
          View Plans & Pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {status === 'past_due' && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-red-900">Payment Failed</h4>
              <p className="text-xs text-red-600 font-medium mt-0.5">Your last payment was declined. Please update your payment method to avoid losing access.</p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shrink-0 flex items-center gap-1.5"
          >
            Update Payment
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      {children}
    </>
  );
}
