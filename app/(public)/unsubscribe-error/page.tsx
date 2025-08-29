// ./app/(public)/unsubscribe-error/page.tsx
'use client'

import { AlertTriangle, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function UnsubscribeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Unsubscribe Failed
        </h1>
        
        <p className="text-gray-600 mb-6">
          We encountered an error while trying to unsubscribe you from this email campaign. 
          This might be due to an invalid or expired unsubscribe link.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-left">
              <h3 className="font-medium text-amber-900 mb-1">What you can do:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Try clicking the unsubscribe link again</li>
                <li>• Contact the sender directly to remove your email</li>
                <li>• Mark the email as spam in your email client</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            If you continue to have issues, please contact support.
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