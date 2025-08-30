// ./components/layout/TrialBanner.tsx - Simple and clean like Instantly.ai

'use client' 

import { useState } from 'react'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { X } from 'lucide-react'
import Link from 'next/link'

export default function TrialBanner() {
  const { isTrialActive, daysRemaining, subscriptionStatus } = useTrialStatus()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !isTrialActive || subscriptionStatus === 'active') {
    return null
  }

  return (
    <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex-1">
        <span className="text-sm">
          {daysRemaining === 0 
            ? 'Your trial ends today. ' 
            : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in your trial. `
          }
          <Link 
            href="/billing/upgrade" 
            className="underline hover:no-underline font-medium"
          >
            Upgrade now
          </Link>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/80 hover:text-white ml-4"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}