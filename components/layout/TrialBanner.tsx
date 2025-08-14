'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useDashboardStore } from '@/store/useDashboardStore'
import { X, Zap, Clock } from 'lucide-react'

export function TrialBanner() {
  const { user } = useAuthStore()
  const { calculateTrialDays } = useDashboardStore()
  const [dismissed, setDismissed] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)

  useEffect(() => {
    if (user?.trial_ends_at) {
      const days = calculateTrialDays(user.trial_ends_at)
      setDaysRemaining(days)
    }
  }, [user?.trial_ends_at, calculateTrialDays])

  if (dismissed || user?.subscription_status !== 'trial' || daysRemaining <= 0) {
    return null
  }

  const isUrgent = daysRemaining <= 3

  return (
    <div className={`${isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white shadow-sm`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            {isUrgent ? (
              <Clock className="h-5 w-5 text-white" />
            ) : (
              <Zap className="h-5 w-5 text-white" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isUrgent ? (
                  <>
                    <span className="font-semibold">Trial expires in {daysRemaining} days</span> — Upgrade now to keep your campaigns running
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{daysRemaining} days left</span> in your free trial — Upgrade to unlock unlimited campaigns
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/settings/billing"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white text-blue-600 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Upgrade Now
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}