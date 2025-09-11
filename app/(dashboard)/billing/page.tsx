// ./app/(dashboard)/billing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { motion, AnimatePresence } from 'framer-motion'
import {  
  CreditCard, 
  ExternalLink, 
  AlertCircle,
  Calendar,
  TrendingUp,
  Users,
  Mail,
  Target,
  Clock,
  CheckCircle,
  ArrowUpRight
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
      trial: { bg: `${THEME_COLORS.primary}20`, text: THEME_COLORS.primary, label: 'Free Trial' },
      active: { bg: `${THEME_COLORS.success}20`, text: THEME_COLORS.success, label: 'Active' },
      cancelled: { bg: `${THEME_COLORS.warning}20`, text: THEME_COLORS.warning, label: 'Cancelled' },
      past_due: { bg: '#fef3c7', text: '#d97706', label: 'Past Due' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.trial

    return (
      <span 
        className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
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
    if (percentage >= 90) return THEME_COLORS.warning
    if (percentage >= 75) return '#d97706'
    return THEME_COLORS.primary
  }

  const usageItems = [
    {
      label: 'Contacts',
      used: usageStats.contacts.used,
      limit: usageStats.contacts.limit,
      icon: Users,
      color: THEME_COLORS.primary
    },
    {
      label: 'Email Campaigns This Month',
      used: usageStats.campaigns.used,
      limit: usageStats.campaigns.limit,
      icon: Target,
      color: THEME_COLORS.success
    },
    {
      label: 'Emails Sent This Month',
      used: usageStats.emails.used,
      limit: usageStats.emails.limit,
      icon: Mail,
      color: THEME_COLORS.secondary
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-lg text-gray-600">
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
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md"
                  style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                >
                  <CreditCard className="h-6 w-6" style={{ color: THEME_COLORS.primary }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
                  <p className="text-gray-600">Your subscription details and status</p>
                </div>
              </div>
              {getStatusBadge(subscriptionStatus)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                    style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                  >
                    <TrendingUp className="h-5 w-5" style={{ color: THEME_COLORS.primary }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Plan</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{getPlanDisplayName(planType)}</p>
              </div>
              
              {isTrialActive ? (
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                      style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                    >
                      <Clock className="h-5 w-5" style={{ color: THEME_COLORS.primary }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: THEME_COLORS.primary }}>Trial Days Remaining</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: THEME_COLORS.primary }}>{daysRemaining} days</p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                      style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                    >
                      <Calendar className="h-5 w-5" style={{ color: THEME_COLORS.success }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: THEME_COLORS.success }}>Billing Cycle</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: THEME_COLORS.success }}>
                    {billingInfo.subscription?.billing_cycle ? billingInfo.subscription.billing_cycle.charAt(0).toUpperCase() + billingInfo.subscription.billing_cycle.slice(1) : 'Monthly'}
                  </p>
                </div>
              )}

              <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                    style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}
                  >
                    <CheckCircle className="h-5 w-5" style={{ color: THEME_COLORS.secondary }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: THEME_COLORS.secondary }}>Status</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: THEME_COLORS.secondary }}>
                  {subscriptionStatus === 'trial' ? 'Free Trial' : 'Active'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {subscriptionStatus === 'trial' ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/billing/upgrade"
                    className="inline-flex items-center justify-center px-8 py-3 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Upgrade Now
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </motion.div>
              ) : (
                <>
                  <motion.button
                    onClick={handleManageBilling}
                    disabled={isLoadingPortal}
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50 font-medium"
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
                      className="inline-flex items-center justify-center px-6 py-3 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                      style={{ backgroundColor: THEME_COLORS.primary }}
                    >
                      Change Plan
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>

          {/* Usage Limits */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.accent}20` }}
              >
                <TrendingUp className="h-6 w-6" style={{ color: THEME_COLORS.accent }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Usage & Limits</h2>
                <p className="text-gray-600">Track your current usage against plan limits</p>
              </div>
            </div>

            <div className="space-y-6">
              {usageItems.map((item, index) => {
                const percentage = calculatePercentage(item.used, item.limit)
                const Icon = item.icon
                
                return (
                  <motion.div
                    key={item.label} 
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-sm"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: item.color }} />
                        </div>
                        <span className="font-semibold text-gray-900">{item.label}</span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ backgroundColor: getUsageColor(percentage) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.2 }}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-3 text-sm">
                      <span 
                        className="font-medium"
                        style={{ 
                          color: percentage >= 90 ? THEME_COLORS.warning :
                                 percentage >= 75 ? '#d97706' :
                                 '#6b7280'
                        }}
                      >
                        {percentage.toFixed(1)}% used
                      </span>
                      {percentage >= 90 && (
                        <span className="font-medium" style={{ color: THEME_COLORS.warning }}>
                          Consider upgrading
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div 
            className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
            variants={staggerItem}
          >
            <div className="flex items-center mb-8">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 shadow-md"
                style={{ backgroundColor: `${THEME_COLORS.secondary}20` }}
              >
                <Calendar className="h-6 w-6" style={{ color: THEME_COLORS.secondary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Billing History</h2>
                <p className="text-gray-600">View your past invoices and payments</p>
              </div>
            </div>

            {subscriptionStatus === 'trial' ? (
              <div className="text-center py-12">
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md"
                  style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                >
                  <AlertCircle className="h-10 w-10" style={{ color: THEME_COLORS.primary }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No billing history yet</h3>
                <p className="text-gray-600">Your free trial is currently active. Billing history will appear here once you subscribe.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {billingInfo.isLoading ? (
                  <div className="text-center py-8">
                    <div 
                      className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                      style={{ borderColor: THEME_COLORS.primary }}
                    ></div>
                  </div>
                ) : billingInfo.subscription ? (
                  <motion.div 
                    className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm"
                          style={{ backgroundColor: `${THEME_COLORS.success}20` }}
                        >
                          <CheckCircle className="h-6 w-6" style={{ color: THEME_COLORS.success }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            LeadFlow {getPlanDisplayName(planType)} - {billingInfo.subscription?.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                          </p>
                          <p className="text-gray-600 mt-1">
                            Next billing: {billingInfo.nextBilling ? formatDate(billingInfo.nextBilling) : 'Processing...'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${getPlanPrice(planType, billingInfo.subscription?.billing_cycle || 'monthly')}.00
                        </p>
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-semibold mt-2 shadow-sm"
                          style={{ backgroundColor: `${THEME_COLORS.success}20`, color: THEME_COLORS.success }}
                        >
                          Paid
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <div 
                      className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md"
                      style={{ backgroundColor: `${THEME_COLORS.primary}20` }}
                    >
                      <AlertCircle className="h-10 w-10" style={{ color: THEME_COLORS.primary }} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No billing history</h3>
                    <p className="text-gray-600">Billing history will appear here once you subscribe.</p>
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