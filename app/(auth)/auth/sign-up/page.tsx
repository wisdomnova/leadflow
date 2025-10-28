'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/useAuthStore'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8 }
}

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

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuthStore()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    companyName: ''
  })
   
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return 
    }

    const result = await signUp(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.companyName
    )

    if (result.error) {
      setError(result.error) 
    } else if (result.requiresVerification) {
      // Redirect to success page with email parameter
      router.push(`/auth/signup-success?email=${encodeURIComponent(formData.email)}`)
    } else {
      // ✅ CHANGED: Redirect to onboarding instead of dashboard
      router.push('/onboarding')
    }
    
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-6 sm:px-12 lg:px-20 xl:px-24">
          <motion.div 
            className="mx-auto w-full max-w-sm lg:max-w-md"
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
                Start your free trial
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                No credit card required • Setup in 5 minutes
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-bold text-gray-900 mb-2">
                    First name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-bold text-gray-900 mb-2">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-bold text-gray-900 mb-2">
                  Company name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  placeholder="Acme Inc."
                />
              </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500 font-medium">
                  Must be at least 6 characters long
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-bold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Start Free Trial'
                )}
              </button>
            </motion.form>

            {/* Divider */}
            <motion.div 
              className="mt-8"
              variants={staggerItem}
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
                </div>
              </div>
            </motion.div>

            {/* Sign In Link */}
            <motion.div 
              className="mt-6"
              variants={staggerItem}
            >
              <Link 
                href="/auth/sign-in" 
                className="w-full flex justify-center items-center py-3 px-4 border-2 border-blue-600 rounded-xl text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all shadow-sm hover:shadow-md transform hover:scale-[1.02]"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side - Same Testimonial as Sign In */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:items-center lg:px-12 xl:px-16">
          <motion.div 
            className="max-w-lg text-center"
            initial="initial"
            animate="animate"
            variants={fadeInLeft}
          >
            {/* Quote Icon */}
            <motion.div 
              className="mb-8"
              variants={staggerItem}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                </svg>
              </div>
            </motion.div>

            <motion.blockquote 
              className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 leading-relaxed"
              variants={staggerItem}
            >
              "LeadFlow transformed our outreach completely. We went from 12% to 44% reply rates in just 3 weeks."
            </motion.blockquote>

            <motion.div 
              className="flex items-center justify-center space-x-4"
              variants={staggerItem}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Sarah Chen</div>
                <div className="text-sm text-gray-600">VP of Sales, TechFlow</div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="mt-12 grid grid-cols-2 gap-8"
              variants={staggerContainer}
            >
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div className="text-3xl font-bold text-gray-900 mb-2">+32%</div>
                <div className="text-sm text-gray-600 font-medium">Reply Rates</div>
              </motion.div>
              <motion.div 
                className="text-center"
                variants={staggerItem}
              >
                <div className="text-3xl font-bold text-gray-900 mb-2">5 min</div>
                <div className="text-sm text-gray-600 font-medium">Setup Time</div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}