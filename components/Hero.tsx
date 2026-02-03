'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BarChart3, Mail, Users, Layout, Settings, Cpu, Inbox, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#FBFBFB]">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle_at_center,rgba(116,93,243,0.06)_0%,transparent_70%)] rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-sm font-bold text-[#101828] mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#745DF3]" />
            <span>The #1 AI Sourcing Engine</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[2.75rem] md:text-[6.5rem] font-black tracking-tighter text-[#101828] max-w-5xl mb-8 leading-[1.05]"
          >
            Scaling high-touch <br className="hidden md:block" />
            <span className="text-[#745DF3]">outreach with AI.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-2xl text-[#101828]/60 max-w-2xl mb-12 font-medium leading-tight"
          >
            Automate lead generation, personalized messaging, and campaign management. The all-in-one platform for modern sales teams.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-12"
          >
            <Link href="/signup">
              <button className="bg-[#101828] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 flex items-center gap-2 group">
                Start free trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="bg-white text-[#101828] px-10 py-5 rounded-2xl font-bold text-lg border border-gray-100 hover:border-gray-200 transition-all shadow-sm">
              Watch demo
            </button>
          </motion.div>

          {/* No Credit Card Required */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-2 text-[#101828]/40 text-sm mb-20"
          >
             <div className="w-5 h-5 rounded-full border border-[#101828]/10 flex items-center justify-center text-[#745DF3]">
               <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             <span>No credit card required</span>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative w-full max-w-[1100px] mx-auto group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#745DF3]/20 to-[#745DF3]/10 rounded-[2.5rem] blur-3xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative rounded-[2rem] border border-gray-200 overflow-hidden shadow-2xl bg-white p-1">
              <div className="rounded-[1.8rem] overflow-hidden bg-gray-50 border border-gray-100 flex aspect-[16/10] relative">
                {/* Simplified Sidebar Mockup */}
                <div className="w-1/6 border-r border-gray-200/50 bg-white p-6 hidden md:block">
                  <div className="w-full h-8 bg-gray-100 rounded-lg mb-10" />
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-100 rounded-md" />
                        <div className="w-full h-2 bg-gray-50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Simplified Content Mockup */}
                <div className="flex-1 p-10">
                   <div className="flex justify-between items-center mb-10">
                     <div className="w-48 h-8 bg-gray-100 rounded-lg" />
                     <div className="flex gap-3">
                       <div className="w-24 h-10 bg-gray-50 rounded-xl" />
                       <div className="w-28 h-10 bg-[#745DF3] rounded-xl shadow-lg shadow-primary/20" />
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-6 mb-10">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="h-32 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                         <div className="w-16 h-3 bg-gray-100 rounded mb-4" />
                         <div className="w-24 h-8 bg-gray-50 rounded-lg" />
                       </div>
                     ))}
                   </div>
                   <div className="h-full min-h-[300px] bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                     <div className="w-64 h-4 bg-gray-100 rounded-lg mb-8" />
                     <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100" />
                            <div className="flex-1 space-y-2">
                              <div className="w-1/3 h-3 bg-gray-100 rounded" />
                              <div className="w-2/3 h-2 bg-gray-50 rounded" />
                            </div>
                            <div className="w-20 h-8 rounded-full bg-green-50" />
                          </div>
                        ))}
                     </div>
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

export default Hero;
