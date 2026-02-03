'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Flame, 
  Plus, 
  Search, 
  Loader2,
  CheckCircle2,
  Mail
} from 'lucide-react';

interface AddWarmupAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAccounts: any[];
  onAdd: (accountId: string) => void;
}

export default function AddWarmupAccountModal({ isOpen, onClose, availableAccounts, onAdd }: AddWarmupAccountModalProps) {
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const filtered = availableAccounts.filter(acc => 
    acc.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (id: string) => {
    setIsSubmitting(id);
    try {
      const res = await fetch('/api/warmup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          warmup_enabled: true,
          warmup_status: 'Warming'
        })
      });

      if (res.ok) {
        onAdd(id);
        onClose();
      }
    } catch (err) {
      console.error("Add error:", err);
    } finally {
      setIsSubmitting(null);
    }
  };

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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-[#101828]">Add to Warmup</h3>
                <p className="text-gray-400 font-medium text-sm mt-1">Select an account to start warming up.</p>
              </div>
              <button onClick={onClose} className="p-3 text-gray-400 hover:text-[#101828] bg-gray-50 rounded-2xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search your connected accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-transparent focus:border-[#745DF3] focus:bg-white rounded-2xl text-sm font-bold outline-none transition-all shadow-inner"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {filtered.length > 0 ? filtered.map((account) => (
                  <div 
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#745DF3]/40 hover:bg-[#745DF3]/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        <img 
                          src={account.provider === 'google' ? 'https://cdn-icons-png.flaticon.com/512/732/732200.png' : 'https://cdn-icons-png.flaticon.com/512/732/732221.png'} 
                          className="w-5 h-5 object-contain" 
                          alt={account.provider} 
                        />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#101828] group-hover:text-[#101828] transition-colors">{account.email}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{account.provider}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(account.id)}
                      disabled={isSubmitting !== null}
                      className="px-6 py-2 bg-[#101828] text-white rounded-xl text-xs font-black hover:bg-[#101828]/90 transition-all flex items-center gap-2 group-hover:bg-[#745DF3]"
                    >
                      {isSubmitting === account.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {isSubmitting === account.id ? 'Starting...' : 'Enable Warmup'}
                    </button>
                  </div>
                )) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <Mail className="w-8 h-8" />
                    </div>
                    <p className="text-gray-400 font-bold">No accounts available for warmup.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                        Don't see an account? <span className="text-[#745DF3] font-black cursor-pointer">Connect a new provider</span> in the Providers tab first.
                    </p>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
