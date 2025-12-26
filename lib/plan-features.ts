/**
 * Plan Features Matrix
 * Defines what features are available for each subscription tier
 * PRODUCTION: This is used to enforce feature gating across the platform
 */

export interface PlanFeatures {
  id: string
  name: string
  campaignsEnabled: boolean
  campaignsLimit: number
  warmupEnabled: boolean
  warmupDomainsLimit: number
  inboxEnabled: boolean
  messagesEnabled: boolean
  emailsPerMonth: number
  contactsLimit: number
  users: number
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  trial: {
    id: 'trial',
    name: 'Trial',
    campaignsEnabled: true,
    campaignsLimit: 3,
    warmupEnabled: false,
    warmupDomainsLimit: 0,
    inboxEnabled: true,
    messagesEnabled: true,
    emailsPerMonth: 1000,
    contactsLimit: 100,
    users: 1,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    campaignsEnabled: true,
    campaignsLimit: 50,
    warmupEnabled: true,
    warmupDomainsLimit: 1,
    inboxEnabled: true,
    messagesEnabled: true,
    emailsPerMonth: 10000,
    contactsLimit: 5000,
    users: 1,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    campaignsEnabled: true,
    campaignsLimit: 500,
    warmupEnabled: true,
    warmupDomainsLimit: 5,
    inboxEnabled: true,
    messagesEnabled: true,
    emailsPerMonth: 100000,
    contactsLimit: 50000,
    users: 3,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    campaignsEnabled: true,
    campaignsLimit: -1, // unlimited
    warmupEnabled: true,
    warmupDomainsLimit: -1, // unlimited
    inboxEnabled: true,
    messagesEnabled: true,
    emailsPerMonth: 500000,
    contactsLimit: -1, // unlimited
    users: 10,
  },
}

/**
 * Get plan features for a given plan ID
 */
export function getPlanFeatures(planId: string): PlanFeatures {
  return PLAN_FEATURES[planId] || PLAN_FEATURES.trial
}

/**
 * Check if a feature is available for a plan
 */
export function hasFeature(planId: string, feature: keyof PlanFeatures): boolean {
  const plan = getPlanFeatures(planId)
  const value = plan[feature]
  
  if (typeof value === 'boolean') {
    return value
  }
  
  return false
}

/**
 * Get feature limit for a plan (campaigns, warmup domains, etc)
 */
export function getFeatureLimit(planId: string, limit: 'campaignsLimit' | 'warmupDomainsLimit' | 'emailsPerMonth' | 'contactsLimit'): number {
  const plan = getPlanFeatures(planId)
  const value = plan[limit]
  return typeof value === 'number' ? value : 0
}

/**
 * Check if user has reached limit for a feature
 */
export function hasReachedLimit(planId: string, limit: 'campaignsLimit' | 'warmupDomainsLimit', currentCount: number): boolean {
  const maxLimit = getFeatureLimit(planId, limit)
  return maxLimit > 0 && currentCount >= maxLimit
}

/**
 * Get remaining count for a feature
 */
export function getRemainingCount(planId: string, limit: 'campaignsLimit' | 'warmupDomainsLimit', currentCount: number): number {
  const maxLimit = getFeatureLimit(planId, limit)
  if (maxLimit === -1) return -1 // unlimited
  return Math.max(0, maxLimit - currentCount)
}

/**
 * Upgrade suggestion based on current plan and required feature
 */
export function getUpgradeSuggestion(planId: string, requiredFeature: string): string {
  const plan = getPlanFeatures(planId)
  
  const suggestions: Record<string, string> = {
    warmup: `Upgrade to ${plan.id === 'trial' ? 'Starter' : 'Growth'} to unlock warmup`,
    campaignsLimit: `You've reached your campaign limit. Upgrade to increase it.`,
    warmupDomainsLimit: `You've reached your warmup domain limit. Upgrade to add more.`,
  }
  
  return suggestions[requiredFeature] || 'Upgrade your plan to unlock this feature.'
}
