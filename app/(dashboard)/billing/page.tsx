// ./app/(dashboard)/billing/page.tsx - Removed gradients for cleaner design

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  ExternalLink, 
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface BillingInfo {
  subscription: any
  nextBilling: string | null
  amount: number
  isLoading: boolean
}

interface UsageStats {
  contacts: { used: number; limit: number }
  campaigns: { used: number; limit: number }
  emails: { used: number; limit: number }
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

export default function BillingPage() {
  const { user } = useAuth()
  const { subscriptionStatus, planType, daysRemaining, isTrialActive } = useTrialStatus()
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    subscription: null,
    nextBilling: null,
    amount: 0,
    isLoading: true
  })
  const [usageStats, setUsageStats] = useState<UsageStats>({
    contacts: { used: 0, limit: 1000 },
    campaigns: { used: 0, limit: 10 },
    emails: { used: 0, limit: 5000 }
  })
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)

  useEffect(() => {
    fetchBillingInfo()
    fetchUsageStats()
  }, [user])

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/billing/info')
      if (response.ok) {
        const data = await response.json()
        setBillingInfo({
          subscription: data.subscription,
          nextBilling: data.nextBilling,
          amount: data.amount,
          isLoading: false
        })
      } else {
        setBillingInfo(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error('Failed to fetch billing info:', error)
      setBillingInfo(prev => ({ ...prev, isLoading: false }))
    }
  }

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/usage/stats')
      if (response.ok) {
        const data = await response.json()
        setUsageStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error)
    }
  }

  const handleManageBilling = async () => {
    setIsLoadingPortal(true)
    try {
      const response = await fetch('/api/billing/customer-portal', {
        method: 'POST'
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error)
    }
    setIsLoadingPortal(false)
  }

  const getPlanDisplayName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Free Trial' },
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      past_due: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Past Due' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.trial

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getPlanPrice = (plan: string, cycle: string) => {
    const prices = {
      starter: { monthly: 29, yearly: 290 },
      pro: { monthly: 79, yearly: 790 }
    }
    return prices[plan as keyof typeof prices]?.[cycle as keyof typeof prices.starter] || 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculatePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-blue-600'
  }

  const usageItems = [
    {
      label: 'Contacts',
      used: usageStats.contacts.used,
      limit: usageStats.contacts.limit
    },
    {
      label: 'Email Campaigns This Month',
      used: usageStats.campaigns.used,
      limit: usageStats.campaigns.limit
    },
    {
      label: 'Emails Sent This Month',
      used: usageStats.emails.used,
      limit: usageStats.emails.limit
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Billing & Subscription
          </h1>
          <p className="text-xl text-gray-600">
            Manage your subscription and billing information
          </p>
        </motion.div>

        <motion.div
          className="space-y-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Current Plan */}
          <motion.div 
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
              {getStatusBadge(subscriptionStatus)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Plan</p>
                <p className="text-2xl font-bold text-gray-900">{getPlanDisplayName(planType)}</p>
              </div>
              
              {isTrialActive ? (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600 mb-2">Trial Days Remaining</p>
                  <p className="text-2xl font-bold text-blue-900">{daysRemaining} days</p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                  <p className="text-sm font-medium text-green-600 mb-2">Billing Cycle</p>
                  <p className="text-2xl font-bold text-green-900">
                    {billingInfo.subscription?.billing_cycle ? billingInfo.subscription.billing_cycle.charAt(0).toUpperCase() + billingInfo.subscription.billing_cycle.slice(1) : 'Monthly'}
                  </p>
                </div>
              )}

              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                <p className="text-sm font-medium text-purple-600 mb-2">Status</p>
                <p className="text-2xl font-bold text-purple-900">
                  {subscriptionStatus === 'trial' ? 'Free Trial' : 'Active'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {subscriptionStatus === 'trial' ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/billing/upgrade"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    Upgrade Now
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.button
                    onClick={handleManageBilling}
                    disabled={isLoadingPortal}
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-2xl text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    {isLoadingPortal ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      'Manage Billing'
                    )}
                  </motion.button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/billing/upgrade"
                      className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                      Change Plan
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>

          {/* Usage Limits */}
          <motion.div 
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Usage & Limits</h2>

            <div className="space-y-6">
              {usageItems.map((item, index) => {
                const percentage = calculatePercentage(item.used, item.limit)
                
                return (
                  <motion.div
                    key={item.label} 
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-900 text-base">{item.label}</span>
                      <span className="text-gray-600 font-medium text-base">
                        {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${getUsageColor(percentage)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.2 }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-3 text-sm">
                      <span className={`font-medium ${
                        percentage >= 90 ? 'text-red-600' :
                        percentage >= 75 ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                        {percentage.toFixed(1)}% used
                      </span>
                      {percentage >= 90 && (
                        <span className="text-red-600 font-medium">Consider upgrading</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div 
            className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10"
            variants={staggerItem}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Billing History</h2>

            {subscriptionStatus === 'trial' ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No billing history yet</h3>
                <p className="text-gray-600 text-base">Your free trial is currently active.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {billingInfo.isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : billingInfo.subscription ? (
                  <motion.div 
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          LeadFlow {getPlanDisplayName(planType)} - {billingInfo.subscription?.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                        </p>
                        <p className="text-gray-600 text-base mt-1">
                          Next billing: {billingInfo.nextBilling ? formatDate(billingInfo.nextBilling) : 'Processing...'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${getPlanPrice(planType, billingInfo.subscription?.billing_cycle || 'monthly')}.00
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No billing history</h3>
                    <p className="text-gray-600 text-base">Billing history will appear here once you subscribe.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}