'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section className="py-24 md:py-32 bg-[#FBFBFB]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-xs font-bold text-[#745DF3] mb-8 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 fill-[#745DF3]" />
              <span>The Platform</span>
            </div>
            <h2 className="text-[2.5rem] md:text-[4.5rem] font-black text-[#101828] leading-[1.05] tracking-tighter">
              Turn outbound into <br />
              <span className="text-[#745DF3]">a scalable system.</span>
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-lg md:text-xl text-[#101828]/60 leading-relaxed font-medium">
              LeadFlow brings every part of outbound outreach together from setup to execution so teams can scale with clarity.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-12">
          
          {/* Card 1: One inbox - Large - 7/12 width */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-7 bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm overflow-hidden flex flex-col min-h-[500px]"
          >
            <div className="mb-10">
              <h3 className="text-3xl font-black text-[#101828] mb-4 tracking-tight">One inbox for it all.</h3>
              <p className="text-lg text-[#101828]/50 max-w-sm font-medium">Handle replies quickly, understand intent, and move leads forward without switching tools.</p>
            </div>
            <div className="mt-auto relative bg-gray-50/50 rounded-[2rem] border border-gray-100/50 p-6 h-[260px]">
              {/* Mock Inbox UI */}
              <div className="flex h-full gap-4">
                <div className="w-1/3 bg-white border border-gray-100 rounded-2xl p-4 space-y-4 shadow-sm">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200/50" />
                      <div className="w-full h-2 bg-gray-200/30 rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="w-1/2 h-4 bg-gray-100 rounded-md mb-6" />
                  <div className="space-y-3">
                    <div className="w-full h-3 bg-gray-50 rounded" />
                    <div className="w-5/6 h-3 bg-gray-50 rounded" />
                    <div className="w-4/6 h-3 bg-gray-50 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: CRM Handoff - 5/12 width */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-5 bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm overflow-hidden flex flex-col min-h-[500px]"
          >
            <div className="mb-10">
              <h3 className="text-3xl font-black text-[#101828] mb-4 tracking-tight">Native CRM handoff.</h3>
              <p className="text-lg text-[#101828]/50 font-medium">LeadFlow qualifies responses, your CRM closes the deal. No manual sync.</p>
            </div>
            <div className="mt-auto bg-[#101828] rounded-[2rem] p-8 h-[260px] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#745DF3]/20 blur-3xl rounded-full" />
               <div className="grid grid-cols-2 gap-4 h-full">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#745DF3]/20" />
                    <div className="w-full h-4 bg-white/10 rounded" />
                 </div>
                 <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-end">
                    <div className="w-full h-2 bg-white/5 rounded mb-2" />
                    <div className="w-2/3 h-2 bg-white/5 rounded" />
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Card 3: Campaigns - Dark - 6/12 width */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-12 bg-[#101828] rounded-[2.5rem] p-12 shadow-sm overflow-hidden flex flex-col md:flex-row gap-12 items-center"
          >
            <div className="md:w-1/2">
              <h3 className="text-4xl font-black text-white mb-6 tracking-tight">Scale sequences without <br />the complexity.</h3>
              <p className="text-xl text-white/50 font-medium mb-8">Build structured outreach flows and keep everything organized as volume grows across hundreds of accounts.</p>
              <div className="flex gap-4">
                 <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#745DF3]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
                 </div>
                 <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#745DF3]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                 </div>
              </div>
            </div>
            <div className="md:w-1/2 w-full bg-white/5 border border-white/10 rounded-3xl p-8 h-[300px] relative">
               <div className="space-y-4">
                 <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#745DF3]" />
                    <div className="flex-1 h-3 bg-white/10 rounded" />
                 </div>
                 <div className="ml-10 space-y-4">
                    <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-white/10" />
                      <div className="flex-1 h-2 bg-white/5 rounded" />
                    </div>
                    <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5 opcity-50 scale-95">
                      <div className="w-8 h-8 rounded-lg bg-white/10" />
                      <div className="flex-1 h-2 bg-white/5 rounded" />
                    </div>
                 </div>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
