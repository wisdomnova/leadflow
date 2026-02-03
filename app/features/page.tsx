'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { motion } from 'framer-motion';
import { Check, Sparkles, Send, Inbox, Shield, Database, Zap, ArrowRight, Lock } from 'lucide-react';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-24 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-xs font-bold text-[#745DF3] mb-8 uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#745DF3]" />
              <span>Features Overview</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-[#101828] mb-8 tracking-tighter leading-[1.05] uppercase">
              Built for <span className="text-[#745DF3]">Performance.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
              Every detail of LeadFlow is engineered to maximize your delivery rates and minimize manual effort. High-performance infrastructure for high-performing teams.
            </p>
          </div>

          {/* Features Illustration Grid */}
          <div className="space-y-8">
            {/* Row 1: Warmup & Domain Rotation */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-6 bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-12 shadow-sm flex flex-col min-h-[550px]"
              >
                <div className="mb-12">
                  <div className="w-12 h-12 bg-[#745DF3]/5 rounded-xl flex items-center justify-center text-[#745DF3] mb-6">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-[#101828] mb-4 tracking-tight uppercase">Account Warmup</h3>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed">Build sender reputation automatically. We handle the technical warmup so your emails actually land in the inbox.</p>
                </div>
                <div className="mt-auto bg-gray-50 rounded-[2rem] p-8 h-[240px] relative overflow-hidden">
                   <div className="flex justify-between items-end h-full gap-2">
                      {[30, 45, 60, 55, 75, 90, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-[#745DF3] rounded-t-lg opacity-20" style={{ height: '100%' }}>
                           <div className="bg-[#745DF3] rounded-t-lg transition-all duration-1000" style={{ height: `${h}%`, width: '100%' }} />
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-6 bg-[#101828] rounded-[2.5rem] p-10 md:p-12 shadow-sm flex flex-col min-h-[550px] text-white"
              >
                <div className="mb-12">
                  <h3 className="text-3xl font-black mb-4 tracking-tight uppercase text-white">Domain Rotation</h3>
                  <p className="text-lg text-white/50 font-medium leading-relaxed">Distribute your volume across multiple domains and accounts to avoid spam filters and rate limits.</p>
                </div>
                <div className="mt-auto bg-white/5 border border-white/10 rounded-[2rem] p-8 h-[240px] flex items-center justify-center">
                   <div className="grid grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${i === 3 ? 'bg-[#745DF3] border-[#745DF3] shadow-[0_0_20px_#745DF3]' : 'bg-white/5 border-white/10 shadow-none opacity-40'}`}>
                           <Zap className={`w-5 h-5 ${i === 3 ? 'text-white' : 'text-white/20'}`} />
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            </div>

            {/* Row 2: Smart Intent (Full Width) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-16 shadow-sm flex flex-col md:flex-row gap-16 min-h-[500px]"
            >
              <div className="flex-1">
                {/* <div className="w-14 h-14 bg-[#745DF3]/5 rounded-2xl flex items-center justify-center text-[#745DF3] mb-10">
                  <Inbox className="w-8 h-8" />
                </div> */}
                <h3 className="text-4xl md:text-5xl font-black text-[#101828] mb-6 tracking-tight uppercase">Smart Response Intent</h3>
                <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed">AI categorizes every reply as 'Interested', 'Later', or 'Not Interested' so you focus on the hot leads. Stop wasting time on manual triage.</p>
                <div className="flex gap-4">
                  <div className="px-6 py-2 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest">Interested</div>
                  <div className="px-6 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest">Meeting Booked</div>
                </div>
              </div>
              <div className="flex-1 bg-[#101828] rounded-[3rem] p-12 flex flex-col justify-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#745DF3]/10 blur-[100px] rounded-full" />
                 <div className="space-y-6 relative z-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                       <div className="flex items-center justify-between mb-4">
                          <div className="h-4 w-24 bg-white/10 rounded" />
                          <div className="h-6 w-20 bg-emerald-500/20 rounded-full border border-emerald-500/30" />
                       </div>
                       <div className="space-y-2">
                          <div className="h-2 w-full bg-white/5 rounded" />
                          <div className="h-2 w-2/3 bg-white/5 rounded" />
                       </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 opacity-30 scale-95">
                       <div className="h-4 w-32 bg-white/10 rounded mb-4" />
                       <div className="h-2 w-full bg-white/5 rounded" />
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Row 3: Personalized Fields & Verified Data */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-7 bg-[#FBFBFB] rounded-[2.5rem] border border-gray-200 p-10 md:p-12 shadow-sm flex flex-col min-h-[500px]"
              >
                <div className="mb-12">
                  {/* <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#745DF3] mb-6 shadow-sm border border-gray-100">
                    <Sparkles className="w-6 h-6" />
                  </div> */}
                  <h3 className="text-3xl font-black text-[#101828] mb-4 tracking-tight uppercase">Personalized Fields</h3>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed">Go beyond 'First Name'. Use dynamic tags for anything from local weather to recent company news using our advanced scraper.</p>
                </div>
                <div className="mt-auto bg-white border border-gray-100 rounded-3xl p-8 h-[220px]">
                   <div className="text-sm font-medium text-gray-400 mb-6 font-mono leading-relaxed">
                     Hey <span className="text-[#745DF3] font-bold">{"{first_name}"}</span>, saw your <span className="text-[#745DF3] font-bold">{"{recent_post}"}</span> and loved the insight on <span className="text-[#745DF3] font-bold">{"{company_industry}"}</span>.
                   </div>
                   <div className="flex gap-2">
                      <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-400 font-black uppercase">{"{weather}"}</div>
                      <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-400 font-black uppercase">{"{revenue}"}</div>
                      <div className="px-3 py-1 bg-[#745DF3]/10 border border-[#745DF3]/20 rounded-lg text-[10px] text-[#745DF3] font-black uppercase">{"{intent}"}</div>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-5 bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-12 shadow-sm flex flex-col min-h-[500px]"
              >
                <div className="mb-12">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-[#101828] mb-4 tracking-tight uppercase">Verified Lead Data</h3>
                  <p className="text-lg text-gray-500 font-medium leading-relaxed">Every email we find or import is verified in real-time. Say goodbye to high bounce rates and toasted sender reps.</p>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                        <div className="h-2 w-32 bg-gray-200 rounded" />
                        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
                           <Check className="w-3 h-3" />
                           Verified
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>

            {/* Security Shield (Wide) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#101828] rounded-[3.5rem] p-12 md:p-20 shadow-sm flex flex-col md:flex-row gap-12 items-center text-white overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(116,93,243,0.1),transparent_50%)]" />
              <div className="md:w-1/2 relative z-10">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#745DF3] mb-8 border border-white/10">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight uppercase text-white">Security Shield</h3>
                <p className="text-xl text-white/50 font-medium leading-relaxed mb-10">Advanced protection for your workspace. Role-based access, activity logs, and enterprise-grade encryption for full peace of mind.</p>
                {/* <button className="flex items-center gap-2 text-[#745DF3] font-black text-sm uppercase tracking-widest group">
                  View Security Docs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button> */}
              </div>
              <div className="md:w-1/2 flex items-center justify-center relative z-10">
                 <div className="w-full max-w-sm aspect-square bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative">
                    <div className="w-3/4 h-3/4 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                       <div className="w-1/2 h-1/2 bg-[#745DF3]/20 border border-[#745DF3]/40 rounded-full flex items-center justify-center">
                          <Shield className="w-12 h-12 text-[#745DF3] animate-pulse" />
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <CTASection />
      <Footer />
    </div>
  );
}
