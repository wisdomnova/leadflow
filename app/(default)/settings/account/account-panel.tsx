'use client'

import { useEffect, useMemo, useState } from 'react'

type Profile = {
  fullName: string
  companyName: string
  email: string
  role?: string | null
  createdAt?: string | null
  lastLogin?: string | null
}

export default function AccountPanel() {
  const [profile, setProfile] = useState<Profile>({
    fullName: '',
    companyName: '',
    email: '',
    role: '',
    createdAt: '',
    lastLogin: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const initials = useMemo(() => {
    if (!profile.fullName) return '👤'
    const parts = profile.fullName.trim().split(' ')
    return parts
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('')
  }, [profile.fullName])

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime())
      ? '—'
      : parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setError('You need to sign in to view account details.')
          return
        }

        const res = await fetch('/api/settings/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          setError('Unable to load your profile right now.')
          return
        }

        const data = await res.json()
        if (data?.user) {
          setProfile({
            fullName: data.user.fullName || '',
            companyName: data.user.companyName || '',
            email: data.user.email || '',
            role: data.user.role,
            createdAt: data.user.createdAt,
            lastLogin: data.user.lastLogin,
          })
        }
      } catch (err) {
        console.error('Profile load failed', err)
        setError('Unable to load your profile right now.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaved(false)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('You need to sign in to update your account.')
        return
      }

      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          companyName: profile.companyName,
        }),
      })

      if (!res.ok) {
        setError('We could not save your changes. Please try again.')
        return
      }

      const data = await res.json()
      if (data?.user) {
        setProfile((prev) => ({ ...prev, ...{
          fullName: data.user.fullName || prev.fullName,
          companyName: data.user.companyName || prev.companyName,
        } }))
        setSaved(true)
      }
    } catch (err) {
      console.error('Profile save failed', err)
      setError('We could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold">My Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile and company details.</p>
          </div>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-100 flex items-center justify-center text-sm font-semibold mr-3">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{profile.fullName || '—'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{profile.email || '—'}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {saved && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded">
            Changes saved.
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  className="form-input w-full"
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="company-name">Company</label>
                <input
                  id="company-name"
                  className="form-input w-full"
                  type="text"
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="form-input w-full bg-gray-50 dark:bg-gray-800/50"
                  type="email"
                  value={profile.email}
                  readOnly
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact support to change your login email.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Role</div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">{profile.role || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Workspace created</div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">{formatDate(profile.createdAt)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Last login</div>
                  <div className="font-medium text-gray-800 dark:text-gray-100">{formatDate(profile.lastLogin)}</div>
                </div>
              </div>
            </section>

            <section className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700/60 p-4">
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Password</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Reset your password securely.</div>
              </div>
              <a className="btn-sm border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm" href="/auth/reset-password">Reset</a>
            </section>
          </>
        )}
      </div>

      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <button
              className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
              onClick={() => setProfile({ ...profile })}
              disabled={loading || saving}
            >
              Cancel
            </button>
            <button
              className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-3 disabled:opacity-60"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}