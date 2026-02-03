'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setIsSuccess(true);
      setTimeout(() => router.push('/signin'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
        <p className="text-gray-600 mb-8">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-[#745DF3] font-bold underline text-sm">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <Link href="/" className="inline-block mb-12">
        <Image src="/leadflow-black.png" alt="LeadFlow" width={120} height={32} className="h-8 w-auto" />
      </Link>

      {!isSuccess ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-[#101828] mb-4 tracking-tighter">Set new password</h1>
          <p className="text-[#101828]/50 mb-10 font-medium text-lg">Enter your new password below to reset your account access.</p>

          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#101828] uppercase tracking-wider">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#101828]/30 group-focus-within:text-[#745DF3]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3] font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#101828]/30"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#101828] uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#101828]/30" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#745DF3]/10 focus:border-[#745DF3] font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#101828] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Reset Password <ChevronRight size={20} /></>}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#101828] mb-4 tracking-tighter">Success!</h1>
          <p className="text-[#101828]/50 mb-10 font-medium text-lg">Your password has been updated. Redirecting to login...</p>
        </motion.div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex font-jakarta bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#745DF3]/[0.02] blur-[100px] rounded-full" />
        <Suspense fallback={<Loader2 className="animate-spin mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
