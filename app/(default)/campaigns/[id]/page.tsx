"use client"

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [token, setToken] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    loadCampaign()
    loadAnalytics()
  }, [token])

  async function loadCampaign() {
    const res = await fetch(`/api/campaigns/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setCampaign(json.campaign)
    setLoading(false)
  }

  async function loadAnalytics() {
    const res = await fetch(`/api/campaigns/${id}/analytics`, { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setAnalytics(json.analytics)
  }

  async function handleSend() {
    if (!confirm('Send campaign now?')) return
    const res = await fetch(`/api/campaigns/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    alert(json.message || 'Campaign queued')
    loadCampaign()
  }

  if (loading) return <div className="px-4 py-8 text-center">Loading...</div>

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <Link href="/campaigns" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">
            ← Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold">{campaign?.name}</h1>
          <p className="text-sm text-gray-500">Status: {campaign?.status}</p>
        </div>
        {campaign?.status === 'draft' && (
          <button onClick={handleSend} className="btn bg-gray-900 text-gray-100 hover:bg-gray-800">
            Send Campaign
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border p-4">
          <div className="text-sm text-gray-500">Sent</div>
          <div className="text-2xl font-bold">{analytics?.sent || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border p-4">
          <div className="text-sm text-gray-500">Opened</div>
          <div className="text-2xl font-bold">{analytics?.opened || 0}</div>
          <div className="text-xs text-gray-500">{analytics?.openRate}% rate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border p-4">
          <div className="text-sm text-gray-500">Clicked</div>
          <div className="text-2xl font-bold">{analytics?.clicked || 0}</div>
          <div className="text-xs text-gray-500">{analytics?.clickRate}% rate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border p-4">
          <div className="text-sm text-gray-500">Replied</div>
          <div className="text-2xl font-bold text-green-600">{analytics?.replied || 0}</div>
          <div className="text-xs text-gray-500">{analytics?.replyRate}% rate</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Campaign Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Subject</dt>
            <dd className="font-medium">{campaign?.subject || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Template</dt>
            <dd className="font-medium">{campaign?.templates?.name || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Provider</dt>
            <dd className="font-medium">{campaign?.provider}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Recipients</dt>
            <dd className="font-medium">{campaign?.total_recipients || 0}</dd>
          </div>
        </dl>
        {campaign?.notes && (
          <div className="mt-4 pt-4 border-t">
            <dt className="text-gray-500 text-sm mb-2">Notes</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-300">{campaign.notes}</dd>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 shadow-sm rounded-lg border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recipients</h2>
          <Link href="/messages" className="text-sm text-indigo-600 hover:underline">
            View Replies in Messages →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="text-xs font-semibold uppercase text-gray-500 border-b">
              <tr>
                <th className="px-2 py-3 text-left">Contact</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Sent</th>
                <th className="px-2 py-3 text-left">Opened</th>
                <th className="px-2 py-3 text-left">Replied</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y">
              {analytics?.sends?.map((s: any) => (
                <tr key={s.id}>
                  <td className="px-2 py-3">{s.contacts?.name || s.contacts?.email}</td>
                  <td className="px-2 py-3">{s.status}</td>
                  <td className="px-2 py-3">{s.sent_at ? new Date(s.sent_at).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-3">{s.opened_at ? '✓' : '-'}</td>
                  <td className="px-2 py-3">{s.replied_at ? '✓' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
