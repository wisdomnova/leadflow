// ./store/useCampaignStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Campaign {
  from_email: string
  from_name: string 
  id: string 
  organization_id: string 
  name: string
  subject: string
  content: string 
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  type: 'one-time' | 'recurring' | 'sequence' | 'single'  // Added sequence and single
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  delivered: number
  opened: number 
  clicked: number
  created_at: string
  updated_at: string
  description?: string  // Added description field
  is_sequence?: boolean  // Added for sequence campaigns
  total_steps?: number   // Added for sequence campaigns
} 

interface CampaignState {
  campaigns: Campaign[]
  loading: boolean
  isLoading: boolean  // Added this alias
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
  get isLoading() {
    return get().loading  // Alias for loading
  },
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
      
      const campaignsData = await response.json()
      
      // Fetch recipient counts for each campaign
      const campaignsWithCounts = await Promise.all(
        campaignsData.map(async (campaign: any) => {
          try {
            // Get actual recipient count from campaign_contacts
            const contactsResponse = await fetch(`/api/campaigns/${campaign.id}/contacts`)
            const contacts = contactsResponse.ok ? await contactsResponse.json() : []
            
            // Calculate stats from actual campaign contacts
            const actualRecipients = contacts.length
            const sent = contacts.filter((c: any) => ['sent', 'delivered', 'opened', 'clicked'].includes(c.status)).length
            const opened = contacts.filter((c: any) => ['opened', 'clicked'].includes(c.status)).length
            const clicked = contacts.filter((c: any) => c.status === 'clicked').length
            
            return {
              ...campaign,
              total_recipients: actualRecipients, // Use actual count, not stored value
              sent,
              opened,
              clicked
            }
          } catch (error) {
            console.error(`Failed to fetch contacts for campaign ${campaign.id}:`, error)
            return {
              ...campaign,
              total_recipients: campaign.total_recipients || 0,
              sent: 0,
              opened: 0,
              clicked: 0
            }
          }
        })
      )
      
      console.log('Campaigns with recipient counts:', campaignsWithCounts)
      set({ campaigns: campaignsWithCounts || [], loading: false })

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
      set({ loading: true })  // Set loading during creation
      
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
        campaigns: [campaign, ...state.campaigns],
        loading: false
      }))

      return campaign

    } catch (error) {
      console.error('Create campaign failed:', error)
      set({ loading: false })  // Clear loading on error
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