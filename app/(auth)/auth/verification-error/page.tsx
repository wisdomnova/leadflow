'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, Mail, RefreshCw, ArrowRight} from 'lucide-react'
import { useState } from 'react'

export default function VerificationErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const getErrorMessage = () => {
    switch (error) {
      case 'missing-token':
        return 'Verification link is missing required information.'
      case 'invalid-token':
        return 'This verification link is invalid or has been tampered with.'
      case 'token-expired':
        return 'This verification link has expired. Please request a new one.'
      case 'user-not-found':
        return 'We could not find an account associated with this verification link.'
      case 'update-failed':
        return 'We encountered an error while verifying your account. Please try again.'
      case 'server-error':
        return 'We encountered a server error. Please try again later.'
      default:
        return 'We encountered an error while verifying your email address.'
    }
  }

  const canResendVerification = () => {
    return ['token-expired', 'invalid-token'].includes(error || '')
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    setResendMessage('')

    // You'll need to implement a way to get the email address
    // For now, we'll redirect to a resend form
    setTimeout(() => {
      setIsResending(false)
      setResendMessage('Please go to the login page and click "Resend verification email"')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Verification Failed
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              {getErrorMessage()}
            </p>
          </div>

          <div className="mt-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    What you can do:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Check if you clicked the correct link from your email</li>
                      <li>Make sure the link hasn't expired (valid for 24 hours)</li>
                      <li>Request a new verification email if needed</li>
                      <li>Contact support if the problem persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {resendMessage && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">{resendMessage}</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Link
                href="/auth/sign-in"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/auth/forgot-password"
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset Password Instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}