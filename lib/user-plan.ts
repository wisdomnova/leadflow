/**
 * Get current user's plan ID from their subscription
 * Used by API endpoints to enforce plan-based access control
 */

import { createClient } from '@supabase/supabase-js'
import { PLANS } from './plans'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getUserPlanId(userId: string): Promise<string> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('plan_id')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Error fetching user plan:', error)
      return 'trial' // default to trial
    }

    return user.plan_id || 'trial'
  } catch (error) {
    console.error('Error getting user plan:', error)
    return 'trial'
  }
}

/**
 * Check if user has a specific plan
 */
export async function userHasPlan(userId: string, planId: string): Promise<boolean> {
  const userPlan = await getUserPlanId(userId)
  return userPlan === planId
}

/**
 * Get all plans
 */
export function getAllPlans() {
  return PLANS
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: string) {
  return PLANS.find(p => p.id === planId)
}
