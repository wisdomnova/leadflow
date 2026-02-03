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
  TrendingUp, 
  Users, 
  DollarSign, 
  Gift, 
  ChevronRight, 
  ExternalLink,
  Award,
  Zap,
  Target,
  ArrowUpRight,
  Search,
  Filter,
  X,
  CreditCard,
  History,
  Info,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';

const affiliateStats = [
  { name: 'Total Referrals', key: 'activeReferrals', icon: Users },
  { name: 'Monthly Discount', key: 'currentDiscount', suffix: '%', icon: Zap },
  { name: 'Referrals to Next', key: 'referralsToNext', icon: Target },
  { name: 'Current Tier', key: 'currentTierName', icon: Award },
];

export default function AffiliatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [showReferralDetails, setShowReferralDetails] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  
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

  const referrals = stats?.referrals || [];
  const filteredReferrals = referrals.filter((ref: any) => {
    const matchesSearch = ref.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         ref.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ref.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setShowNotification(true);
    setTimeout(() => {
      setCopied(false);
      setShowNotification(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#745DF3]" />
      </div>
    );
  }

  if (stats?.eligible === false) {
    return (
      <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto space-y-8">
             <div className="w-24 h-24 bg-[#745DF3]/10 rounded-[2.5rem] flex items-center justify-center text-[#745DF3]">
               <Zap className="w-12 h-12" />
             </div>
             <div>
               <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tight">Referral Program is Gated</h1>
               <p className="text-gray-500 font-medium leading-relaxed">
                 {stats.message || "This feature is only available for Pro and Enterprise customers. Start referring others to get up to 100% off your monthly bill."}
               </p>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 w-full">
               <button 
                 onClick={() => router.push('/dashboard/billing')}
                 className="flex-1 py-4 bg-[#745DF3] text-white rounded-2xl font-black hover:bg-[#745DF3]/90 shadow-xl shadow-[#745DF3]/10 transition-all"
               >
                 Upgrade to Pro
               </button>
               <button 
                onClick={() => window.open('https://tryleadflow.ai/')}
                className="flex-1 py-4 bg-white border border-gray-100 text-[#101828] rounded-2xl font-black hover:bg-gray-50 transition-all"
               >
                 Learn More
               </button>
             </div>
          </div>
        </main>
      </div>
    );
  }

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${stats?.affiliateCode}`;

  return (
    <div className="flex min-h-screen bg-[#FBFBFB] font-jakarta">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-10">
            {/* Page Title & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-[#101828] tracking-tight">Referral Program</h1>
                <p className="text-gray-500 font-medium mt-1">Scale your discounts and get LeadFlow for free by referring others.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsTermsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-[#101828] hover:bg-gray-50 transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 text-[#745DF3]" />
                  How it works
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
              {showNotification && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-24 right-8 z-[100] px-6 py-4 bg-[#101828] text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold tracking-tight">Copied to clipboard!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Referral Link Section */}
            <div className="bg-[#101828] rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Share2 className="w-64 h-64 text-white" />
              </div>
              
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl font-black mb-4 tracking-tight text-white">Your Referral Assets</h2>
                <p className="text-white font-medium mb-8 opacity-70">Share your link. When people join, your monthly subscription fee drops. Hit the Platinum tier for a 100% free account.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 group/item hover:border-white/20 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Your Referral Link</p>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold truncate text-white">{referralLink}</p>
                      <button 
                        onClick={() => copyToClipboard(referralLink)}
                        className="p-2.5 bg-white text-[#101828] rounded-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 group/item hover:border-white/20 transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">Quick Share</p>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join LeadFlow and scale your outbound! ${referralLink}`)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                       >
                         Post to X
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {affiliateStats.map((stat, i) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-[#745DF3]/20 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] group-hover:bg-[#745DF3] group-hover:text-white transition-all duration-300">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1.5">{stat.name}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-black text-[#101828] tracking-tighter">
                          {stats?.stats?.[stat.key] ?? (stat.key === 'currentTierName' ? 'Bronze' : 0)}{stat.suffix || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Subscription Discount Tiers */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {[
                { name: 'Bronze', referrals: '1', discount: '20%', color: 'bg-orange-400', icon: Target },
                { name: 'Silver', referrals: '3', discount: '50%', color: 'bg-slate-400', icon: Award },
                { name: 'Gold', referrals: '10', discount: '80%', color: 'bg-amber-400', icon: Gift },
                { name: 'Platinum', referrals: '25', discount: '100%', color: 'bg-[#745DF3]', icon: Zap },
              ].map((tier, i) => {
                const isCurrent = stats?.stats?.currentTierName === tier.name;
                return (
                  <div 
                    key={tier.name}
                    className={`bg-white rounded-3xl p-6 border ${isCurrent ? 'border-[#745DF3] ring-1 ring-[#745DF3]' : 'border-gray-100'} relative overflow-hidden`}
                  >
                    {isCurrent && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-[#745DF3] rounded text-[8px] font-black text-white uppercase tracking-widest">
                        Active Tier
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-lg ${tier.color} flex items-center justify-center text-white mb-4 shadow-lg shadow-gray-200`}>
                      <tier.icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-black text-[#101828] uppercase tracking-wider mb-1">{tier.name || 'Unknown'}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mb-4">{tier.referrals} Referrals</p>
                    <div className="text-3xl font-black text-[#101828] tracking-tighter">{tier.discount} Off</div>
                  </div>
                );
              })}
            </div>

            {/* Referrals Directory */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-black text-[#101828] tracking-tight">Recent Referrals</h3>
                  <p className="text-gray-500 text-sm font-medium">Detailed breakdown of your network's activity.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search referrals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-[#745DF3]/20 transition-all"
                    />
                  </div>
                  <div className="relative group/filter">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-[#101828] focus:ring-2 focus:ring-[#745DF3]/20 transition-all cursor-pointer"
                    >
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Churned">Churned</option>
                    </select>
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">User</th>
                      <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                      <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                      <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Discount Impact</th>
                      <th className="px-8 py-5 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-5 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredReferrals.length > 0 ? (
                      filteredReferrals.map((ref: any) => (
                        <tr 
                          key={ref.id} 
                          onClick={() => {
                            setSelectedReferral(ref);
                            setShowReferralDetails(true);
                          }}
                          className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50/50 last:border-0 cursor-pointer"
                        >
                          <td className="px-8 py-6">
                            <div>
                              <p className="text-sm font-black text-[#101828]">{ref.name}</p>
                              <p className="text-[11px] font-bold text-gray-400">{ref.email}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-bold text-[#101828]">{ref.plan}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-medium text-gray-500">{ref.date}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-emerald-600">{ref.commission}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                              ref.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                              ref.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                              'bg-red-50 text-red-600'
                            }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center max-w-xs mx-auto"
                          >
                            <div className="w-16 h-16 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6">
                              <Users className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-black text-[#101828] mb-2  uppercase tracking-tight">No referrals found</h3>
                            <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
                              {searchQuery || statusFilter !== 'All' 
                                ? "No referrals match your current search or status filters."
                                : "When you refer others using your unique link, they'll appear here."}
                            </p>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Program Terms Modal */}
      <AnimatePresence>
        {isTermsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsModalOpen(false)}
              className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-4 z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/10 flex items-center justify-center text-[#745DF3]">
                      <ExternalLink className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[#101828] tracking-tight">Program Terms</h2>
                      <p className="text-gray-500 font-medium">Updated Jan 2026</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsTermsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6 text-[#101828]">
                  <section>
                    <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#745DF3] rounded-full" />
                      Subscription Discounts
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-600">
                      Instead of monetary payouts, LeadFlow uses a <span className="font-black">Tiered Discount System</span>. Each active referral lowers your monthly bill. Reach 25 active referrals to get a <span className="font-black">100% Free Lifetime Account</span>.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#745DF3] rounded-full" />
                      How it Works
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-600">
                      Discounts are applied automatically to your next billing cycle. If a referral cancels, your discount level may adjust down to the previous tier. 
                    </p>
                  </section>
                  <section>
                    <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#745DF3] rounded-full" />
                      Cookie Duration
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-600">
                      Our tracking cookies last for <span className="font-black">60 days</span>. This means if a user clicks your link and signs up within 60 days, you get the credit.
                    </p>
                  </section>
                  <section>
                    <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-[#745DF3] rounded-full" />
                      Restrictions
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'No keyword bidding on "LeadFlow" or related brand terms.',
                        'No coupon/deal site submissions without prior approval.',
                        'Self-referrals (buying through your own link) are strictly prohibited.',
                        'No spamming or unsolicited cold outreach using the LeadFlow brand.'
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#745DF3] mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <button 
                  onClick={() => setIsTermsModalOpen(false)}
                  className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all shadow-xl"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Referral Detail Panel */}
      <AnimatePresence>
        {showReferralDetails && selectedReferral && (
          <div className="fixed inset-0 z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReferralDetails(false)}
              className="absolute inset-0 bg-[#101828]/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xl font-black text-[#101828]">Referral Details</h2>
                <button 
                  onClick={() => setShowReferralDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-[#745DF3]/5 flex items-center justify-center text-[#745DF3] mb-4">
                    <Users className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-[#101828] tracking-tight">{selectedReferral.name}</h3>
                  <p className="text-gray-500 font-bold">{selectedReferral.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Weekly Active</p>
                    <p className="text-xl font-black text-[#101828]">Yes</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">LTV</p>
                    <p className="text-xl font-black text-emerald-600">$580.00</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Current Plan', value: selectedReferral.plan, icon: Target },
                    { label: 'Referral Date', value: selectedReferral.date, icon: Clock },
                    { label: 'Commission Tier', value: 'Silver (20%)', icon: Award },
                    { label: 'Next Renewal', value: 'Feb 12, 2026', icon: History }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] group hover:border-[#745DF3]/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#745DF3]/10 group-hover:text-[#745DF3] transition-colors">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                          <p className="text-sm font-bold text-[#101828]">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 space-y-3">
                  <button className="w-full py-4 bg-[#745DF3] text-white rounded-2xl text-sm font-black hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/10 flex items-center justify-center gap-2">
                    Message User
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all">
                    View Internal CRM Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
