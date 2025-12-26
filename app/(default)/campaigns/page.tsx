"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Campaigns() {
  const [token, setToken] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [planInfo, setPlanInfo] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    loadCampaigns()
    loadPlanInfo()
  }, [token, statusFilter])

  async function loadCampaigns() {
    setLoading(true)
    try {
      const url = statusFilter === 'all' ? '/api/campaigns' : `/api/campaigns?status=${statusFilter}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setCampaigns(json.campaigns || [])
    } finally {
      setLoading(false)
    }
  }

  async function loadPlanInfo() {
    try {
      const res = await fetch('/api/billing/subscription', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setPlanInfo(json.currentPlan)
    } catch (e) {
      console.error('Error loading plan info:', e)
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      queued: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      sending: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    }
    return map[status] || map.draft
  }

  async function handleCampaignAction(campaignId: string, action: 'pause' | 'resume' | 'stop') {
    if (['growth', 'pro'].includes(planInfo?.id) === false && action !== 'stop') {
      alert('Campaign pause/resume available on Growth plan and above')
      return
    }

    setActionLoading({ ...actionLoading, [`${campaignId}-${action}`]: true })
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Action ${action} failed`)

      // Reload campaigns
      loadCampaigns()
    } catch (e: any) {
      alert(`Error: ${e.message}`)
    } finally {
      setActionLoading({ ...actionLoading, [`${campaignId}-${action}`]: false })
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error.message}</p>
        </div>
      )}

      {planInfo?.id === 'trial' && campaigns.length >= 3 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Campaign Limit Reached</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Trial plan limited to 3 campaigns. Upgrade to create more.</p>
            </div>
            <Link href="/billing" className="btn-sm bg-yellow-600 hover:bg-yellow-700 text-white">
              Upgrade Plan
            </Link>
          </div>
        </div>
      )}

      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Campaigns</h1>
          {planInfo && (
            <p className="text-sm text-gray-500 mt-2">Plan: <span className="font-medium">{planInfo.name}</span></p>
          )}
        </div>

        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <select
            className="btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="queued">Queued</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>

          <Link 
            href="/campaigns/new" 
            className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white"
            onClick={(e) => {
              if (planInfo?.id === 'trial' && campaigns.length >= 3) {
                e.preventDefault()
                alert('Trial plan limited to 3 campaigns. Upgrade to create more.')
              }
            }}
          >
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Create Campaign</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading campaigns...</div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700">
          <div className="text-gray-500 mb-4">No campaigns yet</div>
          <Link href="/campaigns/new" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800">
            Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="col-span-full sm:col-span-6 xl:col-span-4">
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700/60 p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{campaign.name}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusBadge(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="text-sm mb-3">
                  <div className="text-gray-600 dark:text-gray-400">Template: {campaign.templates?.name || 'N/A'}</div>
                  <div className="text-gray-600 dark:text-gray-400">Recipients: {campaign.total_recipients || 0}</div>
                </div>

                <div className="flex gap-4 text-sm mb-4">
                  <div>
                    <div className="text-gray-500 text-xs">Sent</div>
                    <div className="font-medium">{campaign.sent_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Opened</div>
                    <div className="font-medium">{campaign.opened_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Replied</div>
                    <div className="font-medium text-green-600">{campaign.replied_count || 0}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="btn-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300 flex-1 text-center"
                  >
                    View
                  </Link>
                  {campaign.status === 'draft' && (
                    <Link
                      href={`/campaigns/${campaign.id}/edit`}
                      className="btn-sm bg-gray-900 text-gray-100 hover:bg-gray-800 flex-1 text-center"
                    >
                      Edit
                    </Link>
                  )}
                  {['sending', 'queued', 'scheduled'].includes(campaign.status) && (
                    <button
                      onClick={() => handleCampaignAction(campaign.id, 'pause')}
                      disabled={actionLoading[`${campaign.id}-pause`]}
                      className="btn-sm bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      {actionLoading[`${campaign.id}-pause`] ? 'Pausing...' : 'Pause'}
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={() => handleCampaignAction(campaign.id, 'resume')}
                      disabled={actionLoading[`${campaign.id}-resume`]}
                      className="btn-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading[`${campaign.id}-resume`] ? 'Resuming...' : 'Resume'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
