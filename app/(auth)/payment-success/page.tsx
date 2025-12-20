'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID found')
        setLoading(false)
        return
      }

      try {
        // Verify the session with the backend
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          throw new Error('Payment verification failed')
        }

        const data = await response.json()
        
        if (data.success) {
          // Set JWT token if provided
          if (data.token) {
            localStorage.setItem('auth_token', data.token)
          }
          
          // Redirect to email setup after 2 seconds
          setTimeout(() => {
            router.push('/auth/email-setup')
          }, 2000)
        } else {
          setError(data.error || 'Payment verification failed')
          setLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    verifyPayment()
  }, [sessionId, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {loading ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="animate-spin">
                  <svg className="w-12 h-12 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Processing Payment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your payment...
              </p>
            </>
          ) : error ? (
            <>
              <div className="mb-4 flex justify-center">
                <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
                  <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <Link href="/auth/payment-cancelled" className="inline-block px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium transition-colors">
                Try Again
              </Link>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                  <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to email setup...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
