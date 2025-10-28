import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Subscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan_id: string
  current_period_end: string
  cancel_at_period_end: boolean
  monthly_emails_sent: number
}

export function useAuth() {
  const [user, setUser] = useState<any | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get user data from your custom auth endpoint instead of Supabase Auth
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/me')

        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)

          // If user exists, fetch subscription
          if (userData.user) {
            const { data: sub } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', userData.user.id)
              .single()

            setSubscription(sub)
          }
        } else {
          setUser(null)
          setSubscription(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
        setSubscription(null)
      }

      setLoading(false)
    }

    getUser()

    // Set up polling for auth state changes (since we're not using Supabase Auth)
    const interval = setInterval(() => {
      getUser()
    }, 60000) // Check every minute

    return () => {
      clearInterval(interval)
    }
  }, [])

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setSubscription(null)
      window.location.href = '/auth/sign-in'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user,
    subscription,
    loading,
    signOut,
    isAuthenticated: !!user
  }
}