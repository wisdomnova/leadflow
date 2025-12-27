'use client'

import { useEffect, useState } from 'react'

type Preferences = {
  comments: boolean
  messages: boolean
  mentions: boolean
  shares: boolean
  invites: boolean
  product_updates: boolean
}

const defaults: Preferences = {
  comments: true,
  messages: true,
  mentions: true,
  shares: true,
  invites: true,
  product_updates: true,
}

export default function NotificationsPanel() {
  const [prefs, setPrefs] = useState<Preferences>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          setError('Sign in to manage notifications.')
          setLoading(false)
          return
        }

        const res = await fetch('/api/settings/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          setError('Unable to load your preferences right now.')
          return
        }

        const data = await res.json()
        setPrefs({ ...defaults, ...(data.preferences || {}) })
      } catch (err) {
        console.error('Notification prefs load failed', err)
        setError('Unable to load your preferences right now.')
      } finally {
        setLoading(false)
      }
    }

    loadPrefs()
  }, [])

  const toggle = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Sign in to save your preferences.')
        return
      }

      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(prefs),
      })

      if (!res.ok) {
        setError('Could not save preferences. Please try again.')
        return
      }

      const data = await res.json()
      setPrefs({ ...defaults, ...(data.preferences || {}) })
      setSaved(true)
    } catch (err) {
      console.error('Notification prefs save failed', err)
      setError('Could not save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
              <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-1">My Notifications</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Only the alerts we ship today: campaigns and warmup.</p>
          </div>
          {saved && (
            <span className="text-xs text-green-600 dark:text-green-300 font-semibold">Saved</span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading preferences...</div>
        ) : (
          <>
            <section>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">Campaigns</h3>
              <ul>
                <PreferenceRow
                  id="comments"
                    title="Campaign replies"
                    description="When prospects reply to your campaigns or sequences."
                  value={prefs.comments}
                  onToggle={() => toggle('comments')}
                />
                <PreferenceRow
                  id="messages"
                    title="Inbox messages"
                    description="New replies in your inbox for running campaigns."
                  value={prefs.messages}
                  onToggle={() => toggle('messages')}
                />
                <PreferenceRow
                  id="mentions"
                    title="Send status alerts"
                    description="Send/cancel/delivery alerts for active campaigns."
                  value={prefs.mentions}
                  onToggle={() => toggle('mentions')}
                />
              </ul>
            </section>

            <section>
                <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1">Warmup & workspace</h3>
              <ul>
                <PreferenceRow
                  id="shares"
                    title="Warmup health alerts"
                    description="Deliverability and warmup health notifications."
                  value={prefs.shares}
                  onToggle={() => toggle('shares')}
                />
                <PreferenceRow
                  id="invites"
                    title="Workspace invites"
                    description="When someone invites you to a workspace or changes your role."
                  value={prefs.invites}
                  onToggle={() => toggle('invites')}
                />
                <PreferenceRow
                  id="product_updates"
                    title="Product updates"
                    description="Release notes and downtime alerts."
                  value={prefs.product_updates}
                  onToggle={() => toggle('product_updates')}
                />
              </ul>
            </section>
          </>
        )}
      </div>

      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <button
              className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300"
              disabled={loading || saving}
              onClick={() => setPrefs(defaults)}
            >
              Reset to defaults
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

function PreferenceRow({
  id,
  title,
  description,
  value,
  onToggle,
}: {
  id: string
  title: string
  description: string
  value: boolean
  onToggle: () => void
}) {
  return (
    <li className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700/60">
      <div>
        <div className="text-gray-800 dark:text-gray-100 font-semibold">{title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
      </div>
      <div className="flex items-center ml-4">
        <div className="text-sm text-gray-400 dark:text-gray-500 italic mr-2">{value ? 'On' : 'Off'}</div>
        <div className="form-switch">
          <input type="checkbox" id={id} className="sr-only" checked={value} onChange={onToggle} />
          <label htmlFor={id}>
            <span className="bg-white shadow-sm" aria-hidden="true"></span>
            <span className="sr-only">Toggle {title}</span>
          </label>
        </div>
      </div>
    </li>
  )
}