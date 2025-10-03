'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { 
  XCircle, 
  ArrowLeft, 
  CreditCard, 
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

// Theme colors - consistent with dashboard 
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

// 🎯 Loading Component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// 🎯 Main Content Component
function PaymentCancelledContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        className="max-w-lg mx-auto"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
          variants={staggerItem}
        >
          {/* Cancelled Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.2 
            }}
          >
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: '#fef3c7' }}
            >
              <XCircle className="h-10 w-10" style={{ color: '#d97706' }} />
            </div>
          </motion.div>
          
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-4"
            variants={staggerItem}
          >
            Payment Cancelled
          </motion.h2>
          
          <motion.p 
            className="text-lg text-gray-600 mb-8 leading-relaxed"
            variants={staggerItem}
          >
            Your payment was cancelled. Don't worry, no charges were made to your account.
          </motion.p>

          {/* Trial Reminder */}
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8"
            variants={staggerItem}
          >
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Your trial continues!</h3>
            </div>
            
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              You can still enjoy your free trial and upgrade anytime before it expires. 
              All your data and settings remain exactly as they were.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"
                    style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                  >
                    <CheckCircle className="h-3 w-3" style={{ color: THEME_COLORS.success }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">All features available</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0"
                    style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                  >
                    <Shield className="h-3 w-3" style={{ color: THEME_COLORS.success }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Data stays secure</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* What happens next */}
          <motion.div 
            className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8"
            variants={staggerItem}
          >
            <h4 className="font-bold text-gray-900 mb-3">What happens next?</h4>
            <div className="space-y-2 text-sm text-gray-600 text-left">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 font-bold">•</span>
                <span>Continue using LeadFlow with full access during your trial</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 font-bold">•</span>
                <span>Upgrade anytime to keep your account after trial expires</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 font-bold">•</span>
                <span>No automatic charges - you're in complete control</span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="space-y-4"
            variants={staggerItem}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/billing/upgrade"
                className="w-full inline-flex items-center justify-center px-8 py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <CreditCard className="mr-3 h-5 w-5" />
                Try Again
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md transition-all font-medium"
              >
                <ArrowLeft className="mr-3 h-4 w-4" />
                Back to Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Reassurance Message */}
        <motion.div 
          className="mt-8 text-center"
          variants={staggerItem}
        >
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-2xl shadow-sm">
            <Shield className="h-5 w-5 mr-3" style={{ color: THEME_COLORS.success }} />
            <span className="font-semibold text-sm" style={{ color: THEME_COLORS.success }}>
              No charges made • Your trial continues seamlessly
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// 🎯 Main Page Component with Suspense
export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentCancelledContent />
    </Suspense>
  )
}

// 🎯 Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'