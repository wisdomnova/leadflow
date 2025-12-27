'use client'

import { useEffect, useState } from 'react'
import { useFlyoutContext } from '@/app/flyout-context'

interface CampaignReply {
  id: string
  contact_email: string
  contact_name: string
  campaign_name: string
  reply_count: number
  last_reply?: string
}

interface Props {
  selectedReplyId: string | null
  onSelectReply: (id: string | null) => void
}

export default function DirectMessages({ selectedReplyId, onSelectReply }: Props) {
  const { setFlyoutOpen } = useFlyoutContext()
  const [token, setToken] = useState<string | null>(null)
  const [replies, setReplies] = useState<CampaignReply[]>([])

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token) return
    loadReplies()
  }, [token])

  async function loadReplies() {
    try {
      const res = await fetch('/api/campaigns/replies', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      const next = json.replies || []
      setReplies(next)
      if (next.length === 0) {
        onSelectReply(null)
      } else if (!selectedReplyId) {
        onSelectReply(next[0].id)
      }
    } catch (error) {
      console.error('Failed to load campaign replies:', error)
    }
  }

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3">Campaign Replies</div>
      <ul className="mb-6">
        {replies.length === 0 ? (
          <li className="text-xs text-gray-500 px-2 py-3">No replies yet</li>
        ) : (
          replies.map((reply) => (
            <li key={reply.id} className="-mx-2">
              <button
                className={`flex items-center justify-between w-full p-2 rounded-sm ${
                  selectedReplyId === reply.id
                    ? 'bg-linear-to-r from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  onSelectReply(reply.id)
                  setFlyoutOpen(false)
                }}
              >
                <div className="truncate">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {reply.contact_name || reply.contact_email}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{reply.campaign_name}</div>
                </div>
                {reply.reply_count > 0 && (
                  <div className="flex items-center ml-2">
                    <div className="text-xs inline-flex font-medium bg-violet-400 text-white rounded-full text-center leading-5 px-2">
                      {reply.reply_count}
                    </div>
                  </div>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}