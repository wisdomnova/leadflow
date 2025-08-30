// ./app/(dashboard)/dashboard/page.tsx - Updated with real-time data and fixed hydration

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { useDashboardStore } from '@/store/useDashboardStore'
import { 
  Users, 
  Mail, 
  Send, 
  Upload, 
  Plus,
  Activity,
  BarChart3,
  CheckCircle,
  ArrowUpRight,
  Eye
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { stats, recentActivity, fetchStats, fetchRecentActivity, subscribeToRealtime, unsubscribeFromRealtime } = useDashboardStore()

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()

    // Subscribe to real-time updates if user has organization
    if (user?.organization_id) {
      subscribeToRealtime(user.organization_id)
    }

    // Cleanup on unmount
    return () => {
      unsubscribeFromRealtime()
    }
  }, [fetchStats, fetchRecentActivity, subscribeToRealtime, unsubscribeFromRealtime, user?.organization_id])

  const statsCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Campaigns', 
      value: stats.activeCampaigns.toLocaleString(),
      icon: Mail,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Emails Sent',
      value: stats.emailsSent.toLocaleString(),
      icon: Send,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Open Rate',
      value: `${stats.openRate}%`,
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name || 'there'}
              </h1>
              <p className="mt-1 text-gray-600">
                Here's an overview of your cold email performance
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/analytics"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
              <Link
                href="/campaigns/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon

              return (
                <motion.div
                  key={stat.title}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.loading ? (
                          <span className="inline-block h-8 w-16 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          stat.value
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Quick Actions */}
          <motion.div 
            className="xl:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600 mt-1">Get started with your cold email campaigns</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Link
                    href="/contacts/import"
                    className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 mb-2">
                          Import Contacts
                        </h4>
                        <p className="text-sm text-gray-600">
                          Upload your contact lists to start building your audience
                        </p>
                        <div className="mt-3 text-xs text-blue-600 font-medium flex items-center">
                          Get started
                          <ArrowUpRight className="h-3 w-3 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/campaigns/create"
                    className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-green-700 mb-2">
                          Create Campaign
                        </h4>
                        <p className="text-sm text-gray-600">
                          Set up automated email sequences to engage prospects
                        </p>
                        <div className="mt-3 text-xs text-green-600 font-medium flex items-center">
                          Start building
                          <ArrowUpRight className="h-3 w-3 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/templates"
                    className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-purple-700 mb-2">
                          Email Templates
                        </h4>
                        <p className="text-sm text-gray-600">
                          Browse and customize email templates
                        </p>
                        <div className="mt-3 text-xs text-purple-600 font-medium flex items-center">
                          Explore templates
                          <ArrowUpRight className="h-3 w-3 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/campaigns"
                    className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-orange-700 mb-2">
                          View Campaigns
                        </h4>
                        <p className="text-sm text-gray-600">
                          Monitor and manage your active campaigns
                        </p>
                        <div className="mt-3 text-xs text-orange-600 font-medium flex items-center">
                          View all
                          <ArrowUpRight className="h-3 w-3 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="xl:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <motion.div 
                      className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      <Activity className="h-8 w-8 text-gray-400" />
                    </motion.div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">No recent activity</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Your campaign activity will appear here once you get started.
                    </p>
                    <Link
                      href="/campaigns/create"
                      className="inline-flex items-center mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create your first campaign
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Link>
                  </div> 
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div 
                        key={activity.id} 
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <div className="flex items-center mt-1">
                            <p className="text-xs text-gray-500">{activity.timestamp}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div className="pt-4 border-t border-gray-100">
                      <Link
                        href="/activity"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
                      >
                        View all activity
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div> 
      </div>
    </div>
  )
}