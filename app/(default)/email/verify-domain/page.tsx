"use client"

import { useEffect, useState } from 'react'

export default function VerifyDomainPage() {
  const [token, setToken] = useState<string | null>(null)
  const [domain, setDomain] = useState('')
  const [dkimTokens, setDkimTokens] = useState<string[] | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [domains, setDomains] = useState<any[]>([])

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    fetch('/api/email/domains', { headers })
      .then((r) => r.json())
      .then((j) => setDomains(j.domains || []))
  }, [token])

  async function addDomain() {
    if (!token || !domain) return
    setStatus(null)
    const res = await fetch('/api/email/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ domain }),
    })
    const json = await res.json()
    if (!res.ok) {
      setStatus(json.error || 'Failed to create domain')
    } else {
      setStatus('Created. Add DNS records and verify.')
      setDkimTokens(json.dkimTokens || [])
      const list = await fetch('/api/email/domains', { headers: { Authorization: `Bearer ${token}` }})
      const j = await list.json()
      setDomains(j.domains || [])
    }
  }

  async function verify(id: string) {
    if (!token) return
    const res = await fetch(`/api/email/domains/${id}/verify`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (!res.ok) setStatus(json.error || 'Verification failed')
    else setStatus(`SPF: ${json.spfOk ? 'OK' : 'Missing'} • DKIM: ${json.dkimOk ? 'OK' : 'Pending'} • DMARC: ${json.dmarcOk ? 'OK' : 'Missing'}`)
    const list = await fetch('/api/email/domains', { headers: { Authorization: `Bearer ${token}` }})
    const j = await list.json()
    setDomains(j.domains || [])
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Verify Domain</h1>
        <p className="text-sm text-slate-500">Create identity in SES, then add DNS (SPF, DKIM, DMARC).</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Domain</label>
          <input className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={addDomain} className="px-4 py-2 bg-indigo-600 text-white rounded">Create Identity</button>
          {status && <span className="text-sm text-slate-600">{status}</span>}
        </div>

        {dkimTokens && (
          <div className="mt-4">
            <p className="text-sm font-medium">DKIM CNAMEs</p>
            <ul className="text-sm mt-2 list-disc ml-5">
              {dkimTokens.map((t) => (
                <li key={t}>{`${t}._domainkey.${domain} → ${t}.dkim.amazonses.com`}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Existing Domains</h2>
        {domains.length === 0 ? (
          <div className="text-sm text-slate-500">None</div>
        ) : (
          <div className="space-y-3 text-sm">
            {domains.map((d) => (
              <div key={d.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.domain}</div>
                  <div className="flex gap-3 mt-1">
                    <span className={d.spf_status === 'verified' ? 'text-green-600' : 'text-slate-500'}>SPF: {d.spf_status}</span>
                    <span className={d.dkim_status === 'verified' ? 'text-green-600' : 'text-slate-500'}>DKIM: {d.dkim_status}</span>
                    <span className={d.dmarc_status === 'verified' ? 'text-green-600' : 'text-slate-500'}>DMARC: {d.dmarc_status}</span>
                  </div>
                </div>
                <button onClick={() => verify(d.id)} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">Verify</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
