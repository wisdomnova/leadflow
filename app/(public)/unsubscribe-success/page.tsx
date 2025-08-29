// ./app/(public)/unsubscribe-success/page.tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function UnsubscribeSuccessContent() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaign')
  const contactId = searchParams.get('contact')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Successfully Unsubscribed
        </h1>
        
        <p className="text-gray-600 mb-6">
          You have been successfully removed from this email campaign. 
          You will no longer receive emails from this sender.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-left">
              <h3 className="font-medium text-blue-900 mb-1">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• You'll stop receiving emails from this campaign</li>
                <li>• Your email is removed from the sender's list</li>
                <li>• This change is effective immediately</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            If you continue to receive emails, please contact the sender directly.
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribeSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnsubscribeSuccessContent />
    </Suspense>
  )
}