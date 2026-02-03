'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success' | 'warning';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmModalProps) {
  const themes = {
    danger: {
      icon: Trash2,
      color: 'text-red-600',
      bg: 'bg-red-50',
      button: 'bg-red-600 hover:bg-red-700',
      shadow: 'shadow-red-600/20'
    },
    info: {
      icon: AlertCircle,
      color: 'text-[#745DF3]',
      bg: 'bg-[#745DF3]/5',
      button: 'bg-[#745DF3] hover:bg-[#5C46E5]',
      shadow: 'shadow-[#745DF3]/20'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      button: 'bg-emerald-500 hover:bg-emerald-600',
      shadow: 'shadow-emerald-500/20'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      button: 'bg-amber-500 hover:bg-amber-600',
      shadow: 'shadow-amber-500/20'
    }
  };

  const theme = themes[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
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
            <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} blur-[60px] rounded-full -mr-16 -mt-16 opacity-50`} />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-[2.5rem] ${theme.bg} flex items-center justify-center ${theme.color} mb-8 border-4 border-white shadow-xl`}>
                <theme.icon className="w-8 h-8" />
              </div>

              <h3 className="text-2xl font-black text-[#101828] tracking-tight mb-3">
                {title}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-10 px-4">
                {description}
              </p>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-50 text-[#101828] rounded-2xl text-sm font-black hover:bg-gray-100 transition-all border border-gray-100"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-6 py-4 text-white rounded-2xl text-sm font-black transition-all shadow-xl ${theme.button} ${theme.shadow}`}
                >
                  {confirmText}
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
