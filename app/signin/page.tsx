'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, ChevronRight, Eye, EyeOff, Loader2, AlertTriangle, X } from 'lucide-react';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check for expired_token query parameter on mount
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'expired_token') {
      setShowExpiredModal(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Success
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-jakarta">
      {/* Expired Session Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExpiredModal(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full border border-gray-100"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowExpiredModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {/* Content */}
            <h2 className="text-2xl font-black text-[#101828] mb-3 text-center tracking-tighter">
              Session Expired
            </h2>
            <p className="text-[#101828]/60 text-center mb-8 leading-relaxed">
              Your session has expired for security reasons. Please sign in again with your credentials to continue.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowExpiredModal(false)}
                className="w-full py-4 bg-[#101828] text-white rounded-2xl font-bold hover:bg-[#101828]/90 transition-all active:scale-[0.98] shadow-lg shadow-[#101828]/10"
              >
                Understand, Let's Sign In
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full py-4 bg-gray-100 text-[#101828] rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Go Back Home
              </button>
            </div>
          </motion.div>
        </div>
      )}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tighter">
              Welcome back.
            </h1>
            <p className="text-[#101828]/50 mb-10 font-medium text-lg">
              Enter your details to sign in to your account.
            </p>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
              >
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">!</span>
                </div>
                {error}
              </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3] focus:bg-white transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-bold text-[#101828] uppercase tracking-wider">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm font-bold text-[#745DF3] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#101828]/30 group-focus-within:text-[#745DF3] transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3] focus:bg-white transition-all font-medium disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#101828]/30 hover:text-[#101828] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <input 
                    id="remember-me" 
                    name="remember-me" 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg border-gray-100 bg-gray-50 text-[#745DF3] focus:ring-[#745DF3]/20" 
                  />
                  <label htmlFor="remember-me" className="text-sm font-bold text-[#101828]/40 uppercase tracking-widest cursor-pointer">
                    Remember me
                  </label>
                </div>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-bold text-[#745DF3] hover:underline uppercase tracking-widest"
                >
                  Forgot password?
                </Link>
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
                    Sign In
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center mt-10">
                <p className="text-sm font-bold text-[#101828]/40 uppercase tracking-widest">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-[#745DF3] hover:underline">
                    Sign up for free
                  </Link>
                </p>
              </div>

              <Link 
                href="/"
                className="flex items-center justify-center gap-2 text-sm font-bold text-[#101828]/40 hover:text-[#745DF3] transition-colors mt-8 uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>
            </form>
          </motion.div>

          {/* Social Proof / Trust */}
          <div className="mt-20 pt-10 border-t border-gray-50 flex items-center gap-4 opacity-50 grayscale">
            <span className="text-xs font-bold text-[#101828] uppercase tracking-[0.2em] whitespace-nowrap">Trusted by</span>
            <div className="flex gap-4 items-center overflow-hidden">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse delay-75" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image & Social Proof */}
      <div className="hidden lg:flex lg:w-1/2 p-8 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#745DF3]/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
          <Image 
            src="/auth-image.png" 
            alt="LeadFlow Experience" 
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SignInPageContent />
    </Suspense>
  );
}
