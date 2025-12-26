'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import FilterButton from '@/components/dropdown-filter'
import Datepicker from '@/components/datepicker'

export default function Dashboard() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    loadMetrics()
  }, [token])

  async function loadMetrics() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      setMetrics(json)
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fallback dummy data if not loaded
  const stats = metrics ? {
    totalEmailsSent: metrics.metrics.totalSent,
    totalEmailsSentChange: '+5.2%',
    openRate: metrics.metrics.openRate,
    openRateChange: '-1.3%',
    replyRate: metrics.metrics.replyRate,
    replyRateChange: '+2',
    activeCampaigns: metrics.summary.activeCampaigns,
    activeCampaignsChange: '+0',
  } : {
    totalEmailsSent: 0,
    totalEmailsSentChange: '0%',
    openRate: 0,
    openRateChange: '0%',
    replyRate: 0,
    replyRateChange: '0%',
    activeCampaigns: 0,
    activeCampaignsChange: '0%',
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'draft': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      'scheduled': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      'queued': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
      'sending': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
      'completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      'paused': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    }
    return colorMap[status] || colorMap['draft']
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Dashboard actions */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Dashboard</h1>
        </div>
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <FilterButton align="right" />
          <Datepicker />
          <Link href="/campaigns/new" className="btn bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">New Campaign</span>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Emails Sent */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Emails Sent</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEmailsSent.toLocaleString()}</p>
            </div>
            <div className={`px-3 py-1 rounded text-sm font-medium ${stats.totalEmailsSentChange.startsWith('+') ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}`}>
              {stats.totalEmailsSentChange}
            </div>
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Open Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.openRate}%</p>
            </div>
            <div className={`px-3 py-1 rounded text-sm font-medium ${stats.openRateChange.startsWith('-') ? 'text-red-700 dark:text-red-200' : 'text-green-700 dark:text-green-200'}`}>
              {stats.openRateChange}
            </div>
          </div>
        </div>

        {/* Reply Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reply Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.replyRate}%</p>
            </div>
            <div className="px-3 py-1 rounded text-sm font-medium text-green-700 dark:text-green-200">
              {stats.replyRateChange}
            </div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeCampaigns}</p>
            </div>
            <div className="px-3 py-1 rounded text-sm font-medium text-gray-700 dark:text-gray-200">
              {stats.activeCampaignsChange}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Email Activity Chart - Only show if campaigns exist */}
        {!loading && metrics && metrics.metrics.totalSent > 0 ? (
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Campaign Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.metrics.totalSent.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Delivered</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.metrics.totalDelivered.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bounced</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.metrics.totalBounced.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Opened</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.metrics.totalOpened.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Clicked</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.metrics.totalClicked.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Replied</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.metrics.totalReplied.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Recent Activity - Only show if campaigns exist */}
        {!loading && metrics && metrics.recent && metrics.recent.length > 0 ? (
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${metrics.metrics.totalSent > 0 ? 'col-span-12 lg:col-span-4' : 'col-span-12 lg:col-span-4'}`}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Performing Campaigns</h2>
            <div className="space-y-4">
              {metrics.topPerforming.slice(0, 5).map((campaign: any, idx: number) => (
                <div key={idx} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                  <Link href={`/campaigns/${campaign.id}`} className="text-sm font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700">
                    {campaign.name}
                  </Link>
                  <div className="mt-1 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>Sent: {campaign.sent}</span>
                    <span>Open: {campaign.openRate.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      {/* Campaign Performance */}
      {!loading && metrics ? (
        <div className="col-span-12 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Campaigns</h2>
            <Link href="/campaigns" className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Open Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Click Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Replies</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.recent && metrics.recent.length > 0 ? (
                  metrics.recent.map((campaign: any) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/campaigns/${campaign.id}`} className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700">
                          {campaign.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.sent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.openRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.clickRate}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.replied}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">No campaigns yet. Create one to get started.</p>
                      <Link href="/campaigns/new" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium text-sm">
                        Create Campaign
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Empty State - No Campaigns */}
      {!loading && metrics && metrics.summary.totalCampaigns === 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Get started with your first campaign</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create campaigns to start sending emails to your contacts and track engagement.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/campaigns/new" className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium">
              Create Campaign
            </Link>
            <Link href="/contacts" className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
              Import Contacts
            </Link>
          </div>
        </div>
      )}

      {/* Action Buttons - Show when campaigns exist */}
      {!loading && metrics && metrics.summary.totalCampaigns > 0 && (
        <div className="mt-6 flex gap-3">
          <Link href="/campaigns/new" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm">
            New Campaign
          </Link>
          <Link href="/templates" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm">
            View Templates
          </Link>
        </div>
      )}
      </div>
    </div>
  )
}
