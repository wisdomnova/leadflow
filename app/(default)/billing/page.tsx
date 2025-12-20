'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [paymentMethodsList, setPaymentMethodsList] = useState<any[]>([])
  const [invoicesList, setInvoicesList] = useState<any[]>([])
  const [billingInfo, setBillingInfo] = useState<any>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/auth/signin')
        return
      }

      const [subRes, pmRes, invRes, infoRes] = await Promise.all([
        fetch('/api/billing/subscription', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/billing/payment-methods', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/billing/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/billing/info', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData)
      }
      if (pmRes.ok) {
        const pmData = await pmRes.json()
        setPaymentMethodsList(pmData.paymentMethods || [])
      }
      if (invRes.ok) {
        const invData = await invRes.json()
        setInvoicesList(invData.invoices || [])
      }
      if (infoRes.ok) {
        const infoData = await infoRes.json()
        setBillingInfo(infoData.billingInfo)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradePlan = async (planId: string) => {
    try {
      setUpgrading(planId)
      const token = localStorage.getItem('auth_token')
      
      const res = await fetch('/api/billing/upgrade-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          billingCycle,
        }),
      })

      const data = await res.json()

      if (res.ok && data.sessionUrl) {
        if (data.free) {
          // Free plan - redirect directly
          router.push(data.sessionUrl)
        } else {
          // Redirect to Stripe checkout
          window.location.href = data.sessionUrl
        }
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
    } finally {
      setUpgrading(null)
    }
  }

  const currentPlan = subscription?.currentPlan || {
    name: 'Trial',
    status: 'Active',
    cost: 0,
    nextBillingDate: 'N/A',
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individual sales professionals',
      monthlyPrice: 29,
      annualPrice: 278,
      emailsPerMonth: '10,000',
      features: [
        '1 user, unlimited sending domains',
        '10,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Email & chat support',
      ],
      badge: null,
      isCurrent: false,
      action: 'Downgrade',
    },
    {
      id: 'growth',
      name: 'Growth',
      description: 'Best for growing sales teams',
      monthlyPrice: 99,
      annualPrice: 950,
      emailsPerMonth: '100,000',
      features: [
        '3 users, unlimited sending domains',
        '100,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Priority support (chat + email)',
      ],
      badge: 'Most Popular',
      isCurrent: true,
      action: 'Current Plan',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For enterprise teams at scale',
      monthlyPrice: 299,
      annualPrice: 2870,
      emailsPerMonth: '500,000',
      features: [
        '10 users, unlimited sending domains',
        '500,000 emails/month',
        'Unlimited AI generator & personalization',
        'AI subject lines & follow-up suggestions',
        'Central inbox (Unibox)',
        'Advanced analytics dashboard',
        'Dedicated account manager + premium support',
      ],
      badge: 'Best Value',
      isCurrent: false,
      action: 'Upgrade',
    },
  ]

  const paymentMethods = paymentMethodsList || []

  const billingInfoData = billingInfo || {
    companyName: 'Loading...',
    email: 'Loading...',
    address: 'Loading...',
    taxId: 'Loading...',
  }

  const invoices = invoicesList || []

  const currentPrice = billingCycle === 'monthly' ? currentPlan.cost : Math.round(currentPlan.cost * 12 * 0.8)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your plan, payment methods, and invoices</p>
      </div>

      {/* Current Plan Section */}
      <div className="mb-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white mb-3">
              {currentPlan.status}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Current Plan</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">You're currently on the {currentPlan.name} plan</p>
          </div>
          <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">
            Cancel Subscription
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{currentPlan?.name || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${currentPrice}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Next Billing Date</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{subscription?.subscription.currentPeriodEnd ? new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Plans</h2>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1 rounded font-medium text-sm transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1 rounded font-medium text-sm transition-colors flex items-center gap-2 ${
                billingCycle === 'annual'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Annual
              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs px-2 py-0.5 rounded">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border transition-all ${
                plan.isCurrent
                  ? 'border-violet-500 bg-white dark:bg-gray-800 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg'
              }`}
            >
              <div className="p-6">
                {plan.badge && (
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      plan.badge === 'Most Popular'
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/mo</span>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{plan.emailsPerMonth} emails/month</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => !plan.isCurrent && handleUpgradePlan(plan.id)}
                  disabled={plan.isCurrent || upgrading === plan.id}
                  className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                    plan.isCurrent
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 cursor-default'
                      : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}>
                  {upgrading === plan.id ? 'Processing...' : plan.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Methods</h2>
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
                Add New
              </button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{method.type.slice(0, 1)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{method.type} •••• {method.last4}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Expires {method.expires}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {method.isDefault ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                        Default
                      </span>
                    ) : (
                      <button className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Billing Information</h2>
              <button className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Company Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{billingInfoData.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Billing Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{billingInfoData.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-line">{billingInfoData.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tax ID</p>
                <p className="font-medium text-gray-900 dark:text-white">{billingInfoData.taxId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Switch to annual billing to save 20% on your subscription. You can always change back to monthly.
            </p>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Billing History</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Invoice ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, idx) => (
                <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">{invoice.date}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">${invoice.amount.toFixed(2)}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <button 
                      onClick={() => invoice.invoiceUrl && window.open(invoice.invoiceUrl, '_blank')}
                      disabled={!invoice.invoiceUrl}
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                      {invoice.invoiceUrl ? 'Download' : 'N/A'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
