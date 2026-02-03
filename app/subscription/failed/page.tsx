'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionFailedPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6 font-jakarta">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-orange-400 to-red-500" />
          
          <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tight">Payment Failed</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            We couldn't process your transaction. This might be due to insufficient funds, or an issue with your bank.
          </p>

          <div className="space-y-4">
            <Link 
              href="/dashboard/billing"
              className="w-full py-5 bg-[#745DF3] text-white rounded-2xl font-black text-sm hover:bg-[#634ad1] transition-all shadow-xl shadow-[#745DF3]/20 flex items-center justify-center gap-2 group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Try Another Payment Method
            </Link>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/dashboard"
                className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return Home
              </Link>
              <a 
                href="https://help.tryleadflow.ai"
                target="_blank"
                className="flex-1 py-4 bg-white border border-gray-100 text-gray-500 rounded-2xl font-black text-xs hover:border-[#745DF3]/20 hover:text-[#745DF3] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Contact Support
              </a>
            </div>
          </div>
          
          <p className="mt-10 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Transaction ID: ERR_402_PMT_VD</p>
        </motion.div>
      </div>
    </div>
  );
}
