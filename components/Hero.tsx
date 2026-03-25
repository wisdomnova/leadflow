'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Mail, Users, Layout, Settings, Cpu, Inbox, ArrowRight, Calendar, FileText, Database, UserSquare2, TrendingUp, PieChart, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#FBFBFB]">
      {/* Background Gradient Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[70%] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#745DF3]/20 via-[#a78bfa]/15 to-[#c4b5fd]/10" />
        <div className="absolute bottom-0 left-[-10%] w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_center,rgba(116,93,243,0.25)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-0 right-[-10%] w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.2)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#FBFBFB] to-transparent" />
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
            <Zap className="w-4 h-4 text-[#745DF3] fill-[#745DF3]" />
            <span>AI Powered Cold Outreach</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[2rem] md:text-[4.5rem] font-black tracking-tighter text-[#101828] max-w-5xl mb-8 leading-[1.05]"
          >
            The Cold Outreach OS for High-Growth Agencies.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm md:text-base lg:text-lg text-[#101828]/60 max-w-5xl mb-12 font-medium leading-relaxed text-center"
          >
            Manage 50+ client campaigns from a single dashboard. From automated mailbox setup to AI-driven personalization<br className="hidden lg:block" /> and lead classification, scale your agency without the operational headache.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-12"
          >
            <Link href="/signup">
              <button className="bg-[#745DF3] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-[#745DF3]/90 transition-all shadow-xl shadow-[#745DF3]/10 flex items-center gap-2 group">
                Start free trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="https://cal.com/leadflow/demo" target="_blank">
              <button className="bg-white text-[#101828] px-10 py-5 rounded-2xl font-bold text-lg border border-gray-100 hover:border-gray-200 transition-all shadow-sm flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#745DF3]" />
                Book a Demo
              </button>
            </Link>
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

          {/* Feature Icons from Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-4 md:gap-10 mb-20"
          >
            {[
              { name: 'Campaigns', icon: Layout },
              { name: 'Templates', icon: FileText },
              { name: 'Crm', icon: Database },
              { name: 'Unibox', icon: Inbox, highlighted: true },
              { name: 'Team Dashboard', icon: Users },
              { name: 'Analytics', icon: BarChart3 },
              { name: 'AI Integration', icon: Zap },
            ].map((f) => (
              <div key={f.name} className="flex flex-col items-center gap-3 transition-transform hover:scale-105">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border ${
                  f.highlighted 
                    ? 'bg-[#745DF3] border-[#745DF3] text-white shadow-[#745DF3]/20 shadow-lg' 
                    : 'bg-white border-gray-100/50 text-gray-400 group-hover:border-[#745DF3]/30'
                }`}>
                  <f.icon className={`w-6 h-6 ${f.highlighted ? 'text-white' : 'group-hover:text-[#745DF3]'}`} />
                </div>
                <span className={`text-[10px] font-bold transition-all ${
                  f.highlighted ? 'text-[#745DF3]' : 'text-gray-400 group-hover:text-[#101828]'
                }`}>
                  {f.name}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative w-full max-w-[1100px] mx-auto group"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#745DF3]/30 via-[#a78bfa]/20 to-[#c4b5fd]/15 rounded-[3rem] blur-3xl opacity-70 group-hover:opacity-100 transition duration-1000" />
            <div className="relative rounded-[2rem] border border-gray-200 overflow-hidden shadow-2xl bg-white p-1">
              <div className="rounded-[1.8rem] overflow-hidden">
                <Image
                  src="/mockups/Dashboard.png"
                  alt="LeadFlow Dashboard — campaign analytics, open rates, reply tracking"
                  width={2200}
                  height={1375}
                  quality={95}
                  priority
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
