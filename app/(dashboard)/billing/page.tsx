// app/(dashboard)/billing/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { PLANS, getDiscountPercentage } from '@/lib/plans'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const { user, subscription } = useAuth()
  const supabase = createClient()

  const handleCheckout = async (planId: string, cycle: 'monthly' | 'yearly') => {
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    setLoading(planId)
    try {
      const plan = PLANS[planId as keyof typeof PLANS]
      const priceId = cycle === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId

      if (!priceId) {
        console.error('Price ID not configured for', planId, cycle)
        alert('This plan is not available yet. Please contact support.')
        setLoading(null)
        return
      }

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planId })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    }
  }

  const discountPercentage = getDiscountPercentage()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Scale your outreach with the right plan for your team
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors"
              aria-label="Toggle billing cycle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingCycle === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                Save {discountPercentage}%
              </Badge>
            </span>
          </div>
        </div>

        {/* Current Subscription */}
        {subscription && subscription.status !== 'canceled' && (
          <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  Current Plan: {PLANS[subscription.plan_id as keyof typeof PLANS]?.name || 'Unknown'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Status: {subscription.status === 'active' ? '✅ Active' : subscription.status}
                  {subscription.current_period_end && 
                    ` • Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  }
                </p>
              </div>
              <Button variant="outline" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            </div>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PLANS).map(([key, plan]) => {
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
            const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(price / 12) : price
            const isCurrentPlan = subscription?.plan_id === plan.id && subscription?.status === 'active'

            return (
              <Card
                key={key}
                className={`relative p-8 flex flex-col ${
                  plan.popular
                    ? 'border-primary border-2 shadow-xl scale-105'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold">${monthlyEquivalent}</span>
                    <span className="text-muted-foreground text-lg">/month</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-muted-foreground">
                      ${price} billed annually
                    </p>
                  )}
                  <p className="text-sm font-semibold text-primary mt-2">
                    {typeof plan.limits.monthlyEmails === 'number' 
                      ? `${plan.limits.monthlyEmails.toLocaleString()} emails/month`
                      : 'Unlimited emails/month'
                    }
                  </p>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full h-12 text-base"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={isCurrentPlan || loading === key}
                  onClick={() => handleCheckout(key, billingCycle)}
                >
                  {loading === key ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    'Get Started'
                  )}
                </Button>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span className="font-medium text-foreground">{plan.limits.maxUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contacts:</span>
                      <span className="font-medium text-foreground">
                        {typeof plan.limits.contacts === 'number' 
                          ? plan.limits.contacts.toLocaleString() 
                          : 'Unlimited'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sending Domains:</span>
                      <span className="font-medium text-foreground">Unlimited</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-xl font-bold mb-4">Need a Custom Plan?</h3>
            <p className="text-muted-foreground mb-6">
              Looking for more than 500,000 emails/month or need custom enterprise features?
            </p>
            <Button variant="outline" asChild>
              <a href="/help">Contact Sales</a>
            </Button>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold mb-2">💳 All plans include:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Unlimited campaigns</li>
              <li>• AI-powered personalization</li>
              <li>• Advanced analytics dashboard</li>
              <li>• Central inbox (Unibox)</li>
              <li>• No hidden fees</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🔒 Cancel anytime</h4>
            <p className="text-sm text-muted-foreground">
              All plans can be canceled at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}