'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Zap, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

function JoinContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const token = searchParams.get('t');

  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!slug || !token) {
      setError("This invitation link is incomplete or invalid.");
      setLoading(false);
      return;
    }
    fetchOrgInfo();
  }, [slug, token]);

  const fetchOrgInfo = async () => {
    try {
      const res = await fetch(`/api/team/join/info?slug=${slug}&token=${token}`);
      const data = await res.json();
      if (res.ok) {
        setOrgData(data);
      } else {
        setError(data.error || "Invitation not found.");
      }
    } catch (err) {
      setError("Failed to load invitation details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          token,
          action: orgData.autoJoinEnabled ? 'JOIN' : 'REQUEST'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        if (!data.requested) {
          // If they joined successfully, wait 2s then redirect
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      } else {
        if (res.status === 401) {
            // Need to login first
            router.push(`/signup?redirect=/join/${slug}?t=${token}`);
        } else {
            setError(data.error);
        }
      }
    } catch (err) {
      setError("A network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#745DF3] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#101828]">Invalid Invitation</h1>
            <p className="text-gray-500 font-medium mt-2">{error}</p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#101828]">
              {orgData.autoJoinEnabled ? "You're in!" : "Request Sent"}
            </h1>
            <p className="text-gray-500 font-medium mt-2">
              {orgData.autoJoinEnabled 
                ? `You've successfully joined ${orgData.name}. Redirecting to your dashboard...`
                : `We've notified the admins of ${orgData.name}. You'll receive an email once they approve your request.`}
            </p>
          </div>
          {!orgData.autoJoinEnabled && (
            <button 
              onClick={() => router.push('/')}
              className="w-full py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all"
            >
              Finish
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6 font-jakarta">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <img src="/leadflow-black.png" alt="Leadflow" className="h-8 w-auto" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-10 md:p-12 border border-gray-100 shadow-2xl shadow-gray-200/50 space-y-10"
        >
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 bg-[#745DF3]/5 rounded-3xl flex items-center justify-center text-[#745DF3] mx-auto mb-6">
              <Users className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-[#101828] tracking-tight">Join {orgData.name}</h1>
            <p className="text-gray-500 font-medium">
              Scaling outbound together on Leadflow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#745DF3] shadow-sm shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#101828]">Secure Workspace</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Private organization for campaign management and team collaboration.</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#745DF3] shadow-sm shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#101828]">Automated Outbound</h3>
                <p className="text-xs text-gray-500 font-medium mt-1">Access powerful tools to scale your outreach and book more meetings.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleAction}
              disabled={submitting}
              className="w-full py-5 bg-[#101828] text-white rounded-[2rem] text-lg font-black hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/20 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {orgData.autoJoinEnabled ? "Join Workspace" : "Request to Join"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              By joining you agree to leadflow's terms
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[#745DF3] animate-spin" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
