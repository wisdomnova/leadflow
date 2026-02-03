'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Plus, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MissingAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MissingAccountModal({
  isOpen,
  onClose
}: MissingAccountModalProps) {
  const router = useRouter();

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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-10 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 blur-[60px] rounded-full -mr-16 -mt-16 opacity-50" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-amber-50 flex items-center justify-center text-amber-600 mb-8 border-4 border-white shadow-xl">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-[#101828] tracking-tight mb-3">
                Sender Profile Required
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-10 px-4">
                You haven't connected any sending accounts yet. You need at least one active sender profile to create and launch a campaign.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    onClose();
                    router.push('/dashboard/providers');
                  }}
                  className="w-full px-6 py-4 bg-[#101828] text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl shadow-[#101828]/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Connect Sender Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#101828] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
