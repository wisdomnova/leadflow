'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TeamMember {
  id: string
  name: string
  email: string
  activeCampaigns: number
  openRate: number
  replyRate: number
  status: 'active' | 'paused'
}

interface TeamMetrics {
  teamMembers: TeamMember[]
  summary: {
    totalMembers: number
    activeCampaigns: number
    emailsSentLast7d: number
  }
  metrics: {
    avgOpenRate: number
    avgReplyRate: number
  }
}

export default function TeamDashboard() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null)

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
      const res = await fetch('/api/team/performance', {
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading team performance...</p>
      </div>
    )
  }

  if (!metrics || metrics.teamMembers.length === 0) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Team Dashboard</h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No campaigns yet</p>
          <Link href="/campaigns/new" className="btn bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700">
            Create First Campaign
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Team Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Avg Reply Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Reply Rate</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.metrics.avgReplyRate.toFixed(1)}%</p>
        </div>

        {/* Avg Open Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Open Rate</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.metrics.avgOpenRate.toFixed(1)}%</p>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Campaigns</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.summary.activeCampaigns}</p>
        </div>

        {/* Emails Sent (Last 7d) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Emails Sent (7d)</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.summary.emailsSentLast7d.toLocaleString()}</p>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Team Performance</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Team Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Active Campaigns</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Open Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Reply Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.teamMembers.map((member, idx) => {
                const isTopPerformer = idx === 0 && member.replyRate > 0
                return (
                  <tr key={member.id} className={`border-b border-gray-200 dark:border-gray-700 ${isTopPerformer ? 'bg-violet-50 dark:bg-violet-900/10' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">{member.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{member.activeCampaigns}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{member.openRate.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${isTopPerformer ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                        {member.replyRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                        Active
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
