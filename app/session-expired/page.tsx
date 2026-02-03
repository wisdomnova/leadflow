'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { LogIn, ArrowRight, ShieldAlert, Clock } from 'lucide-react';

export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-jakarta bg-white relative overflow-hidden p-6 text-center">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.02] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-block mb-12">
          <Image 
            src="/leadflow-black.png" 
            alt="LeadFlow" 
            width={120} 
            height={32} 
            className="h-8 w-auto object-contain mx-auto"
            priority
          />
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-[#745DF3]/5"
        >
          <div className="w-20 h-20 bg-orange-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-orange-100 relative">
            <Clock className="w-10 h-10 text-orange-500 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-[#101828] mb-4 tracking-tighter uppercase ">
            Session Expired
          </h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            Your security session has timed out due to inactivity. Please sign in again to continue managing your campaigns.
          </p>

          <div className="space-y-4">
            <Link 
              href="/signin"
              className="flex items-center justify-center gap-3 w-full py-5 bg-[#101828] text-white rounded-[2rem] text-sm font-black hover:bg-black transition-all shadow-xl shadow-[#101828]/10 group"
            >
              Sign In Again
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 w-full py-4 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-[#745DF3] transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </motion.div>

        <p className="mt-12 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
          Secured by LeadFlow Identity System
        </p>
      </div>
    </div>
  );
}
