// ./app/(dashboard)/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Mail, 
  Eye, 
  MousePointer, 
  Reply,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Target,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Shield,
  ChevronDown
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
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'

// Theme colors - consistent with dashboard
const THEME_COLORS = {
  primary: '#0f66db',
  success: '#25b43d',
  secondary: '#6366f1',
  accent: '#059669',
  warning: '#dc2626',
  gray: '#6b7280'
}

interface GlobalMetrics {
  totalSent: number
  totalDelivered: number
  totalOpened: number
  totalClicked: number
  totalBounced: number
  deliveryRate: number
  openRate: number
  clickRate: number
  bounceRate: number
}

interface CampaignPerformance {
  id: string
  name: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  deliveryRate: number
  openRate: number
  clickRate: number
}

interface TimeSeriesData {
  date: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
}

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const [timeRange, setTimeRange] = useState('7d')
  const [timeRangeOpen, setTimeRangeOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0
  })
  
  const [previousMetrics, setPreviousMetrics] = useState<GlobalMetrics>({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0
  })
  
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([])
  const [engagementFunnel, setEngagementFunnel] = useState<any[]>([])

  // Fetch all analytics data
  const fetchAnalyticsData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const [
        globalResponse,
        previousResponse,
        timeSeriesResponse,
        campaignResponse
      ] = await Promise.all([
        fetch(`/api/analytics/global-metrics?timeRange=${timeRange}`),
        fetch(`/api/analytics/global-metrics?timeRange=${timeRange}&previous=true`),
        fetch(`/api/analytics/time-series?timeRange=${timeRange}`),
        fetch(`/api/analytics/campaign-performance?timeRange=${timeRange}`)
      ])

      if (globalResponse.ok) {
        const data = await globalResponse.json()
        setGlobalMetrics(data)
      }

      if (previousResponse.ok) {
        const data = await previousResponse.json()
        setPreviousMetrics(data)
      }

      if (timeSeriesResponse.ok) {
        const data = await timeSeriesResponse.json()
        setTimeSeriesData(data)
      }

      if (campaignResponse.ok) {
        const data = await campaignResponse.json()
        setCampaignPerformance(data)
        
        // Create engagement funnel from campaign data
        if (data.length > 0) {
          const totals = data.reduce((acc: any, campaign: CampaignPerformance) => ({
            sent: acc.sent + campaign.sent,
            delivered: acc.delivered + campaign.delivered,
            opened: acc.opened + campaign.opened,
            clicked: acc.clicked + campaign.clicked
          }), { sent: 0, delivered: 0, opened: 0, clicked: 0 })

          setEngagementFunnel([
            { name: 'Emails Sent', value: totals.sent, fill: THEME_COLORS.gray },
            { name: 'Delivered', value: totals.delivered, fill: THEME_COLORS.primary },
            { name: 'Opened', value: totals.opened, fill: THEME_COLORS.secondary },
            { name: 'Clicked', value: totals.clicked, fill: THEME_COLORS.success }
          ])
        }
      }

    } catch (error) {
      console.error('Analytics fetch error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(change), isPositive: change >= 0 }
  }

  const metricCards = [
    {
      title: 'Total Emails Sent',
      value: globalMetrics.totalSent.toLocaleString(),
      change: calculateChange(globalMetrics.totalSent, previousMetrics.totalSent),
      icon: Send,
      color: THEME_COLORS.primary
    },
    {
      title: 'Delivery Rate',
      value: `${globalMetrics.deliveryRate}%`,
      change: calculateChange(globalMetrics.deliveryRate, previousMetrics.deliveryRate),
      icon: CheckCircle,
      color: THEME_COLORS.success
    },
    {
      title: 'Open Rate',
      value: `${globalMetrics.openRate}%`,
      change: calculateChange(globalMetrics.openRate, previousMetrics.openRate),
      icon: Eye,
      color: THEME_COLORS.secondary
    },
    {
      title: 'Click Rate',
      value: `${globalMetrics.clickRate}%`,
      change: calculateChange(globalMetrics.clickRate, previousMetrics.clickRate),
      icon: MousePointer,
      color: THEME_COLORS.accent
    },
    {
      title: 'Bounce Rate',
      value: `${globalMetrics.bounceRate}%`,
      change: calculateChange(globalMetrics.bounceRate, previousMetrics.bounceRate),
      icon: AlertTriangle,
      color: THEME_COLORS.warning,
      invertChange: true // Lower bounce rate is better
    }
  ]

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ]

  const selectedTimeRangeLabel = timeRangeOptions.find(option => option.value === timeRange)?.label || '7 Days'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Deep insights into your email campaign performance
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Custom Time Range Selector */}
              <div className="relative">
                <button
                  onClick={() => setTimeRangeOpen(!timeRangeOpen)}
                  className="inline-flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32 transition-all duration-200"
                >
                  <span>{selectedTimeRangeLabel}</span>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${timeRangeOpen ? 'rotate-180' : ''}`} />
                </button>

                {timeRangeOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="py-2">
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRange(option.value)
                            setTimeRangeOpen(false)
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                            timeRange === option.value 
                              ? 'text-blue-600 bg-blue-50 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => fetchAnalyticsData(true)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              {/* Export Button */}
              <button className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white hover:shadow-lg transition-all duration-200"
                style={{ backgroundColor: THEME_COLORS.primary }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {metricCards.map((metric, index) => {
              const Icon = metric.icon
              const isPositiveChange = metric.invertChange ? !metric.change.isPositive : metric.change.isPositive

              return (
                <motion.div
                  key={metric.title}
                  className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 group hover:scale-105"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: metric.color }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    {metric.change.value > 0 && (
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        isPositiveChange 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isPositiveChange ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{metric.change.value.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    {metric.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : metric.value}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Left Column - Main Charts */}
          <div className="xl:col-span-3 space-y-8">
            
            {/* Time Series Performance Chart */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Email Performance Trends</h3>
                  <p className="text-gray-600 mt-1">Delivery, opens, and clicks over time</p>
                </div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: THEME_COLORS.primary }}
                >
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div className="h-96">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeSeriesData}>
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
                      <Area type="monotone" dataKey="delivered" stackId="1" stroke={THEME_COLORS.primary} fill={`${THEME_COLORS.primary}20`} name="Delivered" />
                      <Line type="monotone" dataKey="opened" stroke={THEME_COLORS.secondary} strokeWidth={3} dot={{ fill: THEME_COLORS.secondary, r: 4 }} name="Opened" />
                      <Line type="monotone" dataKey="clicked" stroke={THEME_COLORS.success} strokeWidth={3} dot={{ fill: THEME_COLORS.success, r: 4 }} name="Clicked" />
                      <Line type="monotone" dataKey="bounced" stroke={THEME_COLORS.warning} strokeWidth={2} dot={{ fill: THEME_COLORS.warning, r: 3 }} name="Bounced" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: THEME_COLORS.primary }}></div>
                      <p className="text-gray-500">Loading performance trends...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Campaign Performance & Engagement Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Campaign Performance Table */}
              <motion.div 
                className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Campaign Leaderboard</h3>
                    <p className="text-gray-600 mt-1">Top performing campaigns</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: THEME_COLORS.success }}
                  >
                    <Target className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {campaignPerformance.length > 0 ? (
                    campaignPerformance.slice(0, 8).map((campaign, index) => (
                      <motion.div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: index < 3 ? THEME_COLORS.success : THEME_COLORS.gray }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm truncate max-w-32">
                              {campaign.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {campaign.sent.toLocaleString()} sent
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold" style={{ color: THEME_COLORS.secondary }}>
                              {campaign.openRate}%
                            </span>
                            <span className="text-xs text-gray-500">open</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold" style={{ color: THEME_COLORS.success }}>
                              {campaign.clickRate}%
                            </span>
                            <span className="text-xs text-gray-500">click</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No campaign data available</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Engagement Funnel */}
              <motion.div 
                className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Engagement Funnel</h3>
                    <p className="text-gray-600 mt-1">User journey breakdown</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: THEME_COLORS.secondary }}
                  >
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {engagementFunnel.map((stage, index) => {
                    const percentage = engagementFunnel.length > 0 ? 
                      (stage.value / engagementFunnel[0].value) * 100 : 0
                    
                    return (
                      <motion.div
                        key={stage.name}
                        className="relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-gray-900">
                              {stage.value.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div
                            className="h-3 rounded-full"
                            style={{ backgroundColor: stage.fill }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </div>

            {/* Detailed Performance Metrics */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Performance Breakdown</h3>
                <p className="text-gray-600 mt-1">Detailed metrics comparison</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Delivery Success',
                    current: globalMetrics.totalDelivered,
                    total: globalMetrics.totalSent,
                    rate: globalMetrics.deliveryRate,
                    color: THEME_COLORS.primary,
                    icon: CheckCircle
                  },
                  {
                    title: 'Email Opens',
                    current: globalMetrics.totalOpened,
                    total: globalMetrics.totalDelivered,
                    rate: globalMetrics.openRate,
                    color: THEME_COLORS.secondary,
                    icon: Eye
                  },
                  {
                    title: 'Link Clicks',
                    current: globalMetrics.totalClicked,
                    total: globalMetrics.totalOpened,
                    rate: globalMetrics.clickRate,
                    color: THEME_COLORS.success,
                    icon: MousePointer
                  },
                  {
                    title: 'Bounces',
                    current: globalMetrics.totalBounced,
                    total: globalMetrics.totalSent,
                    rate: globalMetrics.bounceRate,
                    color: THEME_COLORS.warning,
                    icon: AlertTriangle
                  }
                ].map((metric, index) => {
                  const Icon = metric.icon
                  
                  return (
                    <motion.div
                      key={metric.title}
                      className="bg-gray-50 rounded-xl p-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{metric.title}</h4>
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: metric.color }}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-900">
                            {metric.current.toLocaleString()}
                          </span>
                          <span className="text-sm font-medium" style={{ color: metric.color }}>
                            {metric.rate}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{ 
                              backgroundColor: metric.color,
                              width: `${metric.rate}%`
                            }}
                          />
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          of {metric.total.toLocaleString()} total
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar - Insights & Recommendations */}
          <div className="xl:col-span-1 space-y-8">
            
            {/* Performance Insights */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Insights</h3>
                <p className="text-gray-600">AI-powered recommendations</p>
              </div>
              
              <div className="p-6 space-y-4">
                {[
                  {
                    type: globalMetrics.openRate > 25 ? 'success' : globalMetrics.openRate > 15 ? 'warning' : 'error',
                    title: 'Open Rate Analysis',
                    message: globalMetrics.openRate > 25 
                      ? `Excellent ${globalMetrics.openRate}% open rate! Your subject lines are performing well.`
                      : globalMetrics.openRate > 15 
                      ? `Good ${globalMetrics.openRate}% open rate. Consider A/B testing subject lines.`
                      : `${globalMetrics.openRate}% open rate needs improvement. Focus on subject line optimization.`,
                    icon: Eye
                  },
                  {
                    type: globalMetrics.clickRate > 3 ? 'success' : globalMetrics.clickRate > 1 ? 'warning' : 'error',
                    title: 'Click Rate Performance',
                    message: globalMetrics.clickRate > 3
                      ? `Strong ${globalMetrics.clickRate}% click rate indicates engaging content.`
                      : globalMetrics.clickRate > 1
                      ? `Average ${globalMetrics.clickRate}% click rate. Optimize your CTAs.`
                      : `Low ${globalMetrics.clickRate}% click rate. Review content relevance.`,
                    icon: MousePointer
                  },
                  {
                    type: globalMetrics.bounceRate < 2 ? 'success' : globalMetrics.bounceRate < 5 ? 'warning' : 'error',
                    title: 'List Health',
                    message: globalMetrics.bounceRate < 2
                      ? `Excellent list health with ${globalMetrics.bounceRate}% bounce rate.`
                      : globalMetrics.bounceRate < 5
                      ? `Good list health. Regular cleaning recommended.`
                      : `High ${globalMetrics.bounceRate}% bounce rate. Clean your list urgently.`,
                    icon: Shield
                  }
                ].map((insight, index) => {
                  const Icon = insight.icon
                  const bgColor = insight.type === 'success' ? 'bg-green-50' : 
                                 insight.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
                  const iconColor = insight.type === 'success' ? THEME_COLORS.success : 
                                   insight.type === 'warning' ? '#f59e0b' : THEME_COLORS.warning

                  return (
                    <motion.div
                      key={insight.title}
                      className={`p-4 rounded-xl ${bgColor}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: iconColor }}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Time Period Comparison */}
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Period Comparison</h3>
                <p className="text-gray-600">vs previous {timeRange.replace('d', ' days')}</p>
              </div>
              
              <div className="p-6 space-y-4">
                {[
                  { label: 'Emails Sent', current: globalMetrics.totalSent, previous: previousMetrics.totalSent },
                  { label: 'Open Rate', current: globalMetrics.openRate, previous: previousMetrics.openRate, suffix: '%' },
                  { label: 'Click Rate', current: globalMetrics.clickRate, previous: previousMetrics.clickRate, suffix: '%' },
                  { label: 'Bounce Rate', current: globalMetrics.bounceRate, previous: previousMetrics.bounceRate, suffix: '%', invert: true }
                ].map((comparison, index) => {
                  const change = calculateChange(comparison.current, comparison.previous)
                  const isImprovement = comparison.invert ? !change.isPositive : change.isPositive

                  return (
                    <motion.div
                      key={comparison.label}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-700">{comparison.label}</span>
                        <p className="text-lg font-bold text-gray-900">
                          {comparison.current.toLocaleString()}{comparison.suffix || ''}
                        </p>
                      </div>
                      
                      {change.value > 0 && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          isImprovement ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isImprovement ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          <span>{change.value.toFixed(1)}%</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="p-6 border-b border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Actions</h3>
                <p className="text-gray-600">Optimize your campaigns</p>
              </div>
              
              <div className="p-6 space-y-3">
                {[
                  { label: 'A/B Test Subject Lines', href: '/campaigns/create', icon: Target },
                  { label: 'Segment Your Audience', href: '/contacts', icon: Users },
                  { label: 'Clean Email List', href: '/contacts/manage', icon: Shield },
                  { label: 'Create New Campaign', href: '/campaigns/create', icon: Mail }
                ].map((action, index) => {
                  const Icon = action.icon
                  
                  return (
                    <motion.a
                      key={action.label}
                      href={action.href}
                      className="flex items-center space-x-3 p-3 bg-white rounded-xl hover:shadow-md transition-all duration-200 group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                    >
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: THEME_COLORS.primary }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                        {action.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 ml-auto" />
                    </motion.a>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}