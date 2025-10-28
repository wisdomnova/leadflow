'use client'

import { useEffect, useState } from 'react'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { AlertTriangle, CreditCard, X } from 'lucide-react' 
import Link from 'next/link'

export default function TrialExpiredModal() {
  const { isTrialActive, daysRemaining, subscriptionStatus, isLoading } = useTrialStatus()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Don't show modal while still loading
    if (isLoading) {
      setShowModal(false)
      return
    }

    // Only show modal if:
    // 1. User is still on trial status (not paid) 
    // 2. Trial is not active (expired) 
    // 3. Days remaining is 0 or negative
    const shouldShowModal = 
      subscriptionStatus === 'trial' && 
      !isTrialActive && 
      daysRemaining <= 0

    setShowModal(shouldShowModal)
  }, [isTrialActive, daysRemaining, subscriptionStatus, isLoading])

  // Don't show modal for paid users
  if (subscriptionStatus === 'active' || subscriptionStatus === 'paid') {
    return null
  }

  // Don't show modal while loading
  if (isLoading) {
    return null
  }

  if (!showModal) {
    return null
  } 

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Your Free Trial Has Ended
          </h3>
          
          <p className="text-sm text-gray-500 mb-6">
            To continue using LeadFlow and access all your data, please upgrade to a paid plan.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link
              href="/billing/upgrade"
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade Now
            </Link>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}