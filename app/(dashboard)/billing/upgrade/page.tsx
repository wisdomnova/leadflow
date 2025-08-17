'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { Check, Loader2, CreditCard } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Unlock the full power of LeadFlow with our premium features
        </p>
        
        {isTrialActive && (
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">
              {daysRemaining} days left in your free trial
            </span>
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 p-1 rounded-lg">
          <div className="flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                Save {getDiscountPercentage()}%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
              plan.popular 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                </span>
                <span className="text-gray-600">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>

              {billingCycle === 'yearly' && (
                <p className="text-green-600 font-medium">
                  Save ${(plan.monthly * 12) - plan.yearly} per year
                </p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={isLoading === plan.id}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading === plan.id ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </div>
              ) : (
                `Get ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What happens if I exceed my limits?</h3>
            <p className="text-gray-600">
              We'll notify you when you're approaching your limits. If you exceed them, we'll suggest upgrading to a higher plan to continue using all features.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}