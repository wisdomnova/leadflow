'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Shield, Mail, Key, Settings2, Loader2, CheckCircle2 } from 'lucide-react';

interface SMTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: any) => void;
}

export default function SMTPModal({ isOpen, onClose, onConnect }: SMTPModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    smtpHost: '',
    smtpPort: '465',
    smtpUser: '',
    smtpPass: '',
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPass: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 1. Test SMTP
      const smtpRes = await fetch('/api/accounts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'smtp',
          host: formData.smtpHost,
          port: formData.smtpPort,
          user: formData.smtpUser,
          pass: formData.smtpPass,
        })
      });

      const smtpData = await smtpRes.json();
      if (!smtpRes.ok) {
        throw new Error(`SMTP Error: ${smtpData.error}`);
      }

      // 2. Test IMAP
      const imapRes = await fetch('/api/accounts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'imap',
          host: formData.imapHost,
          port: formData.imapPort,
          user: formData.imapUser,
          pass: formData.imapPass,
        })
      });

      const imapData = await imapRes.json();
      if (!imapRes.ok) {
        throw new Error(`IMAP Error: ${imapData.error}`);
      }

      // Both successful
      onConnect(formData);
      // Reset for next time
      setStep(1);
    } catch (err: any) {
      alert(err.message || "Failed to connect to mail server");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
            className="relative w-full max-w-2xl bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#FBFBFB]/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#745DF3]/10 flex items-center justify-center text-[#745DF3]">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#101828] tracking-tight">Custom SMTP Setup</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Step {step} of 2: {step === 1 ? 'Account Details' : 'Server Configuration'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10">
              <div className="space-y-8">
                {step === 1 ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Account Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="e.g. outreach@acmecorp.com"
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-[#745DF3]/5 rounded-[2rem] border border-[#745DF3]/10">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#745DF3] flex items-center justify-center text-white shrink-0">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#101828]">Secure Connection Required</p>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                            LeadFlow exclusively supports SSL/TLS encrypted connections for SMTP/IMAP to ensure your account security and delivery data integrity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    {/* SMTP Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="w-4 h-4 text-[#745DF3]" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#745DF3]">SMTP Settings (Outgoing)</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">SMTP Host</label>
                        <input 
                          required
                          type="text" 
                          value={formData.smtpHost}
                          onChange={(e) => updateField('smtpHost', e.target.value)}
                          placeholder="smtp.example.com"
                          className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Port</label>
                          <input 
                            required
                            type="text" 
                            value={formData.smtpPort}
                            onChange={(e) => updateField('smtpPort', e.target.value)}
                            placeholder="465"
                            className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">SMTP User</label>
                          <input 
                            required
                            type="text" 
                            value={formData.smtpUser}
                            onChange={(e) => updateField('smtpUser', e.target.value)}
                            placeholder="Optional"
                            className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">SMTP Password</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            required
                            type="password" 
                            value={formData.smtpPass}
                            onChange={(e) => updateField('smtpPass', e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* IMAP Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">IMAP Settings (Incoming)</h4>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">IMAP Host</label>
                        <input 
                          required
                          type="text" 
                          value={formData.imapHost}
                          onChange={(e) => updateField('imapHost', e.target.value)}
                          placeholder="imap.example.com"
                          className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Port</label>
                          <input 
                            required
                            type="text" 
                            value={formData.imapPort}
                            onChange={(e) => updateField('imapPort', e.target.value)}
                            placeholder="993"
                            className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">IMAP User</label>
                          <input 
                            required
                            type="text" 
                            value={formData.imapUser}
                            onChange={(e) => updateField('imapUser', e.target.value)}
                            placeholder="Optional"
                            className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">IMAP Password</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            required
                            type="password" 
                            value={formData.imapPass}
                            onChange={(e) => updateField('imapPass', e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-[#745DF3] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-12 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                >
                  Cancel Setup
                </button>
                <div className="flex gap-4">
                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-8 py-4 bg-gray-50 text-[#101828] rounded-2xl text-sm font-black hover:bg-gray-100 transition-all border border-gray-100"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type={step === 1 ? 'button' : 'submit'}
                    onClick={() => step === 1 && setStep(2)}
                    disabled={isLoading}
                    className="px-10 py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/20 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        {step === 1 ? 'Next: Server Details' : 'Connect Account'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
