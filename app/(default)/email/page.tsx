"use client"

import { useEffect, useState } from 'react'

export default function EmailPage() {
  const [token, setToken] = useState<string | null>(null)
  const [domains, setDomains] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    async function load() {
      setLoading(true)
      try {
        const [dRes, wRes] = await Promise.all([
          fetch('/api/email/domains', { headers }),
          fetch('/api/email/warmup/status', { headers }),
        ])
        const dJson = await dRes.json()
        const wJson = await wRes.json()
        setDomains(dJson.domains || [])
        setSchedules(wJson.schedules || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Email Provider</h1>
        <p className="text-sm text-slate-500">Connect SES, verify domain, and start warmup.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Checklist */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Checklist</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span>Connect AWS SES</span>
              <a href="/app/(default)/email/connect-ses" className="text-indigo-600 hover:underline">Configure</a>
            </li>
            <li className="flex items-center justify-between">
              <span>Verify sending domain (SPF, DKIM, DMARC)</span>
              <a href="/app/(default)/email/verify-domain" className="text-indigo-600 hover:underline">Verify</a>
            </li>
            <li className="flex items-center justify-between">
              <span>Start warmup schedule</span>
              <button
                className="text-indigo-600 hover:underline"
                onClick={async () => {
                  if (!token) return
                  await fetch('/api/email/warmup/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ provider: 'aws_ses', domain: domains[0]?.domain }),
                  })
                  location.reload()
                }}
              >Start</button>
            </li>
          </ul>
        </div>

        {/* Domains */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Domains</h2>
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : domains.length === 0 ? (
            <div className="text-sm text-slate-500">No domains yet. Add and verify to send.</div>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <div key={d.id} className="text-sm">
                  <div className="font-medium">{d.domain}</div>
                  <div className="flex gap-3 mt-1">
                    <span className={d.spf_status === 'verified' ? 'text-green-600' : 'text-slate-500'}>SPF: {d.spf_status}</span>
                    <span className={d.dkim_status === 'verified' ? 'text-green-600' : 'text-slate-500'}>DKIM: {d.dkim_status}</span>
                    <span className={d.dmarc_status === 'verified' ? 'text-green-600' : 'text-slate-500'}>DMARC: {d.dmarc_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <a href="/app/(default)/email/verify-domain" className="text-indigo-600 hover:underline text-sm">Add domain</a>
          </div>
        </div>

        {/* Warmup */}
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Warmup</h2>
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : schedules.length === 0 ? (
            <div className="text-sm text-slate-500">No warmup schedule. Start to protect reputation.</div>
          ) : (
            <div className="space-y-3 text-sm">
              {schedules.map((s) => (
                <div key={s.id}>
                  <div className="font-medium">{s.provider} {s.domain ? `• ${s.domain}` : ''}</div>
                  <div>Day {s.current_day} / {s.total_days}</div>
                  <div>Daily limit: {s.daily_limit}</div>
                  <div>Status: {s.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
