import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Calculate affiliate tier based on active referral count
 */
export async function calculateAffiliateTier(activeReferralCount: number): Promise<{
  tier: string
  discountPercentage: number
  description: string
}> {
  const { data: config, error } = await supabase
    .from('affiliate_discount_config')
    .select('*')
    .lte('min_referrals', activeReferralCount)
    .or(`max_referrals.is.null,max_referrals.gte.${activeReferralCount}`)
    .single()

  if (error || !config) {
    // Return starter tier by default
    return {
      tier: 'starter',
      discountPercentage: 100,
      description: 'Entry tier: 100% discount on Starter plan',
    }
  }

  return {
    tier: config.tier,
    discountPercentage: config.discount_percentage,
    description: config.description,
  }
}

/**
 * Count active referrals for an affiliate
 * Active = referred user has paid subscription that's been active 30+ days and not canceled
 */
export async function countActiveReferrals(affiliateId: string): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: referrals, error } = await supabase
    .from('affiliate_referrals')
    .select(
      `
      id,
      referred_user_id,
      signup_date,
      status
    `,
      { count: 'exact' }
    )
    .eq('affiliate_id', affiliateId)
    .eq('status', 'active')

  if (error) {
    console.error('Error counting active referrals:', error)
    return 0
  }

  return referrals?.length || 0
}

/**
 * Get all referral details with subscription info
 */
export async function getAffiliateReferrals(affiliateId: string) {
  const { data: referrals, error } = await supabase
    .from('affiliate_referrals')
    .select(
      `
      id,
      referred_user_id,
      signup_date,
      status,
      subscription_id,
      users!referred_user_id (
        id,
        email,
        full_name,
        stripe_subscription_id,
        created_at
      )
    `
    )
    .eq('affiliate_id', affiliateId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching affiliate referrals:', error)
    return []
  }

  return referrals || []
}

/**
 * Create or update affiliate referral record
 * Called when a new user signs up with a referral code
 */
export async function createAffiliateReferral(
  affiliateId: string,
  referredUserId: string,
  status: string = 'pending'
) {
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const { data, error } = await supabase
    .from('affiliate_referrals')
    .insert({
      affiliate_id: affiliateId,
      referred_user_id: referredUserId,
      status: status,
      thirty_day_mark_date: thirtyDaysFromNow,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating affiliate referral:', error)
    return null
  }

  return data
}

/**
 * Update referral status (mark as active once 30 days passed and user has paid subscription)
 */
export async function updateReferralStatus(
  referralId: string,
  status: 'active' | 'churned' | 'disqualified' | 'pending'
) {
  const { data, error } = await supabase
    .from('affiliate_referrals')
    .update({
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralId)
    .select()
    .single()

  if (error) {
    console.error('Error updating referral status:', error)
    return null
  }

  return data
}

/**
 * Recalculate and update affiliate tier
 * This should be called monthly on billing cycle or when referrals change
 */
export async function updateAffiliateTier(affiliateId: string) {
  // Count active referrals
  const activeCount = await countActiveReferrals(affiliateId)

  // Calculate new tier
  const tierInfo = await calculateAffiliateTier(activeCount)

  // Update user's affiliate_tier
  const { error: userError } = await supabase
    .from('users')
    .update({
      affiliate_tier: tierInfo.tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', affiliateId)

  if (userError) {
    console.error('Error updating user tier:', userError)
    return null
  }

  // Record tier history
  const { data: tierRecord, error: tierError } = await supabase
    .from('affiliate_tiers')
    .insert({
      user_id: affiliateId,
      tier: tierInfo.tier,
      active_referral_count: activeCount,
      discount_percentage: tierInfo.discountPercentage,
      effective_date: new Date().toISOString(),
    })
    .select()
    .single()

  if (tierError) {
    console.error('Error recording tier change:', tierError)
  }

  return {
    tier: tierInfo.tier,
    activeCount,
    discountPercentage: tierInfo.discountPercentage,
  }
}

/**
 * Get affiliate dashboard data
 */
export async function getAffiliateDashboard(affiliateId: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', affiliateId)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  const activeCount = await countActiveReferrals(affiliateId)
  const tierInfo = await calculateAffiliateTier(activeCount)
  const referrals = await getAffiliateReferrals(affiliateId)

  // Calculate savings based on plan prices
  // Assuming Starter = $29/mo, Professional = $99/mo
  const discountedPrice =
    tierInfo.tier === 'tier3'
      ? 0 // FREE Professional = $99 savings
      : tierInfo.tier === 'tier2'
        ? 0 // FREE Starter = $29 savings
        : (29 * (100 - tierInfo.discountPercentage)) / 100

  const monthlySavings =
    tierInfo.tier === 'tier3'
      ? 99
      : tierInfo.tier === 'tier2'
        ? 29
        : 29 - discountedPrice

  return {
    referralCode: user.referral_code,
    currentTier: tierInfo.tier,
    activeReferrals: activeCount,
    discountPercentage: tierInfo.discountPercentage,
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    affiliateStatus: user.affiliate_status,
    referralsSummary: {
      total: referrals.length,
      active: referrals.filter((r: any) => r.status === 'active').length,
      pending: referrals.filter((r: any) => r.status === 'pending').length,
      churned: referrals.filter((r: any) => r.status === 'churned').length,
    },
    nextTierThreshold: getTierThreshold(tierInfo.tier, activeCount),
  }
}

/**
 * Get threshold info for next tier
 */
function getTierThreshold(
  currentTier: string,
  currentCount: number
): { nextTier: string; referralsNeeded: number } {
  const tiers = [
    { tier: 'starter', min: 0, max: 0 },
    { tier: 'tier1', min: 1, max: 5 },
    { tier: 'tier2', min: 6, max: 10 },
    { tier: 'tier3', min: 11, max: 9999 },
  ]

  const currentTierIndex = tiers.findIndex((t) => t.tier === currentTier)
  const nextTierIndex = currentTierIndex + 1

  if (nextTierIndex >= tiers.length) {
    return { nextTier: 'max', referralsNeeded: 0 }
  }

  const nextTier = tiers[nextTierIndex]
  return {
    nextTier: nextTier.tier,
    referralsNeeded: Math.max(0, nextTier.min - currentCount),
  }
}
