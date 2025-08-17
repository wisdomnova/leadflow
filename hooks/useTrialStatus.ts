import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'


interface TrialStatus {
  isTrialActive: boolean
  daysRemaining: number
  trialEndsAt: string | null
  subscriptionStatus: string
  planType: string
  isLoading: boolean
}

export function useTrialStatus(): TrialStatus { 
  const { user } = useAuth()
  const [status, setStatus] = useState<TrialStatus>({
    isTrialActive: false,
    daysRemaining: 0,
    trialEndsAt: null,
    subscriptionStatus: 'trial',
    planType: 'starter',
    isLoading: true
  })

  useEffect(() => {
    if (!user) {
      setStatus(prev => ({ ...prev, isLoading: false }))
      return
    }

    const trialEndsAt = user.trial_ends_at
    const subscriptionStatus = user.subscription_status || 'trial'
    const planType = user.plan_type || 'starter'

    if (!trialEndsAt) {
      setStatus({
        isTrialActive: false,
        daysRemaining: 0,
        trialEndsAt: null,
        subscriptionStatus,
        planType,
        isLoading: false
      })
      return
    }

    const now = new Date()
    const trialEnd = new Date(trialEndsAt)
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const isTrialActive = subscriptionStatus === 'trial' && daysRemaining > 0

    setStatus({
      isTrialActive,
      daysRemaining,
      trialEndsAt,
      subscriptionStatus,
      planType,
      isLoading: false
    })
  }, [user])

  return status
}