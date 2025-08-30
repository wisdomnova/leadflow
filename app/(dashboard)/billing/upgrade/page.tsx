// ./app/(dashboard)/billing/upgrade/page.tsx - Added back to billing link

'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { Check, Loader2, CreditCard, Clock, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back to Billing */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link 
            href="/billing"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
          <p className="text-xl text-gray-600 mb-8">
            Unlock the full power of LeadFlow with our premium features
          </p>
          
        </motion.div>

        {/* Billing Toggle */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-lg border border-gray-200/50">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 text-base font-semibold rounded-xl transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 text-base font-semibold rounded-xl transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm px-2.5 py-1 rounded-full shadow-lg">
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
              className={`relative bg-white/95 backdrop-blur-xl rounded-3xl border shadow-xl p-10 ${
                plan.popular 
                  ? 'border-blue-300 ring-2 ring-blue-200/50 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20' 
                  : 'border-gray-200'
              }`}
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 500 }}
                >
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-2xl text-base font-bold shadow-lg">
                    Most Popular
                  </span>
                </motion.div>
              )}

              <div className="text-center mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{plan.name}</h3>
                <p className="text-gray-600 mb-6 text-base">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                  </span>
                  <span className="text-gray-600 text-lg ml-2">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {billingCycle === 'yearly' && (
                  <motion.p 
                    className="text-green-600 font-semibold text-base"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Save ${(plan.monthly * 12) - plan.yearly} per year
                  </motion.p>
                )}
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, featureIndex) => (
                  <motion.li 
                    key={featureIndex} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + featureIndex * 0.1 }}
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-base">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading === plan.id}
                className={`w-full py-4 px-8 rounded-2xl text-base font-bold transition-all shadow-lg hover:shadow-xl ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
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
      </div>
    </div> 
  )
}