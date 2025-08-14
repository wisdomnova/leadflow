import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  organization_id: string
  name: string
  subject: string
  content: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  type: 'one-time' | 'recurring'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  delivered: number
  opened: number
  clicked: number
  created_at: string
  updated_at: string
}

interface CampaignState {
  campaigns: Campaign[]
  loading: boolean
  searchQuery: string
  statusFilter: string
  
  // Actions
  fetchCampaigns: () => Promise<void>
  searchCampaigns: (query: string) => void
  filterByStatus: (status: string) => void
  createCampaign: (data: Partial<Campaign>) => Promise<Campaign>
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  duplicateCampaign: (id: string) => Promise<void>
  subscribeToRealtime: (organizationId: string) => void
  unsubscribeFromRealtime: () => void
}

let realtimeChannel: any = null

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  loading: false,
  searchQuery: '',
  statusFilter: 'all',

  fetchCampaigns: async () => {
    try {
      set({ loading: true })
      
      const response = await fetch('/api/campaigns')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to fetch campaigns')
      }
      
      const campaigns = await response.json()
      set({ campaigns: campaigns || [], loading: false })

    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      set({ loading: false })
    }
  },

  searchCampaigns: (query: string) => {
    set({ searchQuery: query })
  },

  filterByStatus: (status: string) => {
    set({ statusFilter: status })
  },

  createCampaign: async (data: Partial<Campaign>) => {
    try {
      console.log('Creating campaign with data:', data)
      
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to create campaign')
      }

      const campaign = await response.json()
      console.log('Campaign created:', campaign)
      
      // Add to local state
      set(state => ({
        campaigns: [campaign, ...state.campaigns]
      }))

      return campaign

    } catch (error) {
      console.error('Create campaign failed:', error)
      throw error
    }
  },

  updateCampaign: async (id: string, data: Partial<Campaign>) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      const updatedCampaign = await response.json()

      // Update local state
      set(state => ({
        campaigns: state.campaigns.map(c => c.id === id ? updatedCampaign : c)
      }))

    } catch (error) {
      console.error('Update failed:', error)
      throw error
    }
  },

  deleteCampaign: async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Remove from local state
      set(state => ({
        campaigns: state.campaigns.filter(c => c.id !== id)
      }))

    } catch (error) {
      console.error('Delete failed:', error)
      throw error
    }
  },

  duplicateCampaign: async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Duplicate failed')
      }

      const duplicatedCampaign = await response.json()
      
      // Add to local state
      set(state => ({
        campaigns: [duplicatedCampaign, ...state.campaigns]
      }))

    } catch (error) {
      console.error('Duplicate failed:', error)
      throw error
    }
  },

  subscribeToRealtime: (organizationId: string) => {
    if (realtimeChannel) {
      get().unsubscribeFromRealtime()
    }

    realtimeChannel = supabase
      .channel('campaigns_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('Campaign real-time update:', payload)
          
          const { eventType, new: newRecord, old: oldRecord } = payload

          set(state => {
            switch (eventType) {
              case 'INSERT':
                return {
                  campaigns: [newRecord as Campaign, ...state.campaigns]
                }
              case 'UPDATE':
                return {
                  campaigns: state.campaigns.map(campaign =>
                    campaign.id === newRecord.id ? newRecord as Campaign : campaign
                  )
                }
              case 'DELETE':
                return {
                  campaigns: state.campaigns.filter(campaign => 
                    campaign.id !== oldRecord.id
                  )
                }
              default:
                return state
            }
          })
        }
      )
      .subscribe()
  },

  unsubscribeFromRealtime: () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }
}))