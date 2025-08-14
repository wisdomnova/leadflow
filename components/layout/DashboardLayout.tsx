'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useCampaignStore } from '@/store/useCampaignStore'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, loading } = useAuthStore()
  const { subscribeToRealtime, unsubscribeFromRealtime } = useDashboardStore()
  const { subscribeToRealtime: subscribeToCampaigns, unsubscribeFromRealtime: unsubscribeFromCampaigns } = useCampaignStore()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user?.organization_id) {
      // Subscribe to dashboard real-time updates
      subscribeToRealtime(user.organization_id)
      
      // Subscribe to campaign real-time updates
      subscribeToCampaigns(user.organization_id)
    }

    return () => {
      unsubscribeFromRealtime()
      unsubscribeFromCampaigns()
    }
  }, [user, loading, router, subscribeToRealtime, unsubscribeFromRealtime, subscribeToCampaigns, unsubscribeFromCampaigns])

  // Subscribe to real-time updates for dashboard
  useEffect(() => {
    if (user?.organization_id) {
      subscribeToRealtime(user.organization_id)
      subscribeToCampaigns(user.organization_id)
    }

    return () => {
      unsubscribeFromRealtime()
      unsubscribeFromCampaigns()
    }
  }, [user?.organization_id, subscribeToRealtime, unsubscribeFromRealtime, subscribeToCampaigns, unsubscribeFromCampaigns])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}