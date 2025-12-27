'use client'

import { useEffect, useMemo, useState } from 'react'

type Plan = {
  id: string
  name: string
  description?: string
  monthlyPrice: number
  annualPrice: number
  emailLimit?: number
  userLimit?: number
  features: string[]
}

type Subscription = {
  status?: string
  currentPeriodEnd?: string | null
  billingCycle?: 'monthly' | 'yearly' | 'none'
  currentPlanId?: string | null
  currentPlanName?: string | null
}

export default function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentPlanId = useMemo(() => {
    if (!subscription) return null
    return subscription.currentPlanId || null
  }, [subscription])

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setError('Sign in to view plan details.')
          setLoading(false)
          return
        }

        const [planRes, subRes] = await Promise.all([
          fetch('/api/plans', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/billing/subscription', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (planRes.ok) {
          const planData = await planRes.json()
          setPlans(planData.plans || [])
        } else {
          setError('Unable to load plans right now.')
        }

        if (subRes.ok) {
          const subData = await subRes.json()
          const planId = subData?.currentPlan?.id || subData?.currentPlan?.plan_id || null
          setSubscription({
            status: subData?.subscription?.status,
            currentPeriodEnd: subData?.subscription?.currentPeriodEnd,
            billingCycle: subData?.subscription?.billingCycle || 'monthly',
            currentPlanId: planId,
            currentPlanName: subData?.currentPlan?.name || null,
          })
          if (subData?.subscription?.billingCycle === 'yearly') {
            setBillingCycle('yearly')
          }
        } else if (subRes.status === 401) {
          setError('Sign in to view plan details.')
        }
      } catch (err) {
        console.error('Plans load failed', err)
        setError('Unable to load plans right now.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(planId)
      setError(null)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Sign in to change plans.')
        setUpgrading(null)
        return
      }

      const res = await fetch('/api/billing/upgrade-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, billingCycle }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Unable to change plans. Please try again.')
        return
      }

      if (data.free && data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      }
    } catch (err) {
      console.error('Upgrade failed', err)
      setError('Unable to change plans. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  const pricing = (plan: Plan) => billingCycle === 'yearly' ? plan.annualPrice : plan.monthlyPrice

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold">Plans</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose the plan that fits your team.</p>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">Monthly</span>
            <div className="form-switch">
              <input type="checkbox" id="billing-cycle" className="sr-only" checked={billingCycle === 'yearly'} onChange={() => setBillingCycle(billingCycle === 'yearly' ? 'monthly' : 'yearly')} />
              <label htmlFor="billing-cycle">
                <span className="bg-white shadow-sm" aria-hidden="true"></span>
                <span className="sr-only">Toggle annual billing</span>
              </label>
            </div>
            <span className="text-gray-500">Annual <span className="text-green-600">(-20%)</span></span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No plans available yet.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id || subscription?.currentPlanName?.toLowerCase() === plan.name?.toLowerCase()
              return (
                <div key={plan.id} className={`relative bg-white dark:bg-gray-800 border shadow-sm rounded-lg h-full ${isCurrent ? 'border-violet-500' : 'border-gray-200 dark:border-gray-700/60'}`}>
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${isCurrent ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700/60'}`} aria-hidden="true"></div>
                  <div className="px-5 pt-5 pb-6 border-b border-gray-200 dark:border-gray-700/60">
                    <header className="flex items-center justify-between mb-2">
                      <h3 className="text-lg text-gray-800 dark:text-gray-100 font-semibold">{plan.name}</h3>
                      {isCurrent && <span className="text-xs font-semibold text-violet-600 dark:text-violet-300">Current</span>}
                    </header>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{plan.description || 'Included features based on your tier.'}</div>
                    <div className="text-gray-800 dark:text-gray-100 font-bold mb-4">
                      <span className="text-3xl">${(pricing(plan) / 100).toFixed(0)}</span>
                      <span className="text-gray-500 font-medium text-sm">/mo</span>
                    </div>
                    <button
                      className={`btn w-full ${isCurrent ? 'bg-gray-100 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 cursor-default' : 'bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white'}`}
                      onClick={() => !isCurrent && handleUpgrade(plan.id)}
                      disabled={isCurrent || upgrading === plan.id}
                    >
                      {isCurrent ? 'Current plan' : upgrading === plan.id ? 'Processing…' : 'Change plan'}
                    </button>
                  </div>
                  <div className="px-5 pt-4 pb-5">
                    <div className="text-xs text-gray-800 dark:text-gray-100 font-semibold uppercase mb-3">What's included</div>
                    <ul className="space-y-2">
                      {(plan.features || []).slice(0, 6).map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-200">
                          <svg className="w-3 h-3 shrink-0 fill-current text-green-500 mr-2" viewBox="0 0 12 12">
                            <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.emailLimit && (
                        <li className="flex items-center text-sm text-gray-700 dark:text-gray-200">
                          <svg className="w-3 h-3 shrink-0 fill-current text-green-500 mr-2" viewBox="0 0 12 12">
                            <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                          </svg>
                          <span>{plan.emailLimit.toLocaleString()} emails/month</span>
                        </li>
                      )}
                      {plan.userLimit && (
                        <li className="flex items-center text-sm text-gray-700 dark:text-gray-200">
                          <svg className="w-3 h-3 shrink-0 fill-current text-green-500 mr-2" viewBox="0 0 12 12">
                            <path d="M10.28 1.28L3.989 7.575 1.695 5.28A1 1 0 00.28 6.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 1.28z" />
                          </svg>
                          <span>{plan.userLimit} users included</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {subscription && (
          <div className="bg-linear-to-r from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04] rounded-lg p-4 text-sm text-gray-800 dark:text-gray-100">
            <div className="font-semibold mb-1">Current status: {subscription.status || 'inactive'}</div>
            <div>Renews on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} ({subscription.billingCycle === 'yearly' ? 'annual' : 'monthly'} billing)</div>
          </div>
        )}
      </div>

      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <a className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" href="/billing">Open billing</a>
          </div>
        </div>
      </footer>
    </div>
  )
}