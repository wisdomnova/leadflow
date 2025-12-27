"use client"

import { useState } from 'react'

export default function FeedbackPanel() {
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitFeedback = async () => {
    setError(null)
    setSuccess(null)

    if (!rating) {
      setError('Please select a rating from 1 to 5.')
      return
    }
    if (!message.trim()) {
      setError('Please add a short message.')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setError('Sign in to send feedback.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/settings/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, message }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Failed to send feedback.')
        return
      }

      setSuccess('Thanks! Your feedback helps us improve.')
      setMessage('')
      setRating(null)
    } catch (e) {
      setError('Failed to send feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grow">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-bold mb-4">Give Feedback</h2>
          <div className="text-sm">Our product depends on customer feedback to improve the overall experience!</div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded">{success}</div>
        )}

        <section>
          <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-6">How likely would you recommend us to a friend or colleague?</h3>
          <div className="w-full max-w-xl">
            <div className="relative">
              <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200 dark:bg-gray-700/60" aria-hidden="true"></div>
              <ul className="relative flex justify-between w-full">
                {[1, 2, 3, 4, 5].map((r) => (
                  <li key={r} className="flex">
                    <button
                      className={`w-3 h-3 rounded-full border-2 ${rating === r ? 'bg-violet-500 border-violet-500' : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500'}`}
                      onClick={() => setRating(r)}
                    >
                      <span className="sr-only">{r}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full flex justify-between text-sm text-gray-500 dark:text-gray-400 italic mt-3">
              <div>Not at all</div>
              <div>Extremely likely</div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-5">Tell us in words</h3>
          <label className="sr-only" htmlFor="feedback">Leave a feedback</label>
          <textarea
            id="feedback"
            className="form-textarea w-full focus:border-gray-300"
            rows={4}
            placeholder="I really enjoy…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </section>
      </div>

      <footer>
        <div className="flex flex-col px-6 py-5 border-t border-gray-200 dark:border-gray-700/60">
          <div className="flex self-end">
            <button className="btn dark:bg-gray-800 border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-gray-800 dark:text-gray-300" onClick={() => { setRating(null); setMessage(''); setError(null); setSuccess(null) }}>Clear</button>
            <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-3" onClick={submitFeedback} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Feedback'}
            </button>
          </div>
        </div>
      </footer>

    </div>
  )
}