'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'

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

function VerifyEmailContent() { 
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // If we have a token, make a GET request to trigger verification
    if (token) {
      // Redirect to the GET endpoint which will handle verification and redirect back
      window.location.href = `/api/auth/verify-email?token=${token}`
    } else {
      setStatus('error')
      setErrorMessage('Invalid verification link - no token provided')
    }
  }, [token])

  // If we're here with success/error query params, it means we were redirected back
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    if (window.location.pathname === '/auth/verification-success') {
      if (urlParams.get('already-verified') === 'true') {
        setStatus('already-verified')
      } else {
        setStatus('success')
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/sign-in')
        }, 3000)
      }
    } else if (window.location.pathname === '/auth/verification-error') {
      setStatus('error')
      setErrorMessage(urlParams.get('error') || 'Verification failed')
    }
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 50% 30%, rgba(24, 106, 229, 0.3) 0%, transparent 70%),
                radial-gradient(ellipse 80% 60% at 30% 70%, rgba(34, 197, 94, 0.2) 0%, transparent 70%),
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
                  className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  variants={staggerItem}
                >
                  Verifying your email...
                </motion.h2>
                
                <motion.p 
                  className="text-lg text-gray-600 leading-relaxed"
                  variants={staggerItem}
                >
                  Please wait while we confirm your email address.
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
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
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  variants={staggerItem}
                >
                  Email verified!
                </motion.h2>
                
                <motion.p 
                  className="text-lg text-gray-600 leading-relaxed mb-2"
                  variants={staggerItem}
                >
                  Your account is now active. You can now sign in and start your 14-day free trial.
                </motion.p>
                
                <motion.p 
                  className="text-sm text-gray-500 font-medium mb-8"
                  variants={staggerItem}
                >
                  Redirecting to sign in page...
                </motion.p>
                
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-in"
                    className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Sign In Now
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (status === 'already-verified') {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 60% 80% at 50% 30%, rgba(24, 106, 229, 0.3) 0%, transparent 70%),
                radial-gradient(ellipse 80% 60% at 30% 70%, rgba(34, 197, 94, 0.2) 0%, transparent 70%),
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
                  className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-gray-900 mb-4"
                  variants={staggerItem}
                >
                  Already verified!
                </motion.h2>
                
                <motion.p 
                  className="text-lg text-gray-600 leading-relaxed mb-8"
                  variants={staggerItem}
                >
                  Your email address was already verified. You can sign in to access your account.
                </motion.p>
                
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-in"
                    className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Sign In
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Error state
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
                Verification failed
              </motion.h2>
              
              <motion.p 
                className="text-lg text-gray-600 leading-relaxed mb-8"
                variants={staggerItem}
              >
                {errorMessage || 'The verification link is invalid or has expired.'}
              </motion.p>
              
              <motion.div 
                className="space-y-4"
                variants={staggerContainer}
              >
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-up"
                    className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Create New Account
                  </Link>
                </motion.div>
                
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-in"
                    className="w-full flex justify-center py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                  >
                    Sign In Instead
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}