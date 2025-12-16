'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthHeader from '../auth-header'
import AuthImage from '../auth-image'
import { PLANS } from '@/lib/plans'

export default function SignUp() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('trial')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('Designer')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreeToEmails, setAgreeToEmails] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!email || !fullName || !companyName || !role || !password || !confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          companyName,
          role,
          planId: selectedPlan,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Something went wrong')
        setLoading(false)
        return
      }

      // Store JWT token
      localStorage.setItem('token', data.token)
      
      // Redirect to email setup instead of dashboard
      router.push('/email-setup')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="bg-white dark:bg-gray-900">

      <div className="relative md:flex">

        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col after:flex-1">

            <AuthHeader />

            <div className="max-w-sm mx-auto w-full px-4 py-8">
              <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">Create your Account</h1>
              {/* Form */}
              <form onSubmit={handleSignUp}>
                <div className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="email">Email Address <span className="text-red-500">*</span></label>
                    <input 
                      id="email" 
                      className="form-input w-full" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      id="name" 
                      className="form-input w-full" 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="company">Company Name <span className="text-red-500">*</span></label>
                    <input 
                      id="company" 
                      className="form-input w-full" 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="role">Your Role <span className="text-red-500">*</span></label>
                    <select 
                      id="role" 
                      className="form-select w-full"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option>Designer</option>
                      <option>Developer</option>
                      <option>Accountant</option>
                      <option>Marketing</option>
                      <option>Sales</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="plan">Select Plan <span className="text-red-500">*</span></label>
                    <select 
                      id="plan" 
                      className="form-select w-full"
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      required
                    >
                      {PLANS.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price}/month
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="password">Password <span className="text-red-500">*</span></label>
                    <input 
                      id="password" 
                      className="form-input w-full" 
                      type="password" 
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></label>
                    <input 
                      id="confirmPassword" 
                      className="form-input w-full" 
                      type="password" 
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="mr-1">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="form-checkbox"
                        checked={agreeToEmails}
                        onChange={(e) => setAgreeToEmails(e.target.checked)}
                      />
                      <span className="text-sm ml-2">Email me about product news.</span>
                    </label>
                  </div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white ml-3 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </form>
              {/* Footer */}
              <div className="pt-5 mt-6 border-t border-gray-100 dark:border-gray-700/60">
                <div className="text-sm">
                  Have an account? <Link className="font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/signin">Sign In</Link>
                </div>
              </div>
            </div>

          </div>
        </div>

        <AuthImage />

      </div>

    </main>
  )
}
