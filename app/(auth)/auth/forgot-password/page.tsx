'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Mail, Shield, Clock, Check } from 'lucide-react'

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSent(true)
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
    
    setLoading(false)
  }

  if (sent) {
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
                  We've sent a password reset link to
                </motion.p>
                
                <motion.p 
                  className="text-lg font-bold text-gray-900 mb-6"
                  variants={staggerItem}
                >
                  {email}
                </motion.p>

                {/* Security Info */}
                <motion.div 
                  className="bg-gray-50 rounded-2xl p-4 mb-8"
                  variants={staggerItem}
                >
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Expires in 1 hour</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Secure link</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-4"
                  variants={staggerContainer}
                >
                  <motion.button
                    onClick={() => setSent(false)}
                    className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                    variants={staggerItem}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try different email
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

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute right-0 top-0 w-[800px] h-[600px] opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 60% 80% at 70% 30%, rgba(24, 106, 229, 0.3) 0%, transparent 70%),
              radial-gradient(ellipse 80% 60% at 30% 70%, rgba(31, 190, 57, 0.2) 0%, transparent 70%),
              radial-gradient(ellipse 70% 70% at 80% 20%, rgba(147, 51, 234, 0.2) 0%, transparent 60%)
            `,
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-24">
        <motion.div 
          className="w-full max-w-sm lg:max-w-md"
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
            className="mb-8"
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

          {/* Header */}
          <motion.div 
            className="mb-8"
            variants={staggerItem}
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Reset your password
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Enter your email address and we'll send you a secure reset link
            </p>
          </motion.div>

          {/* Form */}
          <motion.form 
            className="space-y-6" 
            onSubmit={handleSubmit}
            variants={staggerItem}
          >
            {error && (
              <motion.div 
                className="bg-red-50 border border-red-200 rounded-xl p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                placeholder="john@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </motion.form>

          {/* Security Features */}
          <motion.div 
            className="mt-8 space-y-3"
            variants={staggerItem}
          >
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium">Secure encrypted link</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium">Expires in 1 hour</span>
            </div>
            <div className="flex items-center space-x-3">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 font-medium">No spam, just security</span>
            </div>
          </motion.div>

          {/* Back to Sign In */}
          <motion.div 
            className="mt-8"
            variants={staggerItem}
          >
            <Link 
              href="/auth/sign-in"
              className="inline-flex items-center text-blue-600 hover:text-blue-500 transition-colors group font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}