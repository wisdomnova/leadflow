'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
  CreditCard, 
  Check, 
  Plus, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Crown, 
  FileText, 
  Download,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Mail,
  Users,
  Loader2,
  X,
  CreditCard as CardIcon
} from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: '$39', annual: '$468' },
    description: 'Perfect for individual founders and solo sales reps.',
    features: ['10,000 Monthly Emails', 'Unlimited Sending Domains', 'Warm-up & Unibox', 'Full CRM Access', 'AI Personalization (Limited)', 'Basic Analytics'],
    button: 'Switch to Starter',
    current: false,
    color: 'gray'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: '$99', annual: '$1,188' },
    description: 'Best for growing teams and scaling outbound efforts.',
    features: ['100,000 Monthly Emails', 'PowerSend Unlocked (Add-on)', 'Unlimited AI Personalization', 'Team Dashboard', 'Advanced Analytics', 'Priority Support'],
    button: 'Switch to Pro',
    current: false,
    color: 'purple'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: '$319', annual: '$3,828' },
    description: 'For large agencies and enterprise sales organizations.',
    features: ['500,000 Monthly Emails', '1 PowerSend Node Included', 'Custom API Access', 'SSO & Advanced Security', 'White-labeling', 'Dedicated Account Manager'],
    button: 'Switch to Enterprise',
    current: false,
    color: 'black'
  }
];

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isSwitchingPlan, setIsSwitchingPlan] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isManagingPlan, setIsManagingPlan] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      const data = await res.json();
      setSubData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setIsManagingPlan(true);
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err: any) {
      setNotificationMsg(err.message || 'Error opening portal');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setIsManagingPlan(false);
    }
  };

  const handlePlanSwitch = async (planId: string) => {
    setIsSwitchingPlan(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle })
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err: any) {
      setNotificationMsg(err.message || 'Error redirecting to checkout');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      setIsSwitchingPlan(null);
    }
  };

  const handleDownloadInvoice = (id: string) => {
    setNotificationMsg(`Downloading invoice ${id}...`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleCancelSubscription = () => {
    setIsCanceling(true); 
    setTimeout(() => {
      setIsCanceling(false);
      setIsCancelModalOpen(false);
      setNotificationMsg('Subscription cancellation request sent.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#745DF3]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Page Title & Notification */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Billing & Plans</h1>
                <p className="text-gray-500 font-medium mt-1">Manage your subscription, payment methods, and billing history.</p>
              </div>

              <AnimatePresence>
                {showNotification && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-[#101828] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Check className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold tracking-tight text-white">{notificationMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current Plan Overview */}
            <div className="bg-[#101828] rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Crown className="w-64 h-64 text-white" />
              </div>
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-3 py-1 ${subData?.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'} rounded-lg text-[10px] font-black uppercase tracking-widest`}>
                      {(subData?.trial_ends_at && new Date(subData.trial_ends_at) > new Date()) ? 'Free Trial' : (subData?.status || 'No Active Plan')}
                    </span>
                    {subData?.discount > 0 && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {subData.discount}% Affiliate Discount Applied
                      </span>
                    )}
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                    {subData?.subscription?.plan || (subData?.trial_ends_at && new Date(subData.trial_ends_at) > new Date() ? 'Starter (14-Day Trial)' : (subData?.plan_tier ? `${subData.plan_tier.charAt(0).toUpperCase() + subData.plan_tier.slice(1)} Plan` : 'Standard Plan'))}
                  </h2>
                  <p className="text-white font-medium mb-8 opacity-70">
                    {subData?.status === 'active' && subData?.subscription?.current_period_end
                      ? `Your subscription is active. Next billing date: ${new Date(subData.subscription.current_period_end * 1000).toLocaleDateString()}`
                      : (subData?.trial_ends_at && new Date(subData.trial_ends_at) > new Date()
                        ? `Your free trial ends on ${new Date(subData.trial_ends_at).toLocaleDateString()}. Upgrade to a paid plan to keep access.`
                        : 'You do not have an active subscription yet.')
                    }
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handleOpenPortal}
                      disabled={isManagingPlan}
                      className="px-8 py-3.5 border-2 border-white/20 text-white rounded-2xl text-sm font-black hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      {isManagingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Subscription'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#745DF3]/20 flex items-center justify-center text-[#745DF3]">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Emails</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">Real-time <span className="text-xs text-white font-bold">Usage</span></p>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#745DF3] w-[40%]" />
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Status</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">{subData?.status === 'active' ? 'Active' : 'Inactive'}</p>
                    <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${subData?.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'} w-full`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Toggle */}
            <div className="flex justify-center">
              <div className="bg-white p-2 rounded-2xl border border-gray-100 flex items-center gap-1">
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${billingCycle === 'monthly' ? 'bg-[#745DF3] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${billingCycle === 'annual' ? 'bg-[#745DF3] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((p) => {
                // A plan is only "Current" if the user has an active Stripe subscription for it.
                // Trial users see their limits (Starter), but haven't "selected" a paid plan yet.
                const isCurrent = !!subData?.subscription && subData?.plan_tier === p.id;
                const buttonText = isCurrent ? 'Current Plan' : p.button;
                
                return (
                <div 
                  key={p.name}
                  className={`bg-white rounded-[2.5rem] p-10 border transition-all relative flex flex-col h-full ${
                    isCurrent ? 'border-[#745DF3] shadow-xl shadow-[#745DF3]/5 ring-1 ring-[#745DF3]' : 'border-gray-100'
                  }`}
                >
                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-[#101828] tracking-tight mb-2">{p.name}</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">{p.description}</p>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-[#101828] tracking-tighter">
                        {(() => {
                          const rawPrice = billingCycle === 'monthly' ? p.price.monthly : p.price.annual;
                          const basePrice = parseInt(rawPrice.replace(/[$,]/g, ''));
                          const discount = subData?.discount || 0;
                          const finalPrice = Math.floor(basePrice * (1 - discount / 100));
                          // Format with commas
                          return `$${finalPrice.toLocaleString()}`;
                        })()}
                      </span>
                      <span className="text-gray-400 font-bold">
                        {billingCycle === 'monthly' ? '/mo' : '/yr'}
                      </span>
                    </div>
                    {subData?.discount > 0 && (
                      <span className="text-[10px] font-bold text-[#745DF3] uppercase tracking-widest mt-1 block">
                        Inclusive of {subData.discount}% referral discount
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-4 mb-10">
                    {p.features.map(feature => (
                      <div key={feature} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-[#745DF3] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-gray-600 tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => handlePlanSwitch(p.id)}
                    disabled={isCurrent || isSwitchingPlan !== null}
                    className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                      isCurrent 
                        ? 'bg-[#101828] text-white opacity-50 cursor-default' 
                        : 'bg-[#745DF3] text-white hover:bg-[#745DF3]/90 shadow-xl shadow-[#745DF3]/10'
                    } ${isSwitchingPlan === p.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSwitchingPlan === p.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      buttonText
                    )}
                  </button>
                </div>
                );
              })}
            </div>

            {/* Payment & History Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Payment Methods */}
              <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-[#101828] tracking-tight">Payment Method</h3>
                  <button 
                    onClick={handleOpenPortal}
                    className="p-2 text-[#745DF3] hover:bg-[#745DF3]/5 rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {subData?.paymentMethod ? (
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-[#101828]" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#101828] uppercase tracking-tighter">
                          {subData.paymentMethod.brand} •••• {subData.paymentMethod.last4}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">Expires {subData.paymentMethod.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded">Default</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50/50 rounded-3xl p-10 border-2 border-dashed border-gray-100 flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <CreditCard className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 leading-relaxed">No payment method connected.</p>
                    <button 
                      onClick={handleOpenPortal}
                      className="mt-4 text-[10px] font-black text-[#745DF3] uppercase tracking-widest hover:underline"
                    >
                      + Add Card via Stripe
                    </button>
                  </div>
                )}
                
                <p className="text-[10px] font-bold text-gray-400 leading-relaxed text-center">
                  All transactions are secure and encrypted. Need help? 
                  <button className="text-[#745DF3] ml-1">Contact Support</button>
                </p>
              </div>

              {/* Billing History */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-50">
                  <h3 className="text-xl font-black text-[#101828] tracking-tight">Invoice History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Invoice</th>
                        <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {subData?.invoices?.length > 0 ? (
                        subData.invoices.map((inv: any) => (
                          <tr key={inv.id} className="border-b border-gray-50/50 last:border-0 hover:bg-gray-50/30 transition-colors group">
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-[#101828]">{inv.id}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-bold text-gray-500">{inv.date}</span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-[#101828]">{inv.amount}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className={`flex items-center gap-1.5 ${inv.status === 'Paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{inv.status}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              {inv.pdf && (
                                <button 
                                  onClick={() => window.open(inv.pdf)}
                                  className="p-2 text-gray-400 hover:text-[#745DF3] transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                <FileText className="w-6 h-6 text-gray-300" />
                              </div>
                              <p className="text-sm font-black text-[#101828]">No invoices yet</p>
                              <p className="text-xs font-bold text-gray-400 mt-1">Your billing history will appear here once your first payment is processed.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Subscription Modal */}
        <AnimatePresence>
          {isCancelModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
              >
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-2xl font-black text-[#101828] mb-2 leading-tight">Wait, don't leave yet!</h3>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                  Canceling your <span className="text-[#101828] font-bold">Growth Plan</span> will disable your automated outreach and Unibox AI features at the end of this billing cycle.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    className="w-full py-4 bg-[#101828] text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-gray-200"
                  >
                    Keep My Growth Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="w-full py-4 bg-white text-red-600 border-2 border-red-50 text-sm font-black rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isCanceling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancellation"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
