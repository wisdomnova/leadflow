'use client'

import { useState } from 'react'
import FilterButton from '@/components/dropdown-filter'
import Datepicker from '@/components/datepicker'

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d')

  // Dummy data
  const stats = {
    totalEmailsSent: 2847,
    totalEmailsSentChange: '+5.2%',
    openRate: 42.3,
    openRateChange: '-1.3%',
    replyRate: 8.5,
    replyRateChange: '+2',
    activeCampaigns: 12,
    activeCampaignsChange: '+0',
  }

  const chartData = [
    { day: 'Mon', sent: 250, opens: 180, clicks: 45 },
    { day: 'Tue', sent: 320, opens: 210, clicks: 67 },
    { day: 'Wed', sent: 280, opens: 195, clicks: 52 },
    { day: 'Thu', sent: 350, opens: 240, clicks: 78 },
    { day: 'Fri', sent: 420, opens: 290, clicks: 95 },
    { day: 'Sat', sent: 180, opens: 110, clicks: 35 },
    { day: 'Sun', sent: 150, opens: 85, clicks: 22 },
  ]

  const campaigns = [
    { name: 'Summer Product Launch', sent: 450, openRate: '45.2%', clickRate: '12.3%', replies: 23, status: 'Active' },
    { name: 'Q4 Outreach', sent: 320, openRate: '38.7%', clickRate: '9.1%', replies: 15, status: 'Active' },
    { name: 'Follow-up Sequence', sent: 180, openRate: '52.1%', clickRate: '15.8%', replies: 31, status: 'Active' },
    { name: 'Customer Feedback', sent: 220, openRate: '41.8%', clickRate: '8.9%', replies: 12, status: 'Paused' },
    { name: 'New Feature Announcement', sent: 890, openRate: '48.3%', clickRate: '18.2%', replies: 67, status: 'Completed' },
  ]

  const activities = [
    { user: 'John Smith', action: "replied to 'Summer Product Launch'", time: '2 minutes ago' },
    { user: 'Campaign', action: "'Q4 Outreach' sent 150 emails", time: '15 minutes ago' },
    { user: 'Sarah Johnson', action: 'opened your email 3 times', time: '23 minutes ago' },
    { user: 'Contact', action: 'added: Mike Davis', time: '1 hour ago' },
    { user: 'Campaign', action: "'Follow-up Sequence' completed", time: '2 hours ago' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'Paused':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      case 'Completed':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
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
          <button className="btn bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">New Campaign</span>
          </button>
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
        {/* Email Activity Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Email Activity</h2>
            <div className="flex gap-2">
              {['7 Days', '30 Days', '90 Days'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Simple Chart Representation */}
          <div className="space-y-6">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex items-end gap-4 h-24">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t" style={{ height: `${(data.sent / 450) * 100}%` }}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{data.day}</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t" style={{ height: `${(data.opens / 300) * 100}%` }}></div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t" style={{ height: `${(data.clicks / 100) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-violet-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Opens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Clicks</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-semibold">{activity.user}</span> {activity.action}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 text-center text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
            View All Activity
          </button>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="col-span-12 mt-6 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Campaign Performance</h2>
          <button className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium">
            View All
          </button>
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
              {campaigns.map((campaign, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.sent}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.openRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.clickRate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{campaign.replies}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm">
          Create New Campaign
        </button>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm">
          Import Contacts
        </button>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm">
          View Templates
        </button>
      </div>
    </div>
  )
}
