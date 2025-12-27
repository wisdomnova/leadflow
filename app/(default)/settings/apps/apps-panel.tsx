'use client'

import { useEffect, useMemo, useState } from 'react'

type Provider = {
  id: string
  providerType: string
  isVerified: boolean
  createdAt?: string
}

export default function AppsPanel() {
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const providerName = useMemo(() => {
    if (!provider) return ''
    const type = provider.providerType
    if (type === 'smtp') return 'SMTP'
    if (type === 'resend') return 'Resend'
    if (type === 'gmail') return 'Gmail'
    if (type === 'skip') return 'Email setup skipped'
    return type
  }, [provider])

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setError('Sign in to view connected apps.')
          setLoading(false)
          return
        }

        const res = await fetch('/api/email-provider', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.status === 404) {
          setProvider(null)
          return
        }

        if (!res.ok) {
          setError('Unable to load connected apps right now.')
          return
        }

        const data = await res.json()
        if (data?.provider) setProvider(data.provider)
      } catch (err) {
        console.error('Apps load failed', err)
        setError('Unable to load connected apps right now.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-1">Connected Apps</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email providers power sending, deliverability, and inbox replies.</p>
          </div>
          <a className="btn-sm bg-violet-600 text-white hover:bg-violet-700" href="/email">Manage email</a>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Checking your connections...</div>
        ) : provider ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-sm rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 flex items-center justify-center font-semibold mr-3">
                    {providerName.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-800 dark:text-gray-100 font-semibold">{providerName || 'Email provider'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{provider.isVerified ? 'Verified connection' : 'Not verified yet'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${provider.isVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200'}`}>
                  {provider.isVerified ? 'Active' : 'Needs attention'}
                </span>
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                Connected {provider.createdAt ? new Date(provider.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}. All outbound campaigns will use this provider.
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
              <div className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">Need another provider?</div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">Connect SES, Resend, Gmail, or SMTP. You can swap providers without breaking existing campaigns.</p>
              <a className="btn-sm bg-white dark:bg-transparent border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/30" href="/email/connect-ses">Connect new provider</a>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <div className="text-gray-800 dark:text-gray-100 font-semibold mb-1">No provider connected yet</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect an email provider to send campaigns and capture replies.</p>
            <div className="flex justify-center gap-3">
              <a className="btn-sm bg-violet-600 text-white hover:bg-violet-700" href="/email">Connect provider</a>
              <a className="btn-sm border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-200" href="/email/verify-domain">Verify domain</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}