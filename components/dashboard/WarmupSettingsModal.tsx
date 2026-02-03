'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings2, 
  Flame, 
  TrendingUp, 
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface WarmupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
  onSave: (updatedAccount: any) => void;
}

export default function WarmupSettingsModal({ isOpen, onClose, account, onSave }: WarmupSettingsModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    daily_limit: 50,
    ramp_up: 5,
    reply_rate: 30,
    warmup_enabled: true
  });

  useEffect(() => {
    if (account) {
      setFormData({
        daily_limit: account.warmup_daily_limit || 50,
        ramp_up: account.warmup_ramp_up || 5,
        reply_rate: account.warmup_reply_rate || 30,
        warmup_enabled: account.warmup_enabled || false
      });
    }
  }, [account]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/warmup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: account.id,
          warmup_limit: formData.daily_limit,
          ramp_up: formData.ramp_up,
          reply_rate: formData.reply_rate,
          warmup_enabled: formData.warmup_enabled
        })
      });

      if (res.ok) {
        onSave({ ...account, warmup_limit: formData.daily_limit, warmup_enabled: formData.warmup_enabled });
        onClose();
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!account) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#101828]/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#101828]">Warmup Settings</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{account.email}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-gray-400 hover:text-[#101828] bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div>
                  <h4 className="font-black text-[#101828] text-sm">Warmup Status</h4>
                  <p className="text-xs text-gray-500 font-medium">Currently {formData.warmup_enabled ? 'Active' : 'Paused'}</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, warmup_enabled: !formData.warmup_enabled })}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 outline-none ${
                    formData.warmup_enabled ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                    formData.warmup_enabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Daily Limit */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Limit</label>
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#101828] text-white text-[10px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-bold leading-relaxed">
                          The maximum number of warmup emails to send per day when fully ramped up.
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[#101828]">{formData.daily_limit} emails</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    step="5"
                    value={formData.daily_limit}
                    onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#101828]"
                  />
                </div>

                {/* Ramp Up */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Daily Ramp Up</label>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-sm font-black text-[#101828]">{formData.ramp_up} emails</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="1"
                    value={formData.ramp_up}
                    onChange={(e) => setFormData({ ...formData, ramp_up: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#101828]"
                  />
                  <p className="text-[10px] text-gray-400 font-bold">We will increase your daily volume by {formData.ramp_up} every day until it hits the limit.</p>
                </div>

                {/* Reply Rate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Reply Rate</label>
                    <span className="text-sm font-black text-[#101828]">{formData.reply_rate}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={formData.reply_rate}
                    onChange={(e) => setFormData({ ...formData, reply_rate: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#101828]"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-white border border-gray-200 text-[#101828] rounded-2xl font-black text-sm hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] py-4 bg-[#101828] text-white rounded-2xl font-black text-sm hover:bg-[#101828]/90 transition-all shadow-xl shadow-[#101828]/10 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Apply Warmup Settings
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
