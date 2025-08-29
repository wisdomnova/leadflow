// ./components/campaigns/CampaignAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Mail, Eye, MousePointer, AlertTriangle, TrendingUp, Users, Ban } from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalContacts: number
    totalSent: number
    uniqueOpens: number
    uniqueClicks: number
    totalBounced: number
    totalComplaints: number
    totalUnsubscribed: number
  }
  rates: {
    deliveryRate: number
    openRate: number
    clickRate: number
    clickToOpenRate: number
    bounceRate: number
    complaintRate: number
    unsubscribeRate: number
  }
  contactsByStatus: Record<string, number>
  eventsByType: Record<string, number>
  dailyActivity: Record<string, any>
}

interface CampaignAnalyticsProps {
  campaignId: string
}

export default function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [campaignId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/campaigns/${campaignId}/analytics`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)

    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-6 w-1/3"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-8">No analytics data available</p>
      </div>
    )
  }

  const overviewMetrics = [
    {
      label: 'Total Contacts',
      value: analytics.overview.totalContacts,
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      label: 'Emails Sent',
      value: analytics.overview.totalSent,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Unique Opens',
      value: analytics.overview.uniqueOpens,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Unique Clicks',
      value: analytics.overview.uniqueClicks,
      icon: MousePointer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const rateMetrics = [
    {
      label: 'Delivery Rate',
      value: `${analytics.rates.deliveryRate}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Open Rate',
      value: `${analytics.rates.openRate}%`,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Click Rate',
      value: `${analytics.rates.clickRate}%`,
      icon: MousePointer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Bounce Rate',
      value: `${analytics.rates.bounceRate}%`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewMetrics.map((metric, index) => (
            <div key={index} className={`${metric.bgColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Rates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Rates</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {rateMetrics.map((metric, index) => (
            <div key={index} className={`${metric.bgColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Metrics */}
      {(analytics.overview.totalComplaints > 0 || analytics.overview.totalUnsubscribed > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.overview.totalComplaints > 0 && (
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.overview.totalComplaints}
                </div>
                <div className="text-sm text-gray-600">
                  Complaints ({analytics.rates.complaintRate}%)
                </div>
              </div>
            )}
            
            {analytics.overview.totalUnsubscribed > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Ban className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics.overview.totalUnsubscribed}
                </div>
                <div className="text-sm text-gray-600">
                  Unsubscribed ({analytics.rates.unsubscribeRate}%)
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {analytics.rates.clickToOpenRate}%
              </div>
              <div className="text-sm text-gray-600">
                Click-to-Open Rate
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}