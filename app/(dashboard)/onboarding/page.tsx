// app/(dashboard)/onboarding/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Mail, ArrowRight, Loader2, CheckCircle2, Users, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [emailAccounts, setEmailAccounts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    checkOnboardingStatus()
  }, [user])

  const checkOnboardingStatus = async () => {
    if (!user) {
      router.push('/auth/sign-in')
      return
    }

    // Check if user already has email account connected
    const { data: accounts } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'warming_up'])
      .limit(1)

    if (accounts && accounts.length > 0) {
      // User already completed onboarding
      router.push('/dashboard')
      return
    }

    // Fetch existing accounts (if any)
    const { data: allAccounts } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', user.id)

    setEmailAccounts(allAccounts || [])
    setLoading(false)
  }

  const handleConnectGoogle = () => {
    window.location.href = `/api/integrations/google/connect`
  }

  const handleConnectMicrosoft = () => {
    window.location.href = `/api/integrations/microsoft/connect`
  }

  const handleSkipOnboarding = () => {
    router.push('/dashboard?onboarding=skipped')
  }

  const handleContinueToDashboard = () => {
    router.push('/dashboard?onboarding=complete')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-12">
        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
          step >= 1 ? 'bg-blue-600 scale-110' : 'bg-gray-300'
        }`} />
        <div className={`h-0.5 w-16 transition-all duration-300 ${
          step >= 2 ? 'bg-blue-600' : 'bg-gray-300'
        }`} />
        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
          step >= 2 ? 'bg-blue-600 scale-110' : 'bg-gray-300'
        }`} />
      </div>

      {/* Step 1: Welcome & Email Connection */}
      {step === 1 && (
        <Card className="p-12 bg-white/80 backdrop-blur-sm border-2 shadow-xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to LeadFlow! 🎉
            </h1>
            <p className="text-muted-foreground text-lg">
              Let's get you set up in just 2 minutes
            </p>
          </div>

          <div className="space-y-6 mb-10">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-blue-50 border border-blue-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Connect Your Email</p>
                <p className="text-sm text-muted-foreground">
                  Send campaigns directly from your Gmail or Outlook account for maximum deliverability
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-green-50 border border-green-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">AI-Powered Sequences</p>
                <p className="text-sm text-muted-foreground">
                  Create personalized email sequences with AI suggestions in seconds
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-purple-50 border border-purple-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Track Everything</p>
                <p className="text-sm text-muted-foreground">
                  See opens, clicks, and replies in real-time with advanced analytics
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button 
            onClick={() => setStep(2)} 
            size="lg" 
            className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Card>
      )}

      {/* Step 2: Email Connection */}
      {step === 2 && (
        <Card className="p-12 bg-white/80 backdrop-blur-sm border-2 shadow-xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Connect Your Email Account</h2>
            <p className="text-muted-foreground text-lg">
              Choose your email provider to start sending campaigns
            </p>
          </div>

          {/* Email Provider Buttons */}
          <div className="space-y-4 mb-8">
            {/* Google */}
            <button
              onClick={handleConnectGoogle}
              className="w-full p-6 rounded-xl border-2 hover:border-blue-500 hover:shadow-lg transition-all bg-white group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-lg">Connect Gmail</p>
                  <p className="text-sm text-muted-foreground">Send emails from your Gmail account</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Microsoft */}
            <button
              onClick={handleConnectMicrosoft}
              className="w-full p-6 rounded-xl border-2 hover:border-blue-500 hover:shadow-lg transition-all bg-white group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M0 0h11v11H0z"/>
                    <path fill="#81bc06" d="M12 0h11v11H12z"/>
                    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                    <path fill="#ffba08" d="M12 12h11v11H12z"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-lg">Connect Outlook</p>
                  <p className="text-sm text-muted-foreground">Send emails from your Microsoft account</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>

          {/* Already Connected */}
          {emailAccounts.length > 0 && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Email Account Connected</p>
                  <p className="text-sm text-green-700">{emailAccounts[0].email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button 
              onClick={() => setStep(1)} 
              variant="outline"
              className="px-6"
            >
              Back
            </Button>
            <div className="flex gap-3">
              <Button 
                onClick={handleSkipOnboarding} 
                variant="ghost"
                className="px-6"
              >
                Skip for now
              </Button>
              {emailAccounts.length > 0 && (
                <Button 
                  onClick={handleContinueToDashboard}
                  className="px-8 shadow-lg"
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}