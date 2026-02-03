'use client';

import React from 'react';
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import CTASection from "@/components/CTASection";
import { motion } from 'framer-motion';
import { Zap, Target, Mail, Users, BarChart3, Shield, ArrowRight } from 'lucide-react';

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] font-jakarta">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-xs font-bold text-[#745DF3] mb-8 uppercase tracking-widest"
            >
              <Zap className="w-3.5 h-3.5 fill-[#745DF3]" />
              <span>The Platform</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-[#101828] mb-8 tracking-tighter leading-[1.05]">
              Turn outbound into <br />
              <span className="text-[#745DF3]">a scalable system.</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              LeadFlow brings every part of outbound outreach together from setup to execution so teams can scale with clarity.
            </p>
          </div>

          {/* Illustrated Feature Blocks */}
          <div className="space-y-8">
            {/* Row 1: AI & Omnichannel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-7 bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-12 shadow-sm overflow-hidden flex flex-col min-h-[500px]"
              >
                <div className="mb-12">
                  <h3 className="text-4xl font-black text-[#101828] mb-4 tracking-tight uppercase">AI Personalization</h3>
                  <p className="text-xl text-gray-500 font-medium max-w-sm leading-relaxed">Write hundreds of unique opening lines in seconds. Our AI analyzes profiles to create truly personal outreach.</p>
                </div>
                <div className="mt-auto relative bg-gray-50/50 rounded-[2rem] border border-gray-100/50 p-6 h-[240px]">
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-gray-100" />
                       <div className="flex-1 space-y-2">
                          <div className="h-2 w-1/3 bg-gray-200 rounded" />
                          <div className="h-2 w-full bg-[#745DF3]/20 rounded" />
                       </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-4 opacity-60 scale-95 translate-y-4">
                       <div className="w-10 h-10 rounded-full bg-gray-100" />
                       <div className="flex-1 space-y-2">
                          <div className="h-2 w-1/4 bg-gray-200 rounded" />
                          <div className="h-2 w-3/4 bg-gray-100 rounded" />
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-5 bg-[#101828] rounded-[2.5rem] p-10 md:p-12 shadow-sm overflow-hidden flex flex-col min-h-[500px] text-white"
              >
                <div className="mb-12">
                  <h3 className="text-4xl font-black mb-4 tracking-tight text-white uppercase">Omnichannel Outreach</h3>
                  <p className="text-xl text-white/50 font-medium leading-relaxed">Reach prospects where they are. Combine email, LinkedIn, and more in a single unified sequence.</p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-4">
                   <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                      <Mail className="w-10 h-10 text-[#745DF3] mb-4" />
                      <div className="h-2 w-16 bg-white/10 rounded" />
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                      <Users className="w-10 h-10 text-white/20 mb-4" />
                      <div className="h-2 w-16 bg-white/5 rounded" />
                   </div>
                </div>
              </motion.div>
            </div>

            {/* Row 2: Unibox (Large) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-16 shadow-sm overflow-hidden flex flex-col md:flex-row gap-16 min-h-[500px]"
            >
              <div className="flex-1">
                <h3 className="text-4xl md:text-5xl font-black text-[#101828] mb-6 tracking-tight uppercase">One inbox for it all.</h3>
                <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed max-w-lg">Handle replies quickly, understand intent, and move leads forward without switching tools. The central hub for all your sending accounts.</p>
              </div>
              <div className="flex-1 bg-gray-50/50 rounded-[3rem] border border-gray-100 p-8 flex flex-col gap-6 relative">
                 <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold uppercase text-xs">Interested</div>
                       <div className="h-4 w-32 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-2">
                       <div className="h-2 w-full bg-gray-50 rounded" />
                       <div className="h-2 w-5/6 bg-gray-50 rounded" />
                    </div>
                 </div>
                 <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm opacity-50 scale-95 translate-x-10">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold uppercase text-[10px]">Later</div>
                       <div className="h-4 w-24 bg-gray-50 rounded" />
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Row 3: Handoff & Security */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
               <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-5 bg-[#745DF3] rounded-[2.5rem] p-10 md:p-12 shadow-sm overflow-hidden flex flex-col min-h-[500px] text-white"
              >
                <div className="mb-12">
                  <h3 className="text-4xl font-black mb-4 tracking-tight text-white uppercase">Native CRM handoff.</h3>
                  <p className="text-xl text-white/70 font-medium leading-relaxed">LeadFlow qualifies responses, your CRM closes the deal. No manual sync required.</p>
                </div>
                <div className="mt-auto h-[240px] bg-white/10 rounded-[2rem] border border-white/10 p-8 flex items-center justify-center">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                        <Zap className="w-8 h-8 text-[#745DF3]" />
                      </div>
                      <div className="w-8 h-0.5 bg-white/20 border-t border-dashed border-white/40" />
                      <div className="w-16 h-16 bg-[#101828] rounded-2xl flex items-center justify-center shadow-lg border border-white/10 font-black text-xs uppercase">CRM</div>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-7 bg-white rounded-[2.5rem] border border-gray-100 p-10 md:p-12 shadow-sm overflow-hidden flex flex-col min-h-[500px]"
              >
                <div className="mb-12">
                  {/* <div className="w-12 h-12 bg-[#745DF3]/5 rounded-xl flex items-center justify-center text-[#745DF3] mb-6">
                    <Shield className="w-6 h-6" />
                  </div> */}
                  <h3 className="text-4xl font-black text-[#101828] mb-4 tracking-tight uppercase">Enterprise Security</h3>
                  <p className="text-xl text-gray-500 font-medium max-w-sm leading-relaxed">Keep your accounts safe. Multi-layer security and account rotation built into every campaign.</p>
                </div>
                <div className="mt-auto grid grid-cols-3 gap-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center opacity-60">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 mb-2">
                           <Shield className="w-4 h-4" />
                        </div>
                        <div className="h-1.5 w-10 bg-gray-200 rounded" />
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>

            {/* Analytics - Wide */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#101828] rounded-[3.5rem] p-12 md:p-20 shadow-sm overflow-hidden flex flex-col md:flex-row gap-12 items-center text-white"
            >
              <div className="md:w-1/2">
                {/* <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#745DF3] mb-8 border border-white/10">
                  <BarChart3 className="w-8 h-8" />
                </div> */}
                <h3 className="text-4xl md:text-5xl font-black mb-6 tracking-tight uppercase text-white">Precision Analytics.</h3>
                <p className="text-xl text-white/50 font-medium mb-10 leading-relaxed">Know exactly what's working. Track every open, click, and reply with precision accuracy to double down on winners.</p>
              </div>
              <div className="md:w-1/2 flex items-center justify-center">
                 <div className="relative w-full aspect-video bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex items-end gap-3 h-full pt-10">
                       {[60, 40, 90, 70, 50, 80, 100].map((h, i) => (
                         <div key={i} className="flex-1 bg-[#745DF3]/40 rounded-t-lg transition-all hover:bg-[#745DF3]" style={{ height: `${h}%` }} />
                       ))}
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
