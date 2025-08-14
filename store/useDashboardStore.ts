import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalContacts: number
  activeCampaigns: number
  emailsSent: number
  openRate: number
  loading: boolean
}

interface Activity {
  id: string
  message: string
  timestamp: string
}

interface DashboardState {
  stats: DashboardStats
  recentActivity: Activity[]
  fetchStats: () => Promise<void>
  fetchRecentActivity: () => Promise<void>
  calculateTrialDays: (trialEndsAt: string) => number
  subscribeToRealtime: (organizationId: string) => void
  unsubscribeFromRealtime: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  let realtimeChannel: any = null

  return {
    stats: {
      totalContacts: 0,
      activeCampaigns: 0,
      emailsSent: 0,
      openRate: 0,
      loading: true
    },
    recentActivity: [],

    fetchStats: async () => {
      try {
        set(state => ({ stats: { ...state.stats, loading: true } }))
        
        const response = await fetch('/api/dashboard/stats')
        
        if (response.ok) {
          const data = await response.json()
          set({ stats: { ...data, loading: false } })
        } else {
          set(state => ({ stats: { ...state.stats, loading: false } }))
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        set(state => ({ stats: { ...state.stats, loading: false } }))
      }
    },

    fetchRecentActivity: async () => {
      try {
        const response = await fetch('/api/dashboard/activity')
        
        if (response.ok) {
          const data = await response.json()
          set({ recentActivity: data })
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error)
      }
    },

    calculateTrialDays: (trialEndsAt: string) => {
      const trialEnd = new Date(trialEndsAt)
      const now = new Date()
      const diffTime = trialEnd.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    },

    subscribeToRealtime: (organizationId: string) => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
      }

      realtimeChannel = supabase
        .channel('dashboard_updates')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `organization_id=eq.${organizationId}`
        }, (payload) => {
          const newActivity = {
            id: payload.new.id,
            message: payload.new.description,
            timestamp: new Date(payload.new.created_at).toLocaleString()
          }
          
          const { recentActivity } = get()
          set({ recentActivity: [newActivity, ...recentActivity.slice(0, 9)] })
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${organizationId}`
        }, () => {
          // Refresh stats when new contact is added
          get().fetchStats()
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${organizationId}`
        }, () => {
          // Refresh stats when new campaign is created
          get().fetchStats()
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${organizationId}`
        }, () => {
          // Refresh stats when campaign is updated
          get().fetchStats()
        })
        .subscribe()
    },

    unsubscribeFromRealtime: () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
        realtimeChannel = null
      }
    }
  }
})