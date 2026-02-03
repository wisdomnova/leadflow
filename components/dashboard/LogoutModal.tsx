'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertTriangle } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#101828]/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-10 overflow-hidden"
          >
            {/* Design Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 blur-[60px] rounded-full -mr-16 -mt-16 opacity-50" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-red-50 flex items-center justify-center text-red-500 mb-8 border-4 border-white shadow-xl">
                <LogOut className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-[#101828] tracking-tight mb-3">
                Wait! Are you sure?
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-10 px-4">
                You're about to log out of your session. You'll need to enter your credentials again to access your campaigns.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-50 text-[#101828] rounded-2xl text-sm font-black hover:bg-gray-100 transition-all border border-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-6 py-4 bg-red-500 text-white rounded-2xl text-sm font-black hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
                >
                  Yes, Log Out
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#101828] hover:bg-gray-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
