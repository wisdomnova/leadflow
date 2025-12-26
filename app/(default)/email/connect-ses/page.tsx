"use client"

import { useState } from 'react'

export default function ConnectSesPage() {
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [region, setRegion] = useState('us-east-1')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
    if (!token) { setMessage('Unauthorized'); return }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/app/api/email/ses/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessKeyId, secretAccessKey, region })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setMessage('Saved')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Connect AWS SES</h1>
        <p className="text-sm text-slate-500">Store credentials and region securely.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Access Key ID</label>
          <input className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" value={accessKeyId} onChange={(e) => setAccessKeyId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Secret Access Key</label>
          <input className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" value={secretAccessKey} onChange={(e) => setSecretAccessKey(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Region</label>
          <input className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900" value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          {message && <span className="text-sm text-slate-600">{message}</span>}
        </div>
      </div>
    </div>
  )
}
