'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useDashboardStore } from '@/store/useDashboardStore'
import { 
  Users, 
  Mail, 
  Send, 
  TrendingUp, 
  Upload, 
  Plus,
  Activity
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { stats, recentActivity, fetchStats, fetchRecentActivity } = useDashboardStore()

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [fetchStats, fetchRecentActivity])

  const statsCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Campaigns', 
      value: stats.activeCampaigns.toLocaleString(),
      icon: Mail,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Emails Sent',
      value: stats.emailsSent.toLocaleString(),
      icon: Send,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Open Rate',
      value: `${stats.openRate}%`,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name || 'there'}
          </h1>
          <p className="mt-1 text-lg text-gray-600">
            Here's an overview of your cold email performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/campaigns/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => (
          <div key={stat.title} className="relative bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`${stat.bgColor} rounded-lg p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stats.loading ? (
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Quick Actions */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600 mt-1">Get started with your cold email campaigns</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/contacts/import"
                  className="group relative bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 hover:from-blue-100 hover:to-blue-200 transition-all"
                >
                  <div className="flex items-start">
                    <div className="bg-blue-600 rounded-lg p-3">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-700">
                        Import Contacts
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload your contact lists to start building your audience
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/campaigns/create"
                  className="group relative bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-6 hover:from-emerald-100 hover:to-emerald-200 transition-all"
                >
                  <div className="flex items-start">
                    <div className="bg-emerald-600 rounded-lg p-3">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-base font-semibold text-gray-900 group-hover:text-emerald-700">
                        Create Campaign
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Set up automated email sequences to engage prospects
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">No recent activity</h4>
                  <p className="text-sm text-gray-500">
                    Your campaign activity will appear here once you get started.
                  </p>
                </div> 
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}