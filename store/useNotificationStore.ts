import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  user_id: string | null
  organization_id: string | null
  type: 'user' | 'organization' | 'system'
  category: string 
  title: string
  message: string
  action_url: string | null
  severity: 'info' | 'warning' | 'error' | 'success'
  read_at: string | null
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  subscribeToRealtime: (userId: string, organizationId: string) => void
  unsubscribeFromRealtime: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  let realtimeChannel: any = null

  return {
    notifications: [],
    unreadCount: 0,
    loading: true,

    fetchNotifications: async () => {
      try {
        set({ loading: true })

        const response = await fetch('/api/notifications')
        
        if (response.ok) {
          const notifications = await response.json()
          const unreadCount = notifications.filter((n: Notification) => !n.read_at).length
          
          set({ notifications, unreadCount, loading: false })
        } else {
          set({ loading: false })
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        set({ loading: false })
      }
    },

    markAsRead: async (id: string) => {
      try {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: 'POST'
        })

        if (response.ok) {
          const { notifications } = get()
          const updatedNotifications = notifications.map(n => 
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          )
          const unreadCount = updatedNotifications.filter(n => !n.read_at).length
          
          set({ notifications: updatedNotifications, unreadCount })
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },

    markAllAsRead: async () => {
      try {
        const response = await fetch('/api/notifications/read-all', {
          method: 'POST'
        })

        if (response.ok) {
          const { notifications } = get()
          const updatedNotifications = notifications.map(n => 
            ({ ...n, read_at: n.read_at || new Date().toISOString() })
          )
          
          set({ notifications: updatedNotifications, unreadCount: 0 })
        }
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    },

    subscribeToRealtime: (userId: string, organizationId: string) => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe()
      }

      realtimeChannel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId} OR (user_id=is.null AND organization_id=eq.${organizationId}) OR (user_id=is.null AND organization_id=is.null)`
        }, (payload) => {
          const newNotification = payload.new as Notification
          const { notifications, unreadCount } = get()
          
          set({
            notifications: [newNotification, ...notifications],
            unreadCount: unreadCount + 1
          })
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId} OR (user_id=is.null AND organization_id=eq.${organizationId}) OR (user_id=is.null AND organization_id=is.null)`
        }, (payload) => {
          const updatedNotification = payload.new as Notification
          const { notifications } = get()
          
          const updatedNotifications = notifications.map(n => 
            n.id === updatedNotification.id ? updatedNotification : n
          )
          const unreadCount = updatedNotifications.filter(n => !n.read_at).length
          
          set({ notifications: updatedNotifications, unreadCount })
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