'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { AlertCircle, Mail, RefreshCw, ArrowLeft, XCircle } from 'lucide-react'
import { useState } from 'react'

const staggerContainer = { 
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

function VerificationErrorContent() {
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 60% 80% at 50% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 70%),
              radial-gradient(ellipse 80% 60% at 30% 70%, rgba(24, 106, 229, 0.2) 0%, transparent 70%),
              radial-gradient(ellipse 70% 70% at 70% 80%, rgba(147, 51, 234, 0.15) 0%, transparent 60%)
            `,
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center py-12 px-6 sm:px-12">
        <motion.div 
          className="w-full max-w-md"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {/* Back to Home */}
          <motion.div 
            className="mb-8"
            variants={staggerItem}
          >
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to home</span>
            </Link>
          </motion.div>

          {/* Logo */}
          <motion.div 
            className="mb-8 text-center"
            variants={staggerItem}
          >
            <Link href="/" className="inline-block">
              <Image
                src="/leadflow.png"
                alt="Leadflow"
                width={200}
                height={45}
                className="h-12 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
          </motion.div>
          
          <motion.div 
            className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8"
            variants={staggerItem}
          >
            <div className="text-center">
              <motion.div 
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-red-100 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <XCircle className="h-8 w-8 text-red-600" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl font-bold text-gray-900 mb-4"
                variants={staggerItem}
              >
                Verification Failed
              </motion.h2>
              
              <motion.p 
                className="text-lg text-gray-600 leading-relaxed mb-6"
                variants={staggerItem}
              >
                {getErrorMessage()}
              </motion.p>

              {/* Error Details */}
              <motion.div 
                className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"
                variants={staggerItem}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-red-800 mb-2">
                      What you can do:
                    </h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Check if you clicked the correct link from your email</li>
                      <li>• Make sure the link hasn't expired (valid for 24 hours)</li>
                      <li>• Request a new verification email if needed</li>
                      <li>• Contact support if the problem persists</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {resendMessage && (
                <motion.div 
                  className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-blue-700 font-medium">{resendMessage}</p>
                </motion.div>
              )}
              
              <motion.div 
                className="space-y-4"
                variants={staggerContainer}
              >
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-in"
                    className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Go to Sign In
                  </Link>
                </motion.div>
                
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-up"
                    className="w-full flex justify-center py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                  >
                    Create New Account
                  </Link>
                </motion.div>

                {canResendVerification() && (
                  <motion.button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full py-3 px-4 border-2 border-blue-300 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:transform-none"
                    variants={staggerItem}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="animate-spin h-5 w-5 mx-auto" />
                      </>
                    ) : (
                      <>
                        <Mail className="inline mr-2 h-5 w-5" />
                        Resend Verification Email
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerificationErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerificationErrorContent />
    </Suspense>
  )
}