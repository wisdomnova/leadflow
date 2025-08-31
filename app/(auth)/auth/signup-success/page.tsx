'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, Clock, RefreshCw, ArrowLeft, Shield } from 'lucide-react'

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

function SignupSuccessContent() {
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 60% 80% at 50% 30%, rgba(34, 197, 94, 0.3) 0%, transparent 70%),
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
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-green-100 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Mail className="h-8 w-8 text-green-600" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl font-bold text-gray-900 mb-4"
                variants={staggerItem}
              >
                Check your email
              </motion.h2>
              
              <motion.p 
                className="text-lg text-gray-600 leading-relaxed mb-2"
                variants={staggerItem}
              >
                We've sent a verification link to
              </motion.p>
              
              {email && (
                <motion.p 
                  className="text-lg font-bold text-gray-900 mb-6"
                  variants={staggerItem}
                >
                  {email}
                </motion.p>
              )}

              {/* Account Created Success */}
              <motion.div 
                className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6"
                variants={staggerItem}
              >
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-green-800 mb-2">
                      Account Created Successfully!
                    </h3>
                    <p className="text-sm text-green-700">
                      Click the verification link to activate your account and start your 14-day free trial.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Security Info */}
              <motion.div 
                className="bg-gray-50 rounded-2xl p-4 mb-6"
                variants={staggerItem}
              >
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Expires in 24 hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Secure link</span>
                  </div>
                </div>
              </motion.div>

              {/* Can't find email info */}
              <motion.div 
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6"
                variants={staggerItem}
              >
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-yellow-800 mb-2">
                      Can't find the email?
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Check your spam folder or resend the verification email below.
                    </p>
                  </div>
                </div>
              </motion.div>

              {resendMessage && (
                <motion.div 
                  className={`mb-6 p-4 rounded-2xl ${
                    resendMessage.includes('successfully') 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className={`text-sm font-medium ${
                    resendMessage.includes('successfully') ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {resendMessage}
                  </p>
                </motion.div>
              )}
              
              <motion.div 
                className="space-y-4"
                variants={staggerContainer}
              >
                <motion.button
                  onClick={handleResendVerification}
                  disabled={isResending || !email}
                  className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02] disabled:transform-none"
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
                
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-in"
                    className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Back to Sign In
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  )
}