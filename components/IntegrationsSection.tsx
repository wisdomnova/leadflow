'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Workflow, Database, MessageSquare, Calendar, Shield, Share2, Clock, Zap } from 'lucide-react';

const IntegrationCard = ({ icon: Icon, name, color }: { icon: any, name: string, color: string }) => (
  <div className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] whitespace-nowrap">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-gray-700 font-semibold text-lg">{name}</span>
  </div>
);

const IntegrationsSection = () => {
  const row1 = [
    { name: 'WorkflowPro', icon: Workflow, color: 'bg-emerald-400' },
    { name: 'ProjectSync', icon: Share2, color: 'bg-green-500' },
    { name: 'TeamPulse', icon: Zap, color: 'bg-blue-500' },
    { name: 'NoteMate', icon: Calendar, color: 'bg-yellow-400' },
    { name: 'TimeGrid', icon: Clock, color: 'bg-gray-500' },
    { name: 'PlanMap', icon: Share2, color: 'bg-red-400' },
  ];

  const row2 = [
    { name: 'DocVault', icon: Shield, color: 'bg-blue-400' },
    { name: 'TimeGrid', icon: Clock, color: 'bg-slate-800' },
    { name: 'TaskConnect', icon: Database, color: 'bg-emerald-500' },
    { name: 'DataLink', icon: Cpu, color: 'bg-blue-600' },
    { name: 'ChatLine', icon: MessageSquare, color: 'bg-indigo-500' },
    { name: 'WorkflowPro', icon: Workflow, color: 'bg-emerald-300' },
  ];

  const row3 = [
    { name: 'TeamPulse', icon: Zap, color: 'bg-indigo-400' },
    { name: 'WorkflowPro', icon: Workflow, color: 'bg-emerald-500' },
    { name: 'NoteMate', icon: Calendar, color: 'bg-yellow-500' },
    { name: 'TimeGrid', icon: Clock, color: 'bg-slate-700' },
    { name: 'PlanMap', icon: Share2, color: 'bg-red-500' },
    { name: 'ProjectSync', icon: Share2, color: 'bg-green-400' },
  ];

  return (
    <section className="py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 mb-24">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white shadow-sm text-xs font-bold text-[#745DF3] mb-8 uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 fill-[#745DF3]" />
            <span>AI Brain</span>
          </div>

          {/* Headline */}
          <h2 className="text-[2.5rem] md:text-[4.5rem] font-black text-[#101828] max-w-5xl mb-10 leading-[1.05] tracking-tighter">
            AI that understands replies <br />
            <span className="text-[#745DF3]">and improves your outreach.</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#101828]/50 max-w-2xl leading-relaxed font-medium">
            LeadFlow uses AI to analyze replies, assist personalization, and surface insights helping you decide what to do next, automatically.
          </p>
        </div>
      </div>

      {/* Marquee/Wall Section */}
      <div className="flex flex-col gap-8 relative">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Row 1 - Moving Right */}
        <motion.div 
          animate={{ x: [0, -1200] }}
          transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...row1, ...row1, ...row1, ...row1].map((item, idx) => (
            <IntegrationCard key={idx} {...item} />
          ))}
        </motion.div>

        {/* Row 2 - Moving Left */}
        <motion.div 
          animate={{ x: [-1200, 0] }}
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap ml-[-600px]"
        >
          {[...row2, ...row2, ...row2, ...row2].map((item, idx) => (
            <IntegrationCard key={idx} {...item} />
          ))}
        </motion.div>

        {/* Row 3 - Moving Right */}
        <motion.div 
          animate={{ x: [0, -1200] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {[...row3, ...row3, ...row3, ...row3].map((item, idx) => (
            <IntegrationCard key={idx} {...item} />
          ))}
        </motion.div>
      </div>

      {/* Decorative Gradient */}
      <div className="max-w-[1200px] mx-auto px-6 mt-32">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent" />
      </div>
    </section>
  );
};

export default IntegrationsSection;
