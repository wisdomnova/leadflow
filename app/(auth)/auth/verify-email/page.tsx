'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setStatus('error')
        return
      }

      if (data.session?.user) {
        if (data.session.user.email_confirmed_at) {
          setStatus('success')
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          setEmail(data.session.user.email || '')
          setStatus('resend')
        }
      }
    }

    verifyEmail()
  }, [router])

  const handleResendVerification = async () => {
    setResending(true)
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (!error) {
      alert('Verification email sent! Please check your inbox.')
    } else {
      alert('Failed to send verification email. Please try again.')
    }
    
    setResending(false)
  }

  if (status === 'loading') {
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
          
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
              <h2 className="text-2xl font-black text-gray-900 mb-4">
                Verifying your email...
              </h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
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
          
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">
                Email verified successfully!
              </h2>
              <p className="text-sm text-gray-600 font-medium mb-6">
                Your account is now active. Redirecting to your dashboard...
              </p>
              
              <Link 
                href="/dashboard"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
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
          
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">
                Verification failed
              </h2>
              <p className="text-sm text-gray-600 font-medium mb-6">
                The verification link is invalid or has expired.
              </p>
              
              <div className="space-y-4">
                <Link 
                  href="/auth/sign-up"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  Create New Account
                </Link>
                
                <Link 
                  href="/auth/sign-in"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  Sign In Instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Resend verification state
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
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <Mail className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              Verify your email
            </h2>
            <p className="text-sm text-gray-600 font-medium mb-6">
              Please check your email and click the verification link to activate your account.
            </p>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Email sent to: <span className="font-bold text-gray-900">{email}</span>
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Resend Verification Email'
                )}
              </button>
              
              <Link 
                href="/auth/sign-in"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
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