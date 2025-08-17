'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { CreditCard, Calendar, DollarSign, AlertCircle, ExternalLink, Check } from 'lucide-react'
import Link from 'next/link'
import TrialBanner from '@/components/TrialBanner'

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
    const statusStyles = {
      trial: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'trial' ? 'Free Trial' : status.replace('_', ' ').toUpperCase()}
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-2 text-gray-600">Manage your subscription and billing information</p>
      </div>

      <TrialBanner />

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Current Plan
          </h2>
          {getStatusBadge(subscriptionStatus)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Plan</p>
            <p className="text-lg font-semibold text-gray-900">{getPlanDisplayName(planType)}</p>
          </div>
          
          {isTrialActive ? (
            <div>
              <p className="text-sm font-medium text-gray-500">Trial Days Remaining</p>
              <p className="text-lg font-semibold text-gray-900">{daysRemaining} days</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-500">Billing Cycle</p>
              <p className="text-lg font-semibold text-gray-900">
                {billingInfo.subscription?.billing_cycle ? billingInfo.subscription.billing_cycle.charAt(0).toUpperCase() + billingInfo.subscription.billing_cycle.slice(1) : 'Monthly'}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className="text-lg font-semibold text-gray-900">
              {subscriptionStatus === 'trial' ? 'Free Trial' : 'Active'}
            </p>
          </div>
        </div>

        {subscriptionStatus === 'trial' ? (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/billing/upgrade"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upgrade Now
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleManageBilling}
              disabled={isLoadingPortal}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isLoadingPortal ? 'Loading...' : 'Manage Billing'}
            </button>
            <Link
              href="/billing/upgrade"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Change Plan
            </Link>
          </div>
        )}
      </div>

      {/* Usage Limits */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
          Usage & Limits
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Contacts</span>
              <span className="text-gray-500">
                {usageStats.contacts.used.toLocaleString()} / {usageStats.contacts.limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${calculatePercentage(usageStats.contacts.used, usageStats.contacts.limit)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Email Campaigns This Month</span>
              <span className="text-gray-500">
                {usageStats.campaigns.used} / {usageStats.campaigns.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${calculatePercentage(usageStats.campaigns.used, usageStats.campaigns.limit)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Emails Sent This Month</span>
              <span className="text-gray-500">
                {usageStats.emails.used.toLocaleString()} / {usageStats.emails.limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${calculatePercentage(usageStats.emails.used, usageStats.emails.limit)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Billing History
        </h2>

        {subscriptionStatus === 'trial' ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No billing history yet. Your free trial is currently active.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {billingInfo.isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : billingInfo.subscription ? (
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">
                    LeadFlow {getPlanDisplayName(planType)} - {billingInfo.subscription?.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Till {billingInfo.nextBilling ? formatDate(billingInfo.nextBilling) : 'Processing...'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${getPlanPrice(planType, billingInfo.subscription?.billing_cycle || 'monthly')}.00
                  </p>
                  <p className="text-sm text-green-600">Paid</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No billing history available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}