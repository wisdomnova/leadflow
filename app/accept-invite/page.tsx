'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setTimeout(() => router.push('/signin'), 3000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to set password');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto text-red-500">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-[#101828] tracking-tight">Invalid Invitation</h1>
        <p className="text-gray-500 font-medium">This invitation link is missing a token or has expired. Please contact your administrator.</p>
        <Link href="/signin" className="inline-flex items-center gap-2 text-[#745DF3] font-bold hover:underline">
          Go to Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full">
      {/* Logo/Brand */}
      <div className="flex justify-center mb-10">
        <img src="/leadflow-black.png" alt="Leadflow" className="h-10 w-auto" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden"
      >
        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500 mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-[#101828] mb-2">Welcome Aboard!</h2>
            <p className="text-gray-500 font-medium mb-8">Your account is now active. Redirecting you to login...</p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-[#745DF3] animate-spin" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#101828] tracking-tight">Activate Account</h2>
              <p className="text-gray-500 font-medium mt-1">Set a secure password to join your team.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#101828]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#101828]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold">{errorMessage}</p>
                </div>
              )}

              <button 
                disabled={status === 'loading'}
                className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Join Team
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-4 font-jakarta">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#745DF3] animate-spin" />
          <p className="text-gray-400 font-bold text-sm">Validating invitation...</p>
        </div>
      }>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
