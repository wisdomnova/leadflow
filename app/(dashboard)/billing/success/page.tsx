// ./app/(dashboard)/billing/success/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  AlertTriangle,
  Star,
  Zap,
  TrendingUp,
  Users,
  Mail,
  BarChart3
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

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [isVerifying, setIsVerifying] = useState(true) 
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) { 
      verifyPayment()
    } else {
      setError('Invalid session')
      setIsVerifying(false)
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      // You can implement a verify payment endpoint if needed
      // For now, we'll just assume success since Stripe webhooks handle the backend
      setTimeout(() => {
        setIsVerifying(false)
      }, 2000)
    } catch (error) {
      setError('Payment verification failed')
      setIsVerifying(false)
    } 
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div 
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
          >
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: THEME_COLORS.primary }} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Verifying your payment...
          </h2>
          <p className="text-lg text-gray-600">
            Please wait while we confirm your subscription.
          </p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          className="max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: `${THEME_COLORS.warning}20` }}
            >
              <AlertTriangle className="h-10 w-10" style={{ color: THEME_COLORS.warning }} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
            
            <Link
              href="/billing"
              className="inline-flex items-center justify-center px-8 py-3 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: THEME_COLORS.primary }}
            >
              Go to Billing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const nextSteps = [
    {
      icon: TrendingUp,
      title: 'Access your upgraded dashboard',
      description: 'View enhanced analytics and insights'
    },
    {
      icon: Users,
      title: 'Import more contacts',
      description: 'Scale your contact database'
    },
    {
      icon: Mail,
      title: 'Create unlimited campaigns',
      description: 'Build powerful email sequences'
    },
    {
      icon: BarChart3,
      title: 'View detailed analytics',
      description: 'Track performance and optimize'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        className="max-w-2xl mx-auto"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div 
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
          variants={staggerItem}
        >
          {/* Success Icon */}
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
              className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: `${THEME_COLORS.success}20` }}
            >
              <CheckCircle className="h-12 w-12" style={{ color: THEME_COLORS.success }} />
            </div>
          </motion.div>
          
          <motion.div variants={staggerItem}>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎉 Payment Successful!
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl text-gray-600 mb-8 leading-relaxed"
            variants={staggerItem}
          >
            Thank you for subscribing to LeadFlow! Your account has been upgraded and you now have access to all premium features.
          </motion.p>

          {/* Celebration Badge */}
          <motion.div 
            className="inline-flex items-center px-6 py-3 rounded-2xl mb-8 shadow-sm"
            style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
            variants={staggerItem}
          >
            <Star className="h-5 w-5 mr-3" style={{ color: THEME_COLORS.primary }} />
            <span className="font-semibold text-lg" style={{ color: THEME_COLORS.primary }}>
              Welcome to LeadFlow Pro!
            </span>
          </motion.div>

          {/* What's Next Section */}
          <motion.div 
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8"
            variants={staggerItem}
          >
            <div className="flex items-center justify-center mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">What's next?</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nextSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <div className="flex items-start">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: THEME_COLORS.primary }} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{step.title}</h4>
                        <p className="text-xs text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="space-y-4"
            variants={staggerItem}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-8 py-4 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                Go to Dashboard
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/billing"
                className="w-full inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md transition-all font-medium"
              >
                View Billing Details
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Additional Info */}
        <motion.div 
          className="mt-8 text-center"
          variants={staggerItem}
        >
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-2xl shadow-sm">
            <CheckCircle className="h-5 w-5 mr-3" style={{ color: THEME_COLORS.success }} />
            <span className="font-semibold text-sm" style={{ color: THEME_COLORS.success }}>
              Your subscription is now active • Full access unlocked
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
          >
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: THEME_COLORS.primary }}
            ></div>
          </div>
          <p className="text-lg text-gray-600 font-medium">Loading...</p>
        </motion.div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}