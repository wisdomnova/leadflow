'use client'

import Link from 'next/link'

export default function PaymentCancelledPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6 flex justify-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-4">
              <svg className="w-12 h-12 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 6v2" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Payment Cancelled
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Your payment has been cancelled. No charges have been made to your account.
          </p>

          <div className="space-y-3">
            <Link href="/auth/signup" className="block w-full py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-center transition-colors">
              Try Different Plan
            </Link>
            <button className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">
              Back
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">Need help?</span> Contact our support team at support@leadflow.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
