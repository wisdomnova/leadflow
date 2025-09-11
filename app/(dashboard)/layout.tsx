'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import TrialBanner from '@/components/layout/TrialBanner'
import TrialExpiredModal from '@/components/TrialExpiredModal'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { checkAuth, loading } = useAuthStore()

  useEffect(() => {
    checkAuth() 
  }, [checkAuth]) 
 
  if (loading) { 
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64"> 
        <Header />
        <TrialBanner />
        <main>
          <div className="mx-auto max-w-full px-6 py-2">
            {children}
          </div>
        </main>
      </div>
      
      {/* Trial Expired Modal */}
      <TrialExpiredModal />
    </div>
  )
}