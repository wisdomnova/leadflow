import { create } from 'zustand'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  organization_id: string | null 
  trial_ends_at: string | null
  subscription_status: string
  plan_type: string
  organizations?: { 
    id: string
    name: string 
  }
}

interface AuthState {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, firstName: string, lastName: string, companyName: string) => Promise<{ error?: string; requiresVerification?: boolean; email?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string; requiresVerification?: boolean; email?: string }>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  signUp: async (email: string, password: string, firstName: string, lastName: string, companyName: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, companyName })
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Signup failed' }
      }

      // Return success with verification requirement
      return { 
        requiresVerification: data.requiresVerification,
        email: email 
      }
    } catch (error) {
      return { error: 'Network error' }
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { 
          error: data.error || 'Sign in failed',
          requiresVerification: data.requiresVerification,
          email: data.email
        }
      }

      set({ user: data.user })
      return {}
    } catch (error) {
      return { error: 'Network error' }
    }
  },

  signOut: async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      set({ user: null })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  },

  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/me')
      
      if (response.ok) {
        const data = await response.json()
        set({ user: data.user })
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      set({ loading: false })
    }
  }
}))