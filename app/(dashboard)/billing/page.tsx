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

export default function BillingPage() {
  const { user } = useAuth();
  const { subscriptionStatus, planType, daysRemaining, isTrialActive } = useTrialStatus()
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    subscription: null,
    nextBilling: null,
    amount: 0,
    isLoading: true
  })
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)

  useEffect(() => {
    fetchBillingInfo()
  }, [])

  const fetchBillingInfo = async () => {
    try {
      // You'll implement this API route to get billing info
      setBillingInfo(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      console.error('Failed to fetch billing info:', error)
      setBillingInfo(prev => ({ ...prev, isLoading: false }))
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
              <p className="text-lg font-semibold text-gray-900">Monthly</p>
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
              Upgrade to Pro
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
              <span className="text-gray-500">245 / 1,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24.5%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Email Campaigns This Month</span>
              <span className="text-gray-500">3 / 10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Emails Sent This Month</span>
              <span className="text-gray-500">1,250 / 5,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
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
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">LeadFlow Pro - Monthly</p>
                <p className="text-sm text-gray-500">Dec 1, 2024</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">$29.00</p>
                <p className="text-sm text-green-600">Paid</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}