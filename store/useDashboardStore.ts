// ./store/useDashboardStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalContacts: number
  activeCampaigns: number
  emailsSent: number
  openRate: number
  emailsDelivered: number
  emailsOpened: number
  loading: boolean
}

interface PerformanceData {
  date: string
  sent: number
  opens: number
  replies: number
}

interface CampaignData {
  name: string
  emails: number
}

interface FunnelData {
  name: string
  value: number
  fill: string
}

interface Activity { 
  id: string
  message: string
  timestamp: string
}

interface DashboardState {
  stats: DashboardStats
  performanceData: PerformanceData[]
  campaignData: CampaignData[]
  funnelData: FunnelData[]
  recentActivity: Activity[]
  fetchStats: () => Promise<void>
  fetchPerformanceData: () => Promise<void>
  fetchCampaignData: () => Promise<void>
  fetchFunnelData: () => Promise<void>
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
      emailsDelivered: 0,
      emailsOpened: 0,
      loading: true
    },
    performanceData: [],
    campaignData: [],
    funnelData: [],
    recentActivity: [],

    fetchStats: async () => {
      try {
        set(state => ({ stats: { ...state.stats, loading: true } }))
        
        console.log('🔄 Fetching dashboard stats...')
        const response = await fetch('/api/dashboard/stats')
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Dashboard stats fetched:', data)
          set({ stats: { ...data, loading: false } })
        } else {
          console.error('❌ Failed to fetch stats:', response.statusText)
          set(state => ({ stats: { ...state.stats, loading: false } }))
        }
      } catch (error) {
        console.error('❌ Failed to fetch stats:', error)
        set(state => ({ stats: { ...state.stats, loading: false } }))
      }
    },

    fetchPerformanceData: async () => {
      try {
        console.log('🔄 Fetching performance data...')
        const response = await fetch('/api/dashboard/performance')
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Performance data fetched:', data)
          set({ performanceData: data })
        } else {
          console.error('❌ Failed to fetch performance data:', response.statusText)
        }
      } catch (error) {
        console.error('❌ Failed to fetch performance data:', error)
      }
    },

    fetchCampaignData: async () => {
      try {
        console.log('🔄 Fetching campaign data...')
        const response = await fetch('/api/dashboard/campaigns')
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Campaign data fetched:', data)
          set({ campaignData: data })
        } else {
          console.error('❌ Failed to fetch campaign data:', response.statusText)
        }
      } catch (error) {
        console.error('❌ Failed to fetch campaign data:', error)
      }
    },

    fetchFunnelData: async () => {
      try {
        console.log('🔄 Fetching funnel data...')
        const response = await fetch('/api/dashboard/funnel')
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Funnel data fetched:', data)
          set({ funnelData: data })
        } else {
          console.error('❌ Failed to fetch funnel data:', response.statusText)
        }
      } catch (error) {
        console.error('❌ Failed to fetch funnel data:', error)
      }
    },

    fetchRecentActivity: async () => {
      try {
        console.log('🔄 Fetching dashboard activity...')
        const response = await fetch('/api/dashboard/activity')
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Dashboard activity fetched:', data)
          set({ recentActivity: data })
        } else {
          console.error('❌ Failed to fetch activity:', response.statusText)
        }
      } catch (error) {
        console.error('❌ Failed to fetch activity:', error)
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

      console.log('🔄 Subscribing to real-time updates for org:', organizationId)

      realtimeChannel = supabase
        .channel('dashboard_updates')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'email_events'
        }, (payload) => {
          console.log('📧 New email event:', payload)
          // Refresh all dashboard data when new email event
          get().fetchStats()
          get().fetchPerformanceData()
          get().fetchFunnelData()
          get().fetchRecentActivity()
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `organization_id=eq.${organizationId}`
        }, (payload) => {
          console.log('👤 New contact:', payload)
          // Refresh stats when new contact is added
          get().fetchStats()
          get().fetchFunnelData()
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${organizationId}`
        }, (payload) => {
          console.log('📧 New campaign:', payload)
          // Refresh stats and campaign data when new campaign is created
          get().fetchStats()
          get().fetchCampaignData()
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${organizationId}`
        }, (payload) => {
          console.log('📧 Campaign updated:', payload)
          // Refresh stats and campaign data when campaign is updated
          get().fetchStats()
          get().fetchCampaignData()
        })
        .subscribe()
    },

    unsubscribeFromRealtime: () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
        realtimeChannel = null
        console.log('🔇 Unsubscribed from real-time updates')
      }
    }
  }
})