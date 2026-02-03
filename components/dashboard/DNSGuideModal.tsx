'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, CheckCircle2, Info, ChevronRight, ShieldCheck, Globe, Zap } from 'lucide-react';

interface DNSGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DNSGuideModal({ isOpen, onClose }: DNSGuideModalProps) {
  const steps = [
    {
      title: "SPF (Sender Policy Framework)",
      description: "Specifies which mail servers are authorized to send email on behalf of your domain.",
      example: "v=spf1 include:_spf.google.com ~all",
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "DKIM (DomainKeys Identified Mail)",
      description: "Adds a digital signature to your emails, allowing the receiver to verify it was actually sent by you.",
      example: "sig1._domainkey.yourdomain.com",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      title: "DMARC",
      description: "Tells receiving servers what to do if an email fails SPF or DKIM checks (e.g., send it to spam).",
      example: "v=DMARC1; p=quarantine;",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-10 pb-6 border-b border-gray-50 bg-[#FBFBFB]/50 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/10 flex items-center justify-center text-[#745DF3]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#101828] tracking-tight">DNS Setup Guide</h2>
                    <p className="text-gray-500 font-medium text-sm">Follow these steps to maximize deliverability.</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-[#101828] transition-colors bg-gray-50 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-10 pt-6 overflow-y-auto no-scrollbar">
              <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 mb-8 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-amber-900 font-black text-sm uppercase tracking-widest mb-1">Recommended Strategy</h4>
                  <p className="text-amber-700 text-sm font-medium leading-relaxed">
                    Always use a <strong>subdomain</strong> (e.g., <code className="bg-white/50 px-1.5 py-0.5 rounded">outreach.acme.com</code>) for outreach. This keeps your main business email safe if people mark your cold emails as spam.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="group relative pl-12 border-l-2 border-dashed border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-xl ${step.bg} border-2 border-white flex items-center justify-center ${step.color} shadow-sm group-hover:scale-110 transition-transform`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-black text-[#101828] mb-1">{step.title}</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed mb-3">{step.description}</p>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 font-mono text-[11px] text-[#101828] break-all">
                      <span className="text-gray-400 mr-2">Example:</span>
                      {step.example}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-8 bg-[#101828] rounded-[2.5rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#745DF3]/20 blur-3xl -mr-16 -mt-16 rounded-full" />
                <div className="relative z-10">
                  <h4 className="text-lg font-black mb-2 text-white">Need a custom setup?</h4>
                  <p className="text-white/60 text-sm font-medium mb-6">Our experts can handle your technical DNS setup for you as part of our concierge service.</p>
                  <button className="flex items-center gap-2 px-6 py-3 bg-[#745DF3] hover:bg-[#634ad1] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-[#745DF3]/20">
                    Contact Support
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-50 bg-[#FBFBFB]/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-white border border-gray-200 text-[#101828] rounded-xl text-sm font-black hover:bg-gray-50 transition-all shadow-sm"
              >
                Got it, thanks!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
