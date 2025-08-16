'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function VerificationSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const alreadyVerified = searchParams.get('already-verified')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
            </h2>
            
            <p className="mt-2 text-sm text-gray-600">
              {alreadyVerified 
                ? 'Your email was already verified. You can now access your dashboard.'
                : 'Your email address has been successfully verified. Welcome to LeadFlow!'
              }
            </p>
          </div>

          <div className="mt-8">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Account Active
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Full dashboard access enabled</li>
                      <li>14-day free trial activated</li>
                      <li>Import contacts and create campaigns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/sign-in"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}