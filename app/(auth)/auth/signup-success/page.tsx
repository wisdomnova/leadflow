'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, CheckCircle, Clock, RefreshCw } from 'lucide-react'

export default function SignupSuccessPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleResendVerification = async () => {
    if (!email) return 

    setIsResending(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage('Verification email sent successfully! Please check your inbox.')
      } else {
        setResendMessage(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      setResendMessage('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/leadflow.png"
            alt="Leadflow"
            width={180}
            height={40}
            className="h-13 w-auto"
          />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            
            <h2 className="mt-6 text-3xl font-black text-gray-900">
              Check your email
            </h2>
            
            <p className="mt-2 text-sm text-gray-600 font-medium">
              We've sent a verification link to
            </p>
            
            {email && (
              <p className="mt-1 text-sm font-bold text-blue-600 break-all">
                {email}
              </p>
            )}
          </div>

          <div className="mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-blue-800">
                    Account Created Successfully!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Click the verification link in your email to:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Activate your account</li>
                      <li>Start your 14-day free trial</li>
                      <li>Access your dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-bold text-yellow-800">
                    Can't find the email?
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Check your spam/junk folder</li>
                      <li>Make sure you entered the correct email</li>
                      <li>The verification link expires in 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {resendMessage && (
              <div className={`mt-4 p-4 rounded-md ${
                resendMessage.includes('successfully') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <p className="text-sm font-medium">{resendMessage}</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="w-full flex justify-center items-center py-3 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </button>

              <Link
                href="/auth/sign-in"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}