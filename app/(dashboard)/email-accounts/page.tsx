// app/(dashboard)/email-accounts/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, Trash2, RefreshCw, ArrowUpRight, Clock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

// Brand icons as SVG components
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const MicrosoftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#00A4EF" d="M13 1h10v10H13z"/>
    <path fill="#7FBA00" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
)

interface EmailAccount {
  id: string
  provider: 'google' | 'microsoft'
  email: string
  status: 'active' | 'paused' | 'disconnected' | 'error' | 'warming_up'
  daily_limit: number
  daily_sent: number
  warmup_stage: number
  warmup_started_at: string 
  last_sync_at: string | null
  last_error: string | null
  created_at: string
}

export default function EmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmailAccounts()
    } else if (!isAuthenticated && user === null) {
      // User is not authenticated and we're done loading
      setLoading(false)
    }
    
    // Check for OAuth callback success/error
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    
    if (success === 'connected') {
      // Show success message
      setTimeout(() => {
        window.history.replaceState({}, '', '/email-accounts')
      }, 3000)
    }
    
    if (error) {
      // Show error message
      console.error('OAuth error:', error)
      if (error === 'user_not_found') {
        // Redirect to sign in if user not found
        window.location.href = '/auth/sign-in?error=session_expired'
      }
    }
  }, [user, isAuthenticated])

  const fetchEmailAccounts = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const response = await fetch('/api/email-accounts')
      
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else {
        console.error('Failed to fetch email accounts:', response.statusText)
        setAccounts([])
      }
    } catch (error) {
      console.error('Error fetching email accounts:', error)
      setAccounts([])
    }
    
    setLoading(false)
  }

  const connectProvider = (provider: 'google' | 'microsoft') => {
    setConnecting(provider)
    window.location.href = `/api/integrations/${provider}/connect`
  }

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/email-accounts/${accountId}/disconnect`, {
        method: 'POST'
      })
      
      if (response.ok) {
        fetchEmailAccounts()
      } else {
        console.error('Failed to disconnect account')
      }
    } catch (error) {
      console.error('Error disconnecting account:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Active
        </Badge>
      case 'warming_up':
        return <Badge variant="default" className="flex items-center gap-1 bg-amber-100 text-amber-800 border-amber-200">
          <Loader2 className="w-3 h-3 animate-spin" /> Warming Up
        </Badge>
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>
      case 'error':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Error
        </Badge>
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getWarmupProgress = (account: EmailAccount) => {
    const stages = [20, 50, 100, 200, 'unlimited']
    const currentLimit = stages[account.warmup_stage - 1]
    const daysInStage = Math.floor(
      (Date.now() - new Date(account.warmup_started_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return {
      stage: account.warmup_stage,
      limit: currentLimit,
      daysInStage,
      totalStages: 5
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access email accounts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Accounts</h1>
        <p className="text-gray-600">
          Connect your Gmail or Outlook account to send campaigns directly from your email.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <GoogleIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Why connect your email?</h3>
            <p className="text-sm text-blue-800">
              Sending campaigns from your own email account (Gmail or Outlook) dramatically improves deliverability 
              and ensures your emails land in the inbox, not spam. We'll gradually warm up your account to maintain 
              your sender reputation.
            </p>
          </div>
        </div>
      </Card>

      {/* Connect Buttons */}
      {accounts.length === 0 && (
        <Card className="mb-6 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Your First Email Account</h2>
          <p className="text-gray-600 mb-6">
            Choose your email provider to get started
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Google OAuth Button */}
            <Button
              size="lg"
              onClick={() => connectProvider('google')}
              disabled={connecting === 'google'}
              className="flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all px-6 py-4 text-base font-medium h-16"
            >
              {connecting === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5" />
              )}
              Continue with Google
            </Button>

            {/* Microsoft OAuth Button - Disabled */}
            <div className="relative">
              <Button
                size="lg"
                disabled={true}
                className="flex items-center justify-center gap-3 bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed px-6 py-4 text-base font-medium h-16 w-full opacity-75"
              >
                <MicrosoftIcon className="w-5 h-5" />
                Continue with Microsoft
              </Button>
              <span className="absolute -top-2 -right-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Coming Soon
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Connected Accounts ({accounts.length})</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => connectProvider('google')}
                disabled={connecting === 'google'}
                className="flex items-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                {connecting === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleIcon className="w-4 h-4" />
                )}
                Add Gmail
              </Button>
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={true}
                  className="flex items-center gap-2 text-gray-500 border-gray-300 cursor-not-allowed opacity-75"
                >
                  <MicrosoftIcon className="w-4 h-4" />
                  Add Outlook
                </Button>
                <span className="absolute -top-2 -right-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Soon
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {accounts.map((account) => {
              const warmup = getWarmupProgress(account)
              const usagePercent = (account.daily_sent / account.daily_limit) * 100

              return (
                <Card key={account.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        {account.provider === 'google' ? (
                          <GoogleIcon className="w-6 h-6" />
                        ) : (
                          <MicrosoftIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{account.email}</h3>
                          {getStatusBadge(account.status)}
                        </div>
                        <p className="text-sm text-gray-600 capitalize">
                          {account.provider === 'google' ? 'Gmail' : 'Outlook'} Account
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Warm-up Progress */}
                  {account.status === 'warming_up' && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900">
                          Warm-up Stage {warmup.stage} of {warmup.totalStages}
                        </span>
                        <span className="text-sm text-amber-700">
                          Day {warmup.daysInStage} • Limit: {warmup.limit} emails/day
                        </span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div
                          className="bg-amber-600 h-2 rounded-full transition-all"
                          style={{ width: `${(warmup.stage / warmup.totalStages) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        We're gradually increasing your sending limit to maintain deliverability
                      </p>
                    </div>
                  )}

                  {/* Daily Usage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Today's Usage</span>
                      <span className="text-sm text-gray-600">
                        {account.daily_sent} / {account.daily_limit} emails sent
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          usagePercent >= 90 ? 'bg-red-600' : usagePercent >= 70 ? 'bg-amber-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {account.last_error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">Connection Error</p>
                          <p className="text-xs text-red-700 mt-1">{account.last_error}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => connectProvider(account.provider)}
                          >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Reconnect
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
                    <span>Connected {new Date(account.created_at).toLocaleDateString()}</span>
                    {account.last_sync_at && (
                      <span>Last synced {new Date(account.last_sync_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}