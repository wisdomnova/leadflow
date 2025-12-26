/**
 * Feature Gating Component & Utility
 * Shows upgrade prompts when features are not available on current plan
 */

import Link from 'next/link'

interface UpgradePromptProps {
  feature: string
  currentPlan: string
  requiredPlan: string
}

export function FeatureGatePrompt({ feature, currentPlan, requiredPlan }: UpgradePromptProps) {
  const messages: Record<string, string> = {
    warmup: `Warmup is only available on ${requiredPlan} and above plans`,
    campaigns: `Limited campaigns available on ${currentPlan} plan`,
    advanced_analytics: `Advanced analytics available on Growth plan and above`,
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">{feature} Locked</h3>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">{messages[feature] || 'This feature is not available on your plan'}</p>
      <Link href="/billing" className="btn bg-blue-600 hover:bg-blue-700 text-white">
        View Upgrade Options
      </Link>
    </div>
  )
}

/**
 * Inline warning banner for when approaching limits
 */
interface LimitWarningProps {
  current: number
  limit: number
  featureName: string
}

export function LimitWarning({ current, limit, featureName }: LimitWarningProps) {
  const percentage = (current / limit) * 100

  if (limit === -1) return null // unlimited

  if (percentage >= 90) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
        <p className="text-sm text-orange-800 dark:text-orange-200">
          You're using {current} of {limit} {featureName} ({Math.round(percentage)}%). 
          <Link href="/billing" className="font-semibold hover:underline ml-1">Upgrade</Link>
        </p>
      </div>
    )
  }

  return null
}

/**
 * Check if user can create a new resource based on plan limit
 */
export function canCreateResource(limit: number, current: number): boolean {
  return limit === -1 || current < limit
}

/**
 * Get user-friendly message for plan comparison
 */
export function getPlanComparisonMessage(currentPlan: string, requiredPlan: string): string {
  const planHierarchy: Record<string, number> = {
    trial: 0,
    starter: 1,
    growth: 2,
    pro: 3,
  }

  if (planHierarchy[currentPlan] >= planHierarchy[requiredPlan]) {
    return `You have access to this feature on your ${currentPlan} plan`
  }

  return `Upgrade to ${requiredPlan} or higher to access this feature`
}
