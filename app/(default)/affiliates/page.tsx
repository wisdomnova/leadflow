'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AffiliateDashboard {
  referralCode: string
  currentTier: string
  activeReferrals: number
  discountPercentage: number
  monthlySavings: number
  affiliateStatus: string
  referralsSummary: {
    total: number
    active: number
    pending: number
    churned: number
  }
  nextTierThreshold: {
    nextTier: string
    referralsNeeded: number
  }
}

interface AffiliateStats {
  referrals: Array<{
    id: string
    email: string
    name: string
    signupDate: string
    status: string
    qualificationDate: string
  }>
  stats: {
    total: number
    active: number
    pending: number
    churned: number
  }
  pagination: {
    page: number
    limit: number
    pages: number
    total: number
  }
}

export default function AffiliatesPage() {
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [currentPage])

  async function fetchData() {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')

      if (!token) {
        setError('Not authenticated')
        return
      }

      // Fetch dashboard
      const dashRes = await fetch('/api/affiliates/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!dashRes.ok) {
        throw new Error('Failed to fetch dashboard')
      }

      const dashData = await dashRes.json()
      setDashboard(dashData)

      // Fetch stats
      const statsRes = await fetch(`/api/affiliates/stats?page=${currentPage}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!statsRes.ok) {
        throw new Error('Failed to fetch stats')
      }

      const statsData = await statsRes.json()
      setStats(statsData)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    if (dashboard?.referralCode) {
      navigator.clipboard.writeText(dashboard.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    starter: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
    tier1: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
    tier2: { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
    tier3: { bg: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-200' },
  }

  const tierDescriptions: Record<string, string> = {
    starter: 'Entry tier - 100% discount on Starter plan',
    tier1: '1-5 referrals - 50% discount on Starter',
    tier2: '6-10 referrals - FREE Starter plan',
    tier3: '11+ referrals - FREE Professional plan',
  }

  const tierBadges: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    churned: { color: 'bg-red-100 text-red-800', label: 'Churned' },
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    )
  }

  if (!dashboard || !stats || (stats.stats?.total ?? 0) === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Affiliate Program</h1>
          <p className="text-gray-600 dark:text-gray-400">Earn discounts by referring others. Share your unique code and watch your savings grow.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">No referrals yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Share your referral link to see performance here. Once you get signups, this dashboard will populate automatically.</p>
        </div>
      </div>
    )
  }

  const colors = tierColors[dashboard.currentTier] || tierColors.starter

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Affiliate Program
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Earn discounts by referring others. Share your unique code and watch your savings grow.
        </p>
      </div>

      {/* Current Tier Card */}
      <div className={`border rounded-lg p-6 mb-8 ${colors.bg} ${colors.border}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Tier</p>
            <h2 className={`text-2xl font-bold capitalize ${colors.text}`}>
              {dashboard.currentTier === 'tier1'
                ? 'Tier 1'
                : dashboard.currentTier === 'tier2'
                  ? 'Tier 2'
                  : dashboard.currentTier === 'tier3'
                    ? 'Tier 3'
                    : dashboard.currentTier}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Savings</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${dashboard.monthlySavings.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">{tierDescriptions[dashboard.currentTier]}</p>

        {dashboard.nextTierThreshold.referralsNeeded > 0 && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            <p className="text-sm font-medium">
              {dashboard.nextTierThreshold.referralsNeeded} more referrals to reach{' '}
              <span className="capitalize font-bold">
                {dashboard.nextTierThreshold.nextTier === 'tier1'
                  ? 'Tier 1'
                  : dashboard.nextTierThreshold.nextTier === 'tier2'
                    ? 'Tier 2'
                    : 'Tier 3'}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Referral Code Card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg font-mono text-gray-900 dark:text-white break-all">
            {dashboard.referralCode}
          </code>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
          Share this code with potential users. They'll get a discount, and you'll earn rewards.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Referrals</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {dashboard.referralsSummary.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {dashboard.referralsSummary.active}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending (30 days)</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {dashboard.referralsSummary.pending}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Churned</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {dashboard.referralsSummary.churned}
          </p>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
        </div>

        {stats?.referrals && stats.referrals.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Signup Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {stats.referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {referral.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {referral.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(referral.signupDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            tierBadges[referral.status]?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tierBadges[referral.status]?.label || referral.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {stats.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * stats.pagination.limit + 1}-
                  {Math.min(currentPage * stats.pagination.limit, stats.pagination.total)} of{' '}
                  {stats.pagination.total} referrals
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(stats.pagination.pages, currentPage + 1))}
                    disabled={currentPage === stats.pagination.pages}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No referrals yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Share your code with others to start earning discounts
            </p>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">How It Works</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>✓ Share your unique referral code</li>
            <li>✓ User signs up and completes first payment</li>
            <li>✓ After 30 days of active subscription, you earn the discount</li>
            <li>✓ Discount applies automatically to your next billing cycle</li>
          </ul>
        </div>

        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
          <h3 className="font-bold text-violet-900 dark:text-violet-100 mb-2">Important</h3>
          <ul className="text-sm text-violet-800 dark:text-violet-200 space-y-2">
            <li>• Only active, paid subscriptions count</li>
            <li>• Discounts are soft-downgraded if referrals drop</li>
            <li>• Changes apply on your next billing cycle</li>
            <li>• No cash payouts, discount-based rewards only</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
