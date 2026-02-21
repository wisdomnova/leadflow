'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Gift, 
  X,
  Info,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Percent,
  Link2,
  ArrowRight,
  XCircle
} from 'lucide-react';

export default function AffiliatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/affiliates/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = stats?.referralCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://tryleadflow.ai'}/signup?ref=${stats.referralCode}`
    : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#745DF3]" />
      </div>
    );
  }

  // Not eligible — gated screen
  if (stats?.eligible === false) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-8">
             <div className="w-24 h-24 bg-[#745DF3]/10 rounded-[2.5rem] flex items-center justify-center text-[#745DF3]">
               <Gift className="w-12 h-12" />
             </div>
             <div>
               <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tight">Referral Program</h1>
               <p className="text-gray-500 font-medium leading-relaxed">
                 {stats.message || "The Referral Program is available on Pro and Enterprise plans. Upgrade to start earning discounts."}
               </p>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 w-full">
               <button 
                 onClick={() => router.push('/dashboard/billing')}
                 className="flex-1 py-4 bg-[#745DF3] text-white rounded-2xl font-black hover:bg-[#745DF3]/90 shadow-xl shadow-[#745DF3]/10 transition-all"
               >
                 Upgrade Plan
               </button>
               <button 
                onClick={() => setShowLearnMore(true)}
                className="flex-1 py-4 bg-white border border-gray-200 text-[#101828] rounded-2xl font-black hover:bg-gray-50 transition-all"
               >
                 Learn More
               </button>
             </div>
          </div>
          <LearnMoreModal open={showLearnMore} onClose={() => setShowLearnMore(false)} />
        </main>
      </div>
    );
  }

  // Eligible — full dashboard
  const referrals = stats?.referrals || [];
  const totalCount = stats?.totalReferrals || 0;
  const rewardedCount = stats?.rewarded || 0;
  const pendingCount = stats?.pending || 0;
  const ownReward = stats?.myReferralStatus; // 'rewarded' | 'pending' | null

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Referral Program</h1>
                <p className="text-gray-500 font-medium mt-1">Invite others and you both get 20% off forever.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLearnMore(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <Info className="w-4 h-4 text-[#745DF3]" />
                  How it works
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Referrals" value={totalCount} />
              <StatCard icon={CheckCircle2} label="Rewarded" value={rewardedCount} color="emerald" />
              <StatCard icon={Clock} label="Pending" value={pendingCount} color="amber" />
              <StatCard icon={Percent} label="Your Discount" value={(ownReward === 'rewarded' ? 20 : 0).toString() + '%'} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              <div className="xl:col-span-2 space-y-8">
                {/* Referral Link Box */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#F4F2FF] rounded-2xl flex items-center justify-center text-[#745DF3]">
                      <Link2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#101828] tracking-tight">Your Referral Link</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Share this link to earn discounts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50/50 border border-gray-100/50 p-2 rounded-2xl mb-4">
                    <div className="flex-1 px-4 py-2 text-sm font-mono text-gray-600 truncate select-all">
                      {referralLink}
                    </div>
                    <button
                      onClick={() => copyToClipboard(referralLink)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#101828] text-white rounded-xl font-bold text-sm hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-[#101828]/10"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Unique Identifier: <span className="text-[#745DF3]">{stats?.referralCode || 'NOT_GENERATED'}</span>
                  </div>
                </div>

                {/* Referral List Table */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-8 pb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight">Your Referrals</h2>
                    <div className="px-3 py-1 bg-gray-50 rounded-lg">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Updates</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Advocate</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                          <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Reward</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {referrals.length > 0 ? (
                          referrals.map((ref: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#101828] group-hover:text-white transition-all shrink-0">
                                    <span className="text-sm font-black whitespace-nowrap">
                                      {(ref.name || ref.email || '?')[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#101828] text-sm truncate">{ref.name || 'Unknown'}</p>
                                    <p className="text-[10px] font-medium text-gray-400 truncate">{ref.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <StatusBadge status={ref.status} />
                              </td>
                              <td className="px-8 py-5 font-bold text-gray-500 text-sm">
                                {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : '---'}
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                  ref.status === 'rewarded' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
                                }`}>
                                  {ref.status === 'rewarded' ? '20% Applied' : 'Pending'}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                  <Users className="w-8 h-8" />
                                </div>
                                <div className="max-w-[240px]">
                                  <p className="text-sm font-black text-[#101828] mb-1">No Referrals Yet</p>
                                  <p className="text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-widest">Share your link to see your network grow here.</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Anti-Abuse Status */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-[#101828]">Program Status</h3>
                    <div className="px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group flex gap-4 p-4 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:border-[#745DF3]/20">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#101828] leading-tight">Fraud Protection</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Enabled & Monitoring</p>
                      </div>
                    </div>

                    <div className="group flex gap-4 p-4 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:border-[#745DF3]/20">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#101828] leading-tight">Reward Eligibility</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Verified Account</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push('/dashboard/settings')}
                    className="w-full mt-8 py-4 bg-[#745DF3]/5 text-[#745DF3] rounded-2xl text-xs font-black hover:bg-[#745DF3] hover:text-white transition-all flex items-center justify-center gap-2 group"
                  >
                    Account Settings
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
        <LearnMoreModal open={showLearnMore} onClose={() => setShowLearnMore(false)} />
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  const iconColorMap: Record<string, string> = {
    default: 'text-[#745DF3]',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#745DF3]/20 transition-all group"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] group-hover:bg-[#101828] group-hover:text-white transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] leading-none mb-1.5">{label}</h3>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-[#101828] tracking-tighter">{value}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'rewarded') {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
        Rewarded
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600">
        Rejected
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600">
      Pending
    </span>
  );
}

function LearnMoreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#745DF3]/10 rounded-xl flex items-center justify-center">
                    <Gift className="w-5 h-5 text-[#745DF3]" />
                  </div>
                  <h2 className="text-xl font-black text-[#101828] tracking-tight">How It Works</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-5">
                {[
                  { icon: Share2, title: "Share Your Link", desc: "Copy your unique referral link and share it with colleagues, friends, or your network." },
                  { icon: Users, title: "They Sign Up & Subscribe", desc: "When someone signs up using your link and becomes a paying customer on any plan, you both qualify." },
                  { icon: Percent, title: "Both Get 20% Off", desc: "Once they make their first payment, you both automatically receive 20% off all future invoices — forever." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#F4F2FF] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="w-5 h-5 text-[#745DF3]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#101828] mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-[#F9FAFB] rounded-2xl p-5">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Simple &amp; Fair</p>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  No tiers, no complicated math. Every successful referral earns both you and your friend a permanent 20% discount on your LeadFlow subscription.
                </p>
              </div>
            </div>
            <div className="p-8 pt-0">
              <button
                onClick={onClose}
                className="w-full py-4 bg-[#745DF3] text-white rounded-2xl font-black hover:bg-[#745DF3]/90 shadow-xl shadow-[#745DF3]/10 transition-all"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
