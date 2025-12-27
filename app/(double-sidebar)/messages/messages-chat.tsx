'use client'

import { useEffect, useRef, useState } from 'react'
import { useFlyoutContext } from '@/app/flyout-context'

interface EmailReply {
  id: string
  sender_email: string
  sender_name: string
  subject: string
  body: string
  created_at: string
  category?: string
  sentiment?: number
}

export default function MessagesChat({ selectedReplyId }: { selectedReplyId: string | null }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { flyoutOpen } = useFlyoutContext()
  const [token, setToken] = useState<string | null>(null)
  const [replies, setReplies] = useState<EmailReply[]>([])

  useEffect(() => {
    const t = localStorage.getItem('auth_token') || localStorage.getItem('token')
    setToken(t)
  }, [])

  useEffect(() => {
    if (!token || !selectedReplyId) return
    loadReplies(selectedReplyId)
  }, [token, selectedReplyId])

  useEffect(() => {
    !flyoutOpen && messagesEndRef.current?.scrollIntoView()
  }, [flyoutOpen, replies])

  async function loadReplies(replyId: string) {
    try {
      const res = await fetch(`/api/campaigns/replies/${replyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      setReplies(json.replies || [])
    } catch (error) {
      console.error('Failed to load replies:', error)
    }
  }

  if (!selectedReplyId) {
    return (
      <div className="grow flex items-center justify-center px-4 sm:px-6 md:px-5 py-6">
        <div className="text-center text-gray-500">
          <p>Select a campaign reply to view messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grow px-4 sm:px-6 md:px-5 py-6 overflow-y-auto">
      {replies.length === 0 ? (
        <div className="text-center text-gray-500">No replies for this campaign</div>
      ) : (
        <>
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start mb-4 last:mb-0">
              <div>
                <div className="text-sm bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-3 rounded-lg rounded-tl-none mb-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">{reply.sender_name || reply.sender_email}</div>
                  {reply.subject && <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">Subject: {reply.subject}</div>}
                  <div className="whitespace-pre-wrap">{reply.body}</div>
                  {reply.category && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Category: <span className="font-medium">{reply.category}</span>
                      {reply.sentiment !== undefined && (
                        <span className="ml-2">
                          Sentiment: <span className="font-medium">{reply.sentiment > 0 ? 'Positive' : reply.sentiment < 0 ? 'Negative' : 'Neutral'}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-medium">
                    {new Date(reply.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
