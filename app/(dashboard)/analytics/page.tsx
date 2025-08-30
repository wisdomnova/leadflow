'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  Eye, 
  MousePointer, 
  Users, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Zap,
  Activity
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface AnalyticsData {
  overview: {
    totalEmails: number
    openRate: number
    clickRate: number
    replyRate: number
    bounceRate: number
  }
  trends: {
    dates: string[]
    emails: number[]
    opens: number[]
    clicks: number[]
    replies: number[]
  }
  campaigns: {
    name: string
    emails: number
    openRate: number
    clickRate: number
    replyRate: number
    status: 'active' | 'paused' | 'completed'
  }[]
  topPerformers: {
    subject: string
    openRate: number
    clickRate: number
    replyRate: number
  }[]
  campaignStatusBreakdown: {
    active: number
    paused: number
    completed: number
    draft: number
  }
  timeAnalysis: {
    hours: string[]
    openRates: number[]
    clickRates: number[]
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        // Fallback to mock data if API doesn't exist
        setAnalyticsData(getMockData())
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Fallback to mock data on error
      setAnalyticsData(getMockData())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getMockData = (): AnalyticsData => {
    return {
      overview: {
        totalEmails: 12847,
        openRate: 34.2,
        clickRate: 8.7,
        replyRate: 12.4,
        bounceRate: 2.1
      },
      trends: {
        dates: timeRange === '7d' 
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
          : timeRange === '30d'
          ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`)
          : timeRange === '90d'
          ? Array.from({ length: 90 }, (_, i) => `Day ${i + 1}`)
          : Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`),
        emails: timeRange === '7d'
          ? [450, 380, 520, 610, 480, 320, 280]
          : Array.from({ length: timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 12 }, 
              () => Math.floor(Math.random() * 600) + 200),
        opens: timeRange === '7d'
          ? [156, 125, 180, 210, 165, 110, 95]
          : Array.from({ length: timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 12 }, 
              () => Math.floor(Math.random() * 200) + 50),
        clicks: timeRange === '7d'
          ? [42, 35, 48, 55, 41, 28, 24]
          : Array.from({ length: timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 12 }, 
              () => Math.floor(Math.random() * 60) + 10),
        replies: timeRange === '7d'
          ? [58, 46, 67, 78, 62, 41, 35]
          : Array.from({ length: timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 12 }, 
              () => Math.floor(Math.random() * 80) + 20)
      },
      campaigns: [
        {
          name: 'Q4 Enterprise Outreach',
          emails: 3420,
          openRate: 42.3,
          clickRate: 12.1,
          replyRate: 18.7,
          status: 'active' as const
        },
        {
          name: 'SaaS Startup Follow-up',
          emails: 2180,
          openRate: 38.9,
          clickRate: 9.4,
          replyRate: 15.2,
          status: 'active' as const
        },
        {
          name: 'Product Launch Campaign',
          emails: 4850,
          openRate: 29.1,
          clickRate: 6.8,
          replyRate: 8.9,
          status: 'completed' as const
        },
        {
          name: 'Holiday Special Offer',
          emails: 1960,
          openRate: 35.6,
          clickRate: 8.3,
          replyRate: 11.4,
          status: 'paused' as const
        },
        {
          name: 'Lead Nurturing Sequence',
          emails: 437,
          openRate: 44.1,
          clickRate: 13.7,
          replyRate: 22.1,
          status: 'active' as const
        }
      ],
      topPerformers: [
        {
          subject: 'Quick question about [Company] growth plans',
          openRate: 58.3,
          clickRate: 18.7,
          replyRate: 28.4
        },
        {
          subject: 'Noticed you downloaded our whitepaper',
          openRate: 52.1,
          clickRate: 15.2,
          replyRate: 24.8
        },
        {
          subject: 'How [Company] increased revenue by 40%',
          openRate: 49.7,
          clickRate: 14.3,
          replyRate: 19.2
        },
        {
          subject: '5 minutes to discuss your Q1 goals?',
          openRate: 46.8,
          clickRate: 12.9,
          replyRate: 21.7
        }
      ],
      campaignStatusBreakdown: {
        active: 8,
        paused: 3,
        completed: 12,
        draft: 4
      },
      timeAnalysis: {
        hours: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'],
        openRates: [18.2, 28.4, 42.1, 35.7, 38.9, 31.2, 22.6, 15.8],
        clickRates: [4.1, 7.2, 12.3, 9.8, 11.4, 8.7, 6.2, 3.9]
      }
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAnalytics()
  }

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/export?range=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `analytics-${timeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      // Create a simple CSV with mock data
      const csvContent = `Date,Emails Sent,Opens,Clicks,Replies,Open Rate,Click Rate,Reply Rate
2024-01-01,450,156,42,58,34.7%,9.3%,12.9%
2024-01-02,380,125,35,46,32.9%,9.2%,12.1%
2024-01-03,520,180,48,67,34.6%,9.2%,12.9%
2024-01-04,610,210,55,78,34.4%,9.0%,12.8%
2024-01-05,480,165,41,62,34.4%,8.5%,12.9%
2024-01-06,320,110,28,41,34.4%,8.8%,12.8%
2024-01-07,280,95,24,35,33.9%,8.6%,12.5%`
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `analytics-${timeRange}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  // Chart configurations
  const lineChartData = analyticsData ? {
    labels: analyticsData.trends.dates,
    datasets: [
      {
        label: 'Emails Sent',
        data: analyticsData.trends.emails,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Opens',
        data: analyticsData.trends.opens,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Clicks',
        data: analyticsData.trends.clicks,
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Replies',
        data: analyticsData.trends.replies,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
      },
    ],
  } : null

  const campaignStatusData = analyticsData ? {
    labels: ['Active', 'Completed', 'Paused', 'Draft'],
    datasets: [
      {
        data: [
          analyticsData.campaignStatusBreakdown.active,
          analyticsData.campaignStatusBreakdown.completed,
          analyticsData.campaignStatusBreakdown.paused,
          analyticsData.campaignStatusBreakdown.draft,
        ],
        backgroundColor: [
          'rgb(16, 185, 129)',   // Green for Active
          'rgb(59, 130, 246)',   // Blue for Completed
          'rgb(245, 158, 11)',   // Yellow for Paused
          'rgb(156, 163, 175)',  // Gray for Draft
        ],
        borderWidth: 0,
      },
    ],
  } : null

  const timeAnalysisData = analyticsData ? {
    labels: analyticsData.timeAnalysis.hours,
    datasets: [
      {
        label: 'Open Rate %',
        data: analyticsData.timeAnalysis.openRates,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Click Rate %',
        data: analyticsData.timeAnalysis.clickRates,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  } : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  }

  // Stats calculations - removed percentage formatting
  const stats = [
    {
      label: 'Total Emails',
      value: analyticsData?.overview.totalEmails || 0,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+12.5%',
      trendUp: true
    },
    {
      label: 'Total Opens',
      value: analyticsData ? Math.round((analyticsData.overview.totalEmails * analyticsData.overview.openRate) / 100) : 0,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+2.5%',
      trendUp: true
    },
    {
      label: 'Total Clicks',
      value: analyticsData ? Math.round((analyticsData.overview.totalEmails * analyticsData.overview.clickRate) / 100) : 0,
      icon: MousePointer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '+1.2%',
      trendUp: true
    },
    {
      label: 'Total Replies',
      value: analyticsData ? Math.round((analyticsData.overview.totalEmails * analyticsData.overview.replyRate) / 100) : 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '+3.1%',
      trendUp: true
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - same style as campaigns */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="mt-1 text-gray-600">
                Track your campaign performance and optimize your outreach
              </p>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {/* Time Range Filter */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white min-w-[140px] transition-colors"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Stats Cards - updated to show totals instead of percentages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              const displayValue = stat.value.toLocaleString()

              return (
                <motion.div
                  key={stat.label}
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
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
                      {stat.trend && (
                        <div className="flex items-center mt-1">
                          {stat.trendUp ? (
                            <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.trend} from last period
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {analyticsData && (
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Trends */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                {lineChartData && (
                  <Line data={lineChartData} options={chartOptions} />
                )}
              </motion.div>

              {/* Campaign Status Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
                {campaignStatusData && (
                  <div className="h-64 flex items-center justify-center">
                    <Doughnut data={campaignStatusData} options={doughnutOptions} />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Time Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Times to Send</h3>
              {timeAnalysisData && (
                <Bar data={timeAnalysisData} options={chartOptions} />
              )}
            </motion.div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Campaign</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Emails</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Open Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Reply Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.campaigns.map((campaign, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div className="font-medium text-gray-900">{campaign.name}</div>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {campaign.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{campaign.emails.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-600">{campaign.openRate}%</td>
                          <td className="py-3 px-4 text-gray-600">{campaign.replyRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Top Performing Subjects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-2xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Subject Lines</h3>
                <div className="space-y-4">
                  {analyticsData.topPerformers.map((performer, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="font-medium text-gray-900 mb-2">{performer.subject}</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Open: </span>
                          <span className="font-medium text-green-600">{performer.openRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Click: </span>
                          <span className="font-medium text-blue-600">{performer.clickRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Reply: </span>
                          <span className="font-medium text-purple-600">{performer.replyRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}