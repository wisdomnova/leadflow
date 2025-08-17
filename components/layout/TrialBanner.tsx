// 'use client'

// import { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { useAuthStore } from '@/store/useAuthStore'
// import { useDashboardStore } from '@/store/useDashboardStore'
// import { X, Zap, Clock } from 'lucide-react'

// export function TrialBanner() {
//   const { user } = useAuthStore()
//   const { calculateTrialDays } = useDashboardStore()
//   const [dismissed, setDismissed] = useState(false)
//   const [daysRemaining, setDaysRemaining] = useState(0)

//   useEffect(() => {
//     if (user?.trial_ends_at) {
//       const days = calculateTrialDays(user.trial_ends_at)
//       setDaysRemaining(days)
//     }
//   }, [user?.trial_ends_at, calculateTrialDays])

//   if (dismissed || user?.subscription_status !== 'trial' || daysRemaining <= 0) {
//     return null
//   }

//   const isUrgent = daysRemaining <= 3

//   return (
//     <div className={`${isUrgent ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white shadow-sm`}>
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-between py-3">
//           <div className="flex items-center space-x-3">
//             {isUrgent ? (
//               <Clock className="h-5 w-5 text-white" />
//             ) : (
//               <Zap className="h-5 w-5 text-white" />
//             )}
//             <div>
//               <p className="text-sm font-medium">
//                 {isUrgent ? (
//                   <>
//                     <span className="font-semibold">Trial expires in {daysRemaining} days</span> — Upgrade now to keep your campaigns running
//                   </>
//                 ) : (
//                   <>
//                     <span className="font-semibold">{daysRemaining} days left</span> in your free trial — Upgrade to unlock unlimited campaigns
//                   </>
//                 )}
//               </p>
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-3">
//             <Link
//               href="/settings/billing"
//               className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white text-blue-600 rounded-md hover:bg-gray-50 transition-colors"
//             >
//               <Zap className="h-4 w-4 mr-1.5" />
//               Upgrade Now
//             </Link>
//             <button
//               onClick={() => setDismissed(true)}
//               className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import { useTrialStatus } from '@/hooks/useTrialStatus'
import { Clock, X, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function TrialBanner() {
  const { isTrialActive, daysRemaining, subscriptionStatus } = useTrialStatus()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !isTrialActive || subscriptionStatus === 'active') {
    return null
  }

  const urgencyColor = daysRemaining <= 3 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
  const textColor = daysRemaining <= 3 ? 'text-red-800' : 'text-blue-800'
  const iconColor = daysRemaining <= 3 ? 'text-red-600' : 'text-blue-600'

  return (
    <div className={`${urgencyColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock className={`h-5 w-5 ${iconColor}`} />
          <div>
            <p className={`text-sm font-medium ${textColor}`}>
              {daysRemaining === 0 
                ? 'Your trial ends today' 
                : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left in your free trial`
              }
            </p>
            <p className="text-xs text-gray-600">
              Upgrade now to continue using all features without interruption
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/billing/upgrade"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Upgrade Now
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}