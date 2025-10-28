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
    isTrialActive: true, // Default to active to prevent flash
    daysRemaining: 14, // Default to 14 days to prevent flash
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

    const fetchTrialStatus = async () => {
      try {
        // Get trial data from the organization (from the user.organizations relationship)
        const organization = user.organizations
        const trialEndsAt = organization?.trial_ends_at || null
        const subscriptionStatus = user.subscription_status || organization?.subscription_status || 'trial'
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

        console.log('Trial status calculated:', {
          trialEndsAt,
          now: now.toISOString(),
          trialEnd: trialEnd.toISOString(),
          daysRemaining,
          subscriptionStatus,
          isTrialActive
        })

        setStatus({
          isTrialActive,
          daysRemaining,
          trialEndsAt,
          subscriptionStatus,
          planType,
          isLoading: false
        })
      } catch (error) {
        console.error('Error in fetchTrialStatus:', error)
        setStatus(prev => ({ ...prev, isLoading: false }))
      }
    }

    fetchTrialStatus()
  }, [user])

  return status
}