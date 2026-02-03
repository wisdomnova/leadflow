'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const isExpired = daysRemaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[2rem] p-6 mb-8 border shadow-xl shadow-[#101828]/5 ${
        isExpired 
          ? 'bg-red-50 border-red-100' 
          : 'bg-[#101828] text-white border-white/10'
      }`}
    >
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isExpired ? 'bg-red-100 text-red-600' : 'bg-white/10 text-[#745DF3]'
          }`}>
            {isExpired ? <AlertCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>
          <div>
            <h3 className={`text-xl font-black tracking-tight ${isExpired ? 'text-red-900' : 'text-white'}`}>
              {isExpired ? 'Trial Expired' : `${daysRemaining} Days Left in Trial`}
            </h3>
            <p className={`text-sm font-medium ${isExpired ? 'text-red-700/70' : 'text-white/60'}`}>
              {isExpired 
                ? 'Your campaign automation has been paused. Upgrade to continue outreach.' 
                : 'Unlock the full power of LeadFlow with a Pro subscription today.'}
            </p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/billing"
          className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black transition-all group ${
            isExpired 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-[#745DF3] text-white hover:bg-[#634ad1] shadow-lg shadow-[#745DF3]/20'
          }`}
        >
          {isExpired ? 'Upgrade Now' : 'Compare Plans'}
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {!isExpired && (
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Zap className="w-32 h-32 text-white" />
        </div>
      )}
    </motion.div>
  );
}
