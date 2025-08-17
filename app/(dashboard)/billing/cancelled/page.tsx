'use client'

import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-gray-400 mb-6">
            <XCircle className="h-16 w-16 mx-auto" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Payment Cancelled
          </h2>
          
          <p className="text-gray-600 mb-6">
            Your payment was cancelled. Don't worry, no charges were made to your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              You can still enjoy your free trial and upgrade anytime before it expires.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/billing/upgrade"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Try Again
            </Link>
            
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}