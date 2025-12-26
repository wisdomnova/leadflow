export const metadata = {
  title: 'Email Warmup - Mosaic',
  description: 'Warm up your sending domains to improve deliverability',
}

import { FeatureGatePrompt } from '@/components/feature-gate'

export default function WarmupPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Email Warmup</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Warm up your sending domains to improve email deliverability and sender reputation
        </p>
      </div>

      <FeatureGatePrompt 
        feature="Email Warmup" 
        currentPlan="trial" 
        requiredPlan="Starter"
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/60 p-6 opacity-50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Automatic Warmup</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically send emails to warm up your domain reputation
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/60 p-6 opacity-50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Daily Schedule</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gradually increase send volume with intelligent scheduling
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700/60 p-6 opacity-50">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Monitor Reputation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track sender score and domain reputation in real-time
          </p>
        </div>
      </div>
    </div>
  )
}
