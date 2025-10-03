// store/useInboxStore.ts
import { create } from 'zustand'
import { ReplyDetectionService, InboxMessage, EmailThread } from '@/lib/reply-detection'
import { supabase } from '@/lib/supabase'

interface InboxState {
  messages: (InboxMessage & { message_classifications?: any })[]
  threads: EmailThread[]
  loading: boolean
  currentView: 'messages' | 'threads'
  filter: 'all' | 'unread' | 'starred' | 'archived' | 'high_priority' | 'requires_attention'
  selectedMessages: string[]
  
  // AI Classification filters
  intentFilter: string
  sentimentFilter: string
  
  // Analytics
  analytics: {
    totalMessages: number
    intentBreakdown: Record<string, number>
    sentimentBreakdown: Record<string, number>
    priorityBreakdown: Record<string, number>
    averageConfidence: number
    requiresAttentionCount: number
    processingTimeAvg: number
  } | null
  
  // Pagination
  currentPage: number
  hasMore: boolean
  total: number
  
  // Actions
  fetchMessages: (organizationId: string, options?: any) => Promise<void>
  fetchThreads: (organizationId: string, options?: any) => Promise<void>
  fetchAnalytics: (organizationId: string, timeframe?: 'day' | 'week' | 'month') => Promise<void>
  markAsRead: (messageIds: string[], organizationId: string) => Promise<void>
  archiveMessages: (messageIds: string[], organizationId: string) => Promise<void>
  reclassifyMessage: (messageId: string, organizationId: string) => Promise<void>
  setFilter: (filter: 'all' | 'unread' | 'starred' | 'archived' | 'high_priority' | 'requires_attention') => void
  setIntentFilter: (intent: string) => void
  setSentimentFilter: (sentiment: string) => void
  setCurrentView: (view: 'messages' | 'threads') => void
  toggleMessageSelection: (messageId: string) => void
  clearSelection: () => void
  selectAll: () => void
  loadMore: (organizationId: string) => Promise<void>
  
  // Real-time updates
  subscribeToRealtime: (organizationId: string) => void
  unsubscribeFromRealtime: () => void
}

let realtimeChannel: any = null

