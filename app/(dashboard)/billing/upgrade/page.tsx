// ./app/(dashboard)/billing/upgrade/page.tsx
'use client'

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
    description: 'Perfect for individual sales professionals',
    monthlyEmails: '10,000',
    features: [
      '1 user, unlimited sending domains',
      '10,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Email & chat support'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 99,
    yearly: 990,
    description: 'Best for growing sales teams',
    monthlyEmails: '100,000',
    features: [
      '3 users, unlimited sending domains',
      '100,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Priority support (chat + email)'
    ],
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 299,
    yearly: 2990,
    description: 'For enterprise teams at scale',
    monthlyEmails: '500,000',
    features: [
      '10 users, unlimited sending domains',
      '500,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Dedicated account manager + premium support'
    ]
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

export default function UpgradePage() {
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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 60% 80% at 30% 50%, rgba(15, 102, 219, 0.2) 0%, transparent 70%),
              radial-gradient(ellipse 80% 60% at 70% 30%, rgba(37, 180, 61, 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 70% 70% at 50% 70%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)
            `,
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
        
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gray-900">Choose Your </span>
            <span 
              style={{
                background: `linear-gradient(135deg, ${THEME_COLORS.success} 0%, ${THEME_COLORS.primary} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Perfect Plan
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Unlock the full power of LeadFlow with our premium features and advanced capabilities.
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
          <div className="bg-gray-100 p-1 rounded-xl">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span 
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full font-bold"
                  style={{ backgroundColor: THEME_COLORS.success }}
                >
                  Save {getDiscountPercentage()}%
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className={`relative bg-white rounded-3xl shadow-xl border-2 p-8 ${
                plan.popular 
                  ? 'scale-105 ring-4 ring-opacity-20' 
                  : 'border-gray-200'
              }`}
              style={{
                borderColor: plan.popular ? THEME_COLORS.primary : undefined
              }}
              variants={staggerItem}
              whileHover={{ scale: plan.popular ? 1.05 : 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span 
                    className="text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-2">
                  <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                    ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                  </span>
                  <span className="text-gray-600 text-lg lg:text-xl">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {/* Monthly Email Limit */}
                <div className="mb-4">
                  <div 
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: `${THEME_COLORS.primary}20`, color: THEME_COLORS.primary }}
                  >
                    {plan.monthlyEmails} emails/month
                  </div>
                </div>

                {billingCycle === 'yearly' && (
                  <p className="font-semibold" style={{ color: THEME_COLORS.success }}>
                    Save ${(plan.monthly * 12) - plan.yearly} per year
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 flex-shrink-0 mr-3 mt-0.5" style={{ color: THEME_COLORS.success }} />
                    <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <motion.button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading === plan.id}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'text-white hover:shadow-2xl'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
                style={{
                  backgroundColor: plan.popular ? THEME_COLORS.primary : undefined
                }}
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
                    Start Free Trial
                  </div>
                )}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-gray-600 mb-6 text-lg">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
              <span className="text-gray-600 font-medium">Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
              <span className="text-gray-600 font-medium">No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" style={{ color: THEME_COLORS.success }} />
              <span className="text-gray-600 font-medium">24/7 support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div> 
  )
}