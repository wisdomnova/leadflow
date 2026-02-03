'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-jakarta">
      {/* Left side - Setup Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 bg-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.02] blur-[100px] rounded-full pointer-events-none" />
        
        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Logo */}
          <Link href="/" className="inline-block mb-12">
            <Image 
              src="/leadflow-black.png" 
              alt="LeadFlow Logo" 
              width={120} 
              height={32} 
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          {!isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tighter">
                Forgot password?
              </h1>
              <p className="text-[#101828]/50 mb-10 font-medium text-lg">
                No worries, we'll send you reset instructions.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-bold text-[#101828] uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#101828]/30 group-focus-within:text-[#745DF3] transition-colors" />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3] focus:bg-white transition-all font-medium disabled:opacity-50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[#101828] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#101828]/90 transition-all active:scale-[0.98] shadow-xl shadow-[#101828]/10 group disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Reset password
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <Link 
                  href="/signin"
                  className="flex items-center justify-center gap-2 text-sm font-bold text-[#101828]/40 hover:text-[#745DF3] transition-colors mt-8 uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-[#745DF3]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10 text-[#745DF3]" />
              </div>
              <h1 className="text-3xl font-black text-[#101828] mb-4 tracking-tighter">
                Check your email
              </h1>
              <p className="text-[#101828]/50 mb-10 font-medium text-lg leading-relaxed">
                We've sent a password reset link to <br/><span className="text-[#101828] font-bold">{email}</span>
              </p>
              
              <Link 
                href="/signin"
                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#745DF3] hover:underline uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to login
              </Link>
            </motion.div>
          )}

          {/* Social Proof / Trust */}
          {!isSubmitted && (
            <div className="mt-20 pt-10 border-t border-gray-50 flex items-center gap-4 opacity-50 grayscale">
              <span className="text-xs font-bold text-[#101828] uppercase tracking-[0.2em] whitespace-nowrap">Trusted by</span>
              <div className="flex gap-4 items-center overflow-hidden">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse delay-75" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Image & Social Proof */}
      <div className="hidden lg:flex lg:w-1/2 p-8 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#745DF3]/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
          <Image 
            src="/auth-image.png" 
            alt="Auth Experience" 
            fill
            className="object-cover"
            priority
          />
          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101828]/80 via-transparent to-transparent flex flex-col justify-end p-12">
            <div className="max-w-md">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-2xl font-bold text-white mb-6 leading-tight">
                "LeadFlow has completely transformed how we handle our outbound sequences. The AI personalization is unlike anything we've used before."
              </p>
              <div>
                <h4 className="font-bold text-white text-lg">Alex Morgan</h4>
                <p className="text-white/60 font-medium">Head of Growth, Acme Corp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