export const useInboxStore = create<InboxState>((set, get) => ({
  messages: [],
  threads: [],
  loading: false,
  currentView: 'messages',
  filter: 'all',
  intentFilter: 'all',
  sentimentFilter: 'all',
  selectedMessages: [],
  analytics: null,
  currentPage: 1,
  hasMore: false,
  total: 0,

  fetchMessages: async (organizationId: string, options = {}) => {
    try {
      set({ loading: true })
      
      const { filter, intentFilter, sentimentFilter, currentPage } = get()
      const result = await ReplyDetectionService.getInboxMessages(organizationId, {
        page: 1, // Always start fresh when filters change
        limit: 50,
        filter,
        intentFilter: intentFilter !== 'all' ? intentFilter : undefined,
        sentimentFilter: sentimentFilter !== 'all' ? sentimentFilter : undefined,
        ...options
      })
      
      set({
        messages: result.messages,
        total: result.total,
        hasMore: result.hasMore,
        currentPage: 1,
        loading: false
      })
      
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      set({ loading: false })
    }
  },

  loadMore: async (organizationId: string) => {
    try {
      const { currentPage, hasMore, loading, filter, intentFilter, sentimentFilter, messages } = get()
      
      if (loading || !hasMore) return
      
      set({ loading: true })
      
      const nextPage = currentPage + 1
      const result = await ReplyDetectionService.getInboxMessages(organizationId, {
        page: nextPage,
        limit: 50,
        filter,
        intentFilter: intentFilter !== 'all' ? intentFilter : undefined,
        sentimentFilter: sentimentFilter !== 'all' ? sentimentFilter : undefined
      })
      
      set({
        messages: [...messages, ...result.messages],
        currentPage: nextPage,
        hasMore: result.hasMore,
        loading: false
      })
      
    } catch (error) {
      console.error('Failed to load more messages:', error)
      set({ loading: false })
    }
  },

  fetchThreads: async (organizationId: string, options = {}) => {
    try {
      set({ loading: true })
      
      const { currentPage } = get()
      const result = await ReplyDetectionService.getEmailThreads(organizationId, {
        page: 1, // Always start fresh
        limit: 20,
        ...options
      })
      
      set({
        threads: result.threads,
        total: result.total,
        hasMore: result.hasMore,
        currentPage: 1,
        loading: false
      })
      
    } catch (error) {
      console.error('Failed to fetch threads:', error)
      set({ loading: false })
    }
  },

  fetchAnalytics: async (organizationId: string, timeframe: 'day' | 'week' | 'month' = 'week') => {
    try {
      const analytics = await ReplyDetectionService.getClassificationAnalytics(organizationId, timeframe)
      set({ analytics })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  },

  markAsRead: async (messageIds: string[], organizationId: string) => {
    try {
      await ReplyDetectionService.markAsRead(messageIds, organizationId)
      
      // Update local state
      set(state => ({
        messages: state.messages.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      }))
      
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  },

  archiveMessages: async (messageIds: string[], organizationId: string) => {
    try {
      await ReplyDetectionService.archiveMessages(messageIds, organizationId)
      
      // Remove from current view if not showing archived
      const { filter } = get()
      if (filter !== 'archived') {
        set(state => ({
          messages: state.messages.filter(msg => !messageIds.includes(msg.id)),
          total: Math.max(0, state.total - messageIds.length)
        }))
      }
      
    } catch (error) {
      console.error('Failed to archive messages:', error)
    }
  },

  reclassifyMessage: async (messageId: string, organizationId: string) => {
    try {
      await ReplyDetectionService.reclassifyMessage(messageId, organizationId)
      
      // Refresh the specific message to get updated classification
      const { messages } = get()
      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      
      if (messageIndex !== -1) {
        // Fetch updated message with new classification
        const { data: updatedMessage } = await supabase
          .from('inbox_messages')
          .select(`
            *,
            campaigns:campaign_id(id, name),
            contacts:contact_id(id, email, first_name, last_name, company),
            message_classifications(
              intent,
              sentiment,
              confidence,
              reasoning,
              suggested_response,
              priority,
              tags,
              requires_human_attention,
              next_action,
              ai_model,
              processing_time_ms
            )
          `)
          .eq('id', messageId)
          .single()

        if (updatedMessage) {
          set(state => ({
            messages: state.messages.map((msg, index) => 
              index === messageIndex ? updatedMessage : msg
            )
          }))
        }
      }
      
    } catch (error) {
      console.error('Failed to reclassify message:', error)
      throw error
    }
  },

  setFilter: (filter) => {
    set({ 
      filter, 
      currentPage: 1, 
      messages: [], 
      threads: [],
      hasMore: false 
    })
  },

  setIntentFilter: (intent) => {
    set({ 
      intentFilter: intent, 
      currentPage: 1, 
      messages: [], 
      threads: [],
      hasMore: false 
    })
  },

  setSentimentFilter: (sentiment) => {
    set({ 
      sentimentFilter: sentiment, 
      currentPage: 1, 
      messages: [], 
      threads: [],
      hasMore: false 
    })
  },

  setCurrentView: (view) => {
    set({ 
      currentView: view, 
      currentPage: 1, 
      messages: [], 
      threads: [],
      hasMore: false 
    })
  },

  toggleMessageSelection: (messageId) => {
    set(state => ({
      selectedMessages: state.selectedMessages.includes(messageId)
        ? state.selectedMessages.filter(id => id !== messageId)
        : [...state.selectedMessages, messageId]
    }))
  },

  clearSelection: () => {
    set({ selectedMessages: [] })
  },

  selectAll: () => {
    const { messages } = get()
    set({ selectedMessages: messages.map(msg => msg.id) })
  },

  subscribeToRealtime: (organizationId: string) => {
    try {
      // Unsubscribe from existing channel if any
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }

      // Subscribe to inbox messages changes
      realtimeChannel = supabase
        .channel('inbox-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'inbox_messages',
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => {
            console.log('New message received:', payload.new)
            
            // Add new message to the top of the list if it matches current filters
            const { filter, intentFilter, sentimentFilter } = get()
            
            // For simplicity, just refresh messages when a new one comes in
            // In production, you might want to be more selective based on filters
            if (filter === 'all' || filter === 'unread') {
              // Refresh messages to include the new one with full data
              const state = get()
              if (state.messages.length > 0) {
                // Only refresh if we have messages loaded
                state.fetchMessages(organizationId)
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'inbox_messages',
            filter: `organization_id=eq.${organizationId}`,
          },
          (payload) => {
            console.log('Message updated:', payload.new)
            
            // Update the specific message in local state
            set(state => ({
              messages: state.messages.map(msg =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            }))
          }
        )
        .subscribe((status) => {
          console.log('Inbox realtime subscription status:', status)
        })

      console.log('Subscribed to inbox realtime updates for org:', organizationId)
      
    } catch (error) {
      console.error('Failed to subscribe to realtime updates:', error)
    }
  },

  unsubscribeFromRealtime: () => {
    try {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
        realtimeChannel = null
        console.log('Unsubscribed from inbox realtime updates')
      }
    } catch (error) {
      console.error('Failed to unsubscribe from realtime updates:', error)
    }
  }
}))

// Helper function to get filter display information
export const getFilterInfo = (filter: string) => {
  const filterMap = {
    all: { label: 'All Messages', count: 0 },
    unread: { label: 'Unread', count: 0 },
    starred: { label: 'Starred', count: 0 },
    archived: { label: 'Archived', count: 0 },
    high_priority: { label: 'High Priority', count: 0 },
    requires_attention: { label: 'Needs Attention', count: 0 }
  }
  
  return filterMap[filter as keyof typeof filterMap] || filterMap.all
}

// Helper function to get intent display information
export const getIntentInfo = (intent: string) => {
  const intentMap = {
    all: { label: 'All Intents', color: '#6b7280' },
    interested: { label: 'Interested', color: '#10b981' },
    not_interested: { label: 'Not Interested', color: '#ef4444' },
    objection: { label: 'Objection', color: '#f59e0b' },
    question: { label: 'Question', color: '#6366f1' },
    auto_reply: { label: 'Auto Reply', color: '#6b7280' },
    neutral: { label: 'Neutral', color: '#6b7280' },
    complaint: { label: 'Complaint', color: '#dc2626' }
  }
  
  return intentMap[intent as keyof typeof intentMap] || intentMap.all
}

// Helper function to get sentiment display information
export const getSentimentInfo = (sentiment: string) => {
  const sentimentMap = {
    all: { label: 'All Sentiments', color: '#6b7280' },
    positive: { label: 'Positive', color: '#10b981' },
    negative: { label: 'Negative', color: '#ef4444' },
    neutral: { label: 'Neutral', color: '#6b7280' }
  }
  
  return sentimentMap[sentiment as keyof typeof sentimentMap] || sentimentMap.all
} 

// Helper function to calculate message statistics
export const getMessageStats = (messages: any[]) => {
  const stats = {
    total: messages.length,
    unread: messages.filter(m => !m.is_read).length,
    starred: messages.filter(m => m.is_starred).length,
    highPriority: messages.filter(m => m.message_classifications?.priority === 'high').length,
    requiresAttention: messages.filter(m => m.message_classifications?.requires_human_attention).length,
    byIntent: {} as Record<string, number>,
    bySentiment: {} as Record<string, number>
  }
  
  messages.forEach(message => {
    const classification = message.message_classifications
    if (classification) {
      stats.byIntent[classification.intent] = (stats.byIntent[classification.intent] || 0) + 1
      stats.bySentiment[classification.sentiment] = (stats.bySentiment[classification.sentiment] || 0) + 1
    }
  })
  
  return stats
}