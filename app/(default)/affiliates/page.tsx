'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AffiliatesPage() {
  const [copied, setCopied] = useState(false)

  const referralLink = 'https://leadflow.com/ref/john123'

  const stats = [
    { label: 'Total Earnings', value: '$2,847', icon: 'earnings' },
    { label: 'Referrals', value: '23', icon: 'referrals' },
    { label: 'Active Subscriptions', value: '18', icon: 'check' },
    { label: 'Commission Rate', value: '15%', icon: 'chart' },
  ]

  const renderIcon = (iconType: string) => {
    const iconProps = 'w-8 h-8 text-violet-600 dark:text-violet-400'
    switch (iconType) {
      case 'earnings':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'referrals':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'check':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'chart':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return null
    }
  }

  const renderResourceIcon = (iconType: string) => {
    const iconProps = 'w-6 h-6 text-violet-600 dark:text-violet-400'
    switch (iconType) {
      case 'image':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'email':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'share':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C9.589 12.938 10 12.502 10 12c0-.502-.411-.938-1.316-1.342m0 2.684a3 3 0 110-2.684m9.108-3.342c.589.591 1.5 1.485 1.5 3.342 0 1.857-.911 2.751-1.5 3.342m0-6.684a9 9 0 110 6.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const recentReferrals = [
    {
      name: 'Sarah Johnson',
      date: 'Nov 2, 2025',
      plan: 'Professional',
      status: 'Active',
      earnings: 29.85,
    },
    {
      name: 'Michael Chen',
      date: 'Oct 28, 2025',
      plan: 'Professional',
      status: 'Active',
      earnings: 29.85,
    },
    {
      name: 'Emily Davis',
      date: 'Oct 25, 2025',
      plan: 'Business',
      status: 'Active',
      earnings: 89.85,
    },
    {
      name: 'David Brown',
      date: 'Oct 20, 2025',
      plan: 'Business',
      status: 'Active',
      earnings: 89.85,
    },
    {
      name: 'Lisa Wang',
      date: 'Oct 15, 2025',
      plan: 'Professional',
      status: 'Trial',
      earnings: 0.00,
    },
  ]

  const payouts = [
    {
      amount: 847.50,
      date: 'Oct 1, 2025',
      method: 'PayPal',
      status: 'Paid',
    },
    {
      amount: 612.30,
      date: 'Sep 1, 2025',
      method: 'PayPal',
      status: 'Paid',
    },
    {
      amount: 523.80,
      date: 'Aug 1, 2025',
      method: 'Bank Transfer',
      status: 'Paid',
    },
  ]

  const marketingResources = [
    {
      title: 'Banner Images',
      description: 'Download promotional banners',
      icon: 'image',
      action: 'Download',
    },
    {
      title: 'Email Templates',
      description: 'Ready-to-use email copy',
      icon: 'email',
      action: 'Download',
    },
    {
      title: 'Social Media Kit',
      description: 'Graphics for social platforms',
      icon: 'share',
      action: 'Download',
    },
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Affiliate Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your referrals and earnings</p>
        </div>
        <button className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors">
          View Resources
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className="opacity-80">
                {renderIcon(stat.icon)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Link Section */}
      <div className="mb-8 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Referral Link</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
          />
          <button
            onClick={handleCopyLink}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Referrals and Payouts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Referrals */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Referrals</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Plan</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReferrals.map((referral, idx) => (
                    <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{referral.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{referral.date}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">{referral.plan}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          referral.status === 'Active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                        ${referral.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payout History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Payout History</h2>

            <div className="space-y-4 mb-6">
              {payouts.map((payout, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">$</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">${payout.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{payout.date} • {payout.method}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>

            <button className="w-full py-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium text-sm transition-colors">
              View All Payouts
            </button>
          </div>
        </div>

        {/* Marketing Resources */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Marketing Resources</h2>

            <div className="space-y-4">
              {marketingResources.map((resource, idx) => (
                <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    {renderResourceIcon(resource.icon)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{resource.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{resource.description}</p>
                    </div>
                  </div>
                  <button className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-xs transition-colors">
                    {resource.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
