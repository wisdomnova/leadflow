// ./app/(dashboard)/dashboard/page.tsx
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
  ArrowUpRight,
  Eye,
  TrendingUp,
  Target,
  FileText,
  Reply,
  Clock,
  Zap,
  MousePointer,
  CreditCard,
  Shield,
  Wifi
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

// Theme colors - consistent throughout the site
const THEME_COLORS = {
  primary: '#0f66db',     // Main blue
  success: '#25b43d',     // Green
  secondary: '#6366f1',   // Indigo
  accent: '#059669',      // Emerald
  warning: '#dc2626'      // Red
}

// Icon mapping for activity types
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'open': return { icon: Eye, color: THEME_COLORS.primary }
    case 'reply': return { icon: Reply, color: THEME_COLORS.success }
    case 'click': return { icon: MousePointer, color: THEME_COLORS.secondary }
    case 'delivery': return { icon: Send, color: THEME_COLORS.accent }
    case 'bounce': return { icon: Zap, color: THEME_COLORS.warning }
    default: return { icon: Clock, color: '#6b7280' }
  }
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { 
    stats, 
    performanceData,
    campaignData,
    funnelData,
    recentActivity,
    fetchStats, 
    fetchPerformanceData,
    fetchCampaignData,
    fetchFunnelData,
    fetchRecentActivity, 
    subscribeToRealtime, 
    unsubscribeFromRealtime,
    calculateTrialDays
  } = useDashboardStore()

  useEffect(() => {
    // Fetch all dashboard data
    fetchStats()
    fetchPerformanceData()
    fetchCampaignData()
    fetchFunnelData()
    fetchRecentActivity()

    if (user?.organization_id) {
      subscribeToRealtime(user.organization_id)
    }

    return () => {
      unsubscribeFromRealtime()
    }
  }, [fetchStats, fetchPerformanceData, fetchCampaignData, fetchFunnelData, fetchRecentActivity, subscribeToRealtime, unsubscribeFromRealtime, user?.organization_id])

  const kpiCards = [
    {
      title: 'Total Contacts',
      value: stats.totalContacts.toLocaleString(),
      icon: Users,
      color: THEME_COLORS.primary
    },
    {
      title: 'Active Campaigns', 
      value: stats.activeCampaigns.toLocaleString(),
      icon: Mail,
      color: THEME_COLORS.success
    },
    {
      title: 'Emails Sent',
      value: stats.emailsSent.toLocaleString(),
      icon: Send,
      color: THEME_COLORS.secondary
    },
    {
      title: 'Open Rate',
      value: `${stats.openRate}%`,
      icon: Eye,
      color: THEME_COLORS.accent
    },
    {
      title: 'Emails Delivered',
      value: stats.emailsDelivered.toLocaleString(),
      icon: MousePointer,
      color: THEME_COLORS.warning
    }
  ]

  // Calculate trial days remaining
  const trialDaysRemaining = user?.trial_ends_at ? calculateTrialDays(user.trial_ends_at) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.first_name || 'there'}
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Here's your campaign performance overview
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/analytics"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Advanced Analytics
              </Link>
              <Link
                href="/campaigns/create"
                className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Campaign
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {kpiCards.map((kpi, index) => {
              const Icon = kpi.icon

              return (
                <motion.div
                  key={kpi.title}
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: kpi.color }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">{kpi.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.loading ? '...' : kpi.value}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Left Column - Charts */}
          <div className="xl:col-span-3 space-y-8">
            
            {/* Charts Row - Same Height */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Performance Chart */}
              <motion.div 
                className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Email Performance</h3>
                    <p className="text-gray-600 mt-1">Opens and replies over the last 7 days</p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="h-64">
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '16px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Line type="monotone" dataKey="opens" stroke={THEME_COLORS.primary} strokeWidth={3} dot={{ fill: THEME_COLORS.primary, r: 6 }} name="Opens" />
                        <Line type="monotone" dataKey="replies" stroke={THEME_COLORS.success} strokeWidth={3} dot={{ fill: THEME_COLORS.success, r: 6 }} name="Replies" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
                        <p className="text-gray-500">Loading performance data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Live Activity - Same Height */}
              <motion.div 
                className="bg-white rounded-2xl border border-gray-200 shadow-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">Live Activity</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: THEME_COLORS.success }}></div>
                      <span className="text-sm text-gray-500 font-medium">Live</span>
                    </div>
                  </div>
                  <p className="text-gray-600">Real-time campaign updates</p>
                </div>
                
                <div className="h-64 overflow-y-auto">
                  <div className="p-6 space-y-4">
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
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h4>
                        <p className="text-gray-500 text-sm mb-4">
                          Activity will appear here once campaigns are running
                        </p>
                        <Link
                          href="/campaigns/create"
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-xl hover:shadow-lg transition-all duration-200"
                          style={{ backgroundColor: THEME_COLORS.primary }}
                        >
                          Start your first campaign
                          <ArrowUpRight className="h-4 w-4 ml-2" />
                        </Link>
                      </div> 
                    ) : (
                      recentActivity.map((activity, index) => {
                        const activityType = activity.message.toLowerCase().includes('opened') ? 'open' :
                                           activity.message.toLowerCase().includes('replied') ? 'reply' :
                                           activity.message.toLowerCase().includes('clicked') ? 'click' :
                                           activity.message.toLowerCase().includes('delivered') ? 'delivery' :
                                           activity.message.toLowerCase().includes('bounced') ? 'bounce' : 'default'
                        
                        const { icon: Icon, color } = getActivityIcon(activityType)
                        
                        return (
                          <motion.div 
                            key={activity.id} 
                            className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + (index * 0.05) }}
                          >
                            <div 
                              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: color }}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Campaign Performance */}
              <motion.div 
                className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Top Campaigns</h3>
                    <p className="text-gray-600 mt-1">Emails sent by campaign</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="h-64">
                  {campaignData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={campaignData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="emails" fill={THEME_COLORS.primary} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
                        <p className="text-gray-500">Loading campaign data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Conversion Funnel */}
              <motion.div 
                className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Conversion Funnel</h3>
                    <p className="text-gray-600 mt-1">Lead journey breakdown</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="h-64">
                  {funnelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={funnelData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {funnelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
                        <p className="text-gray-500">Loading funnel data...</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
                <p className="text-gray-600 mt-1">Accelerate your campaign workflow</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Import Contacts',
                    description: 'Upload CSV files or connect your CRM',
                    icon: Upload,
                    color: THEME_COLORS.primary,
                    href: '/contacts/import'
                  },
                  {
                    title: 'Create Campaign',
                    description: 'Build automated email sequences',
                    icon: Mail,
                    color: THEME_COLORS.success,
                    href: '/campaigns/create'
                  },
                  {
                    title: 'Email Templates',
                    description: 'Professional templates for every use case',
                    icon: FileText,
                    color: THEME_COLORS.secondary,
                    href: '/templates'
                  },
                  {
                    title: 'Campaign Performance',
                    description: 'Deep dive into your metrics',
                    icon: BarChart3,
                    color: THEME_COLORS.accent,
                    href: '/analytics'
                  }
                ].map((action, index) => {
                  const Icon = action.icon
                  
                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group relative bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:bg-white hover:shadow-md transition-all duration-300 hover:scale-105"
                    >
                      <div className="flex items-start space-x-4">
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: action.color }}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 mb-2">
                            {action.title}
                          </h4>
                          <p className="text-gray-600 mb-3">
                            {action.description}
                          </p>
                          <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                            Get started
                            <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1 space-y-8">             
            {/* Billing & System Health */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Account & System</h3>
                <p className="text-gray-600">Billing and performance status</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.secondary }}
                    >
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Current Plan</span>
                      <p className="text-xs text-gray-500 capitalize">{user?.plan_type || 'Free Trial'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {user?.subscription_status === 'trialing' && trialDaysRemaining > 0 ? (
                      <span className="text-xs font-medium" style={{ color: THEME_COLORS.warning }}>
                        {trialDaysRemaining} days left
                      </span>
                    ) : (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }} />
                    )}
                  </div>
                </div>

                {/* Email Credits */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.primary }}
                    >
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email Credits</span>
                      <p className="text-xs text-gray-500">{stats.emailsSent.toLocaleString()} used this month</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.primary }} />
                </div>

                {/* Deliverability Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.success }}
                    >
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Deliverability</span>
                      <p className="text-xs text-gray-500">{stats.openRate > 0 ? 'Good' : 'No data'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full`} style={{
                    backgroundColor: stats.openRate > 20 ? THEME_COLORS.success : 
                                   stats.openRate > 10 ? THEME_COLORS.warning : '#9ca3af'
                  }} />
                </div>

                {/* API Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: THEME_COLORS.accent }}
                    >
                      <Wifi className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">API Status</span>
                      <p className="text-xs text-gray-500">All systems operational</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: THEME_COLORS.success }} />
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href="/billing"
                    className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                    style={{ backgroundColor: THEME_COLORS.primary }}
                  >
                    Manage Billing
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>  
      </div>
    </div>
  )
}