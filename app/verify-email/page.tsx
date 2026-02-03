'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, Send, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resend email');
      
      setIsSent(true);
      setTimeout(() => setIsSent(false), 5000);
    } catch (err) {
      setError('Could not resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-jakarta bg-white relative overflow-hidden p-6 text-center">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.02] blur-[100px] rounded-full pointer-events-none" />

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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-[#745DF3]/5"
        >
          <div className="w-20 h-20 bg-[#745DF3] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#745DF3]/20 relative group overflow-hidden">
            <Mail className="w-10 h-10 text-white z-10" />
            <motion.div 
              animate={{ 
                y: [-40, 40],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-white/20 translate-y-[-100%]"
            />
          </div>

          <h1 className="text-3xl font-black text-[#101828] mb-4 tracking-tighter uppercase ">
            Check your inbox
          </h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            We've sent a verification link to your work email. Please click the link to confirm your account and get started.
          </p>

          <div className="space-y-4">
            <Link 
              href="/onboarding"
              className="flex items-center justify-center gap-3 w-full py-5 bg-[#101828] text-white rounded-[2rem] text-sm font-black hover:bg-black transition-all shadow-xl shadow-[#101828]/10 group"
            >
              Go to Onboarding
              <CheckCircle2 className="w-4 h-4" />
            </Link>
            
            <button 
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center justify-center gap-3 w-full py-5 bg-white border border-gray-100 text-[#101828] rounded-[2rem] text-sm font-black hover:border-[#745DF3]/30 transition-all shadow-sm group disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#745DF3]" />
                  Resending Link...
                </>
              ) : isSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Link Sent!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#745DF3]" />
                  Resend Email
                </>
              )}
            </button>
          </div>

          <div className="mt-10 pt-10 border-t border-gray-50">
            <Link 
              href="/signin"
              className="inline-flex items-center gap-2 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-[#101828] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </motion.div>

        <p className="mt-12 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
          Verification required for full access
        </p>
      </div>
    </div>
  );
}
