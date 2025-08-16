import { create } from 'zustand'

interface PasswordResetState {
  loading: boolean
  error: string | null
  success: boolean
  forgotPassword: (email: string) => Promise<{ error?: string }>
  resetPassword: (token: string, password: string) => Promise<{ error?: string }>
  clearError: () => void
  reset: () => void
}

export const usePasswordResetStore = create<PasswordResetState>((set, get) => ({
  loading: false,
  error: null,
  success: false,

  forgotPassword: async (email: string) => {
    set({ loading: true, error: null })
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        set({ loading: false, success: true })
        return {}
      } else {
        const error = data.error || 'Failed to send reset email'
        set({ loading: false, error })
        return { error }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      set({ loading: false, error: errorMessage })
      return { error: errorMessage }
    }
  },

  resetPassword: async (token: string, password: string) => {
    set({ loading: true, error: null })
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        set({ loading: false, success: true })
        return {}
      } else {
        const error = data.error || 'Failed to reset password'
        set({ loading: false, error })
        return { error }
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.'
      set({ loading: false, error: errorMessage })
      return { error: errorMessage }
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set({ loading: false, error: null, success: false })
}))