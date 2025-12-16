'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmailSetup() {
  const router = useRouter()
  const [selectedProvider, setSelectedProvider] = useState<'gmail' | 'resend' | 'smtp' | 'skip' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Gmail
  const [gmailApiKey, setGmailApiKey] = useState('')

  // Resend
  const [resendApiKey, setResendApiKey] = useState('')

  // SMTP
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFromEmail, setSmtpFromEmail] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')

  const handleConnect = async () => {
    if (!selectedProvider) return

    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('You need to be logged in')
        setLoading(false)
        return
      }

      const payload: any = {
        providerType: selectedProvider,
      }

      // Validate provider-specific fields
      if (selectedProvider === 'gmail') {
        if (!gmailApiKey.trim()) {
          setError('Gmail API key is required')
          setLoading(false)
          return
        }
        payload.gmailAccessToken = gmailApiKey
        payload.gmailRefreshToken = gmailApiKey
      }

      if (selectedProvider === 'resend') {
        if (!resendApiKey.trim()) {
          setError('Resend API key is required')
          setLoading(false)
          return
        }
        payload.resendApiKey = resendApiKey
      }

      if (selectedProvider === 'smtp') {
        if (!smtpHost || !smtpUsername || !smtpPassword || !smtpFromEmail) {
          setError('All SMTP fields are required')
          setLoading(false)
          return
        }
        payload.smtpHost = smtpHost
        payload.smtpPort = parseInt(smtpPort.toString())
        payload.smtpUsername = smtpUsername
        payload.smtpPassword = smtpPassword
        payload.smtpFromEmail = smtpFromEmail
        payload.smtpFromName = smtpFromName || 'Leadflow'
      }

      const response = await fetch('/api/email-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Failed to setup email provider')
        setLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Email</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Choose how you want to send your campaigns</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Provider Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Gmail */}
          <button
            onClick={() => setSelectedProvider('gmail')}
            className={`p-6 rounded-lg border-2 transition-all ${
              selectedProvider === 'gmail'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="mb-3">
              <svg className="w-10 h-10 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Google Mail</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect via Gmail API key for reliable delivery</p>
          </button>

          {/* Resend */}
          <button
            onClick={() => setSelectedProvider('resend')}
            className={`p-6 rounded-lg border-2 transition-all ${
              selectedProvider === 'resend'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="mb-3">
              <svg className="w-10 h-10 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Resend</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Use your Resend API key with built-in tracking</p>
          </button>

          {/* SMTP */}
          <button
            onClick={() => setSelectedProvider('smtp')}
            className={`p-6 rounded-lg border-2 transition-all ${
              selectedProvider === 'smtp'
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="mb-3">
              <svg className="w-10 h-10 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">SMTP</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect any SMTP server manually</p>
          </button>
        </div>

        {/* Provider Configuration */}
        {selectedProvider === 'gmail' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Gmail Configuration</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gmail API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Paste your Gmail API key here"
                value={gmailApiKey}
                onChange={(e) => setGmailApiKey(e.target.value)}
                className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Get your API key from{' '}
                <a
                  href="https://console.developers.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>
          </div>
        )}

        {selectedProvider === 'resend' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Resend Configuration</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resend API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxx"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Get your API key from{' '}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 dark:text-violet-400 hover:underline"
                >
                  resend.com
                </a>
              </p>
            </div>
          </div>
        )}

        {selectedProvider === 'smtp' && (
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">SMTP Configuration</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SMTP Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                  className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="your-email@gmail.com"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="noreply@yourcompany.com"
                  value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                  className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  placeholder="Your Company"
                  value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                  className="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedProvider('skip')}
            disabled={loading}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            onClick={handleConnect}
            disabled={!selectedProvider || loading}
            className="px-8 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </div>
      </div>
    </main>
  )
}
