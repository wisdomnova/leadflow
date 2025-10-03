'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { Check, Loader2, CreditCard, Clock, ArrowLeft, Star, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue 
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 29,
    yearly: 290,
    description: 'Perfect for small businesses and startups',
    features: [
      '1,000 contacts',
      '10 email campaigns per month',
      '5,000 emails per month', 
      'Basic analytics',
      'Email support',
      'CSV import/export' 
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 79,
    yearly: 790,
    description: 'Best for growing businesses',
    features: [
      '10,000 contacts',
      '50 email campaigns per month',
      '50,000 emails per month',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom fields',
      'Automation workflows'
    ],
    popular: true
  }
]

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
function UpgradePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Loading upgrade options...</p>
      </div>
    </div>
  )
}

// 🎯 Main Content Component
function UpgradePageContent() {
  const { user } = useAuth()
  const { daysRemaining, isTrialActive } = useTrialStatus()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (planType: string) => {
    setIsLoading(planType)
    
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, billingCycle })
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        console.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    }
    
    setIsLoading(null)
  }

  const getDiscountPercentage = () => {
    const starter = plans.find(p => p.id === 'starter')!
    const discount = ((starter.monthly * 12 - starter.yearly) / (starter.monthly * 12)) * 100
    return Math.round(discount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Back to Billing */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link 
            href="/billing"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Billing
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Unlock the full power of LeadFlow with our premium features and advanced capabilities
          </p>

          {/* Trial Status Banner */}
          {isTrialActive && (
            <motion.div 
              className="inline-flex items-center px-6 py-3 rounded-2xl border border-orange-200 shadow-sm max-w-md mx-auto"
              style={{ backgroundColor: '#fef3c7' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Clock className="h-5 w-5 mr-3" style={{ color: '#d97706' }} />
              <span className="font-semibold" style={{ color: '#d97706' }}>
                {daysRemaining} days left in your free trial
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Billing Toggle */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 text-base font-semibold rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={billingCycle === 'monthly' ? { backgroundColor: THEME_COLORS.primary } : {}}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 text-base font-semibold rounded-xl transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={billingCycle === 'yearly' ? { backgroundColor: THEME_COLORS.primary } : {}}
              >
                Yearly
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs px-2.5 py-1 rounded-xl shadow-sm font-semibold"
                  style={{ backgroundColor: THEME_COLORS.success }}
                >
                  Save {getDiscountPercentage()}%
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Plans */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative bg-white rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 p-8 ${
                plan.popular 
                  ? 'border-2 ring-4 ring-opacity-20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={plan.popular ? {
                borderColor: THEME_COLORS.primary,
                '--tw-ring-color': THEME_COLORS.primary
              } as any : {}}
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 500 }}
                >
                  <span 
                    className="text-white px-6 py-2 rounded-2xl text-sm font-bold shadow-lg flex items-center"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <Star className="h-4 w-4 mr-2 fill-current" />
                    Most Popular
                  </span>
                </motion.div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: plan.popular ? THEME_COLORS.primary : THEME_COLORS.accent }}
                  >
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                <p className="text-gray-600 mb-6 text-base leading-relaxed">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                  </span>
                  <span className="text-gray-600 text-lg ml-2">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {billingCycle === 'yearly' && (
                  <motion.div 
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm"
                    style={{ backgroundColor: `${THEME_COLORS.success}20`, color: THEME_COLORS.success }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Save ${(plan.monthly * 12) - plan.yearly} per year
                  </motion.div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={featureIndex} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + featureIndex * 0.1 }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                    >
                      <Check className="h-4 w-4" style={{ color: THEME_COLORS.success }} />
                    </div>
                    <span className="text-gray-700 text-base font-medium">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading === plan.id}
                className={`w-full py-4 px-8 rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
                style={plan.popular ? { backgroundColor: THEME_COLORS.primary } : {}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }} 
              >
                {isLoading === plan.id ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CreditCard className="h-5 w-5 mr-3" />
                    Get {plan.name}
                  </div>
                )}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Comparison */}
        <motion.div 
          className="mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-gray-600">
              Both plans include our core features with different usage limits
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '📧',
                  title: 'Email Campaigns',
                  description: 'Create and send professional email sequences with our drag-and-drop editor'
                },
                {
                  icon: '👥',
                  title: 'Contact Management',
                  description: 'Organize and segment your contacts with custom fields and tags'
                },
                {
                  icon: '📊',
                  title: 'Analytics & Reports',
                  description: 'Track open rates, clicks, and conversions with detailed insights'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-2xl">
            <Check className="h-5 w-5 mr-3" style={{ color: THEME_COLORS.success }} />
            <span className="font-semibold" style={{ color: THEME_COLORS.success }}>
              30-day money-back guarantee • Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>
    </div> 
  )
}

// 🎯 Main Page Component with Suspense
export default function UpgradePage() {
  return (
    <Suspense fallback={<UpgradePageLoading />}>
      <UpgradePageContent />
    </Suspense>
  )
}

// 🎯 Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0