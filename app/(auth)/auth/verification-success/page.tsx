'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, ArrowLeft, Shield, Users, TrendingUp } from 'lucide-react'

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

function VerificationSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const alreadyVerified = searchParams.get('already-verified')

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
                {alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
              </motion.h2>
              
              <motion.p 
                className="text-lg text-gray-600 leading-relaxed mb-8"
                variants={staggerItem}
              >
                {alreadyVerified  
                  ? 'Your email was already verified. You can now access your dashboard.'
                  : 'Your email address has been successfully verified. Welcome to LeadFlow!'
                }
              </motion.p>

              {/* Account Active Card */}
              <motion.div 
                className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8"
                variants={staggerItem}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-green-800 mb-3">
                      Account Active
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Full dashboard access enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">14-day free trial activated</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Import contacts and create campaigns</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="space-y-4"
                variants={staggerContainer}
              >
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/auth/sign-in"
                    className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Sign In to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </motion.div>
                
                <motion.div variants={staggerItem}>
                  <Link 
                    href="/"
                    className="w-full flex justify-center py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                  >
                    Learn More About LeadFlow
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

export default function VerificationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerificationSuccessContent />
    </Suspense>
  )
}