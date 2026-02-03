'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Mail, Server } from 'lucide-react';
import Link from 'next/link';

export default function ProviderSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6 font-jakarta">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-[#745DF3] to-blue-500" />
          
          <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>

          <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tight">Connected!</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            Your email account has been successfully linked. You can now use this profile for your outreach campaigns.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
              <Server className="w-6 h-6 text-[#745DF3] mx-auto mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Status</p>
              <p className="text-sm font-black text-[#101828] mt-1">Verified</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
              <Mail className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Sync</p>
              <p className="text-sm font-black text-[#101828] mt-1">Active</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link 
              href="/dashboard/providers"
              className="w-full py-5 bg-[#101828] text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-[#101828]/10 flex items-center justify-center gap-2 group"
            >
              Back to Providers
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
