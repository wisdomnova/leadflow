import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { updateAffiliateTier, getAffiliateDashboard } from '@/lib/affiliate-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Generate unique referral code
 */
function generateReferralCode(email: string): string {
  const random = Math.random().toString(36).substring(2, 8)
  const emailPart = email.split('@')[0].substring(0, 8)
  return `${emailPart}-${random}`.toLowerCase()
}

/**
 * POST /api/affiliates/apply
 * Apply to affiliate program (auto-accepted)
 * Free users must upgrade to Starter first
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already an affiliate
    if (user.is_affiliate) {
      return NextResponse.json(
        { error: 'Already an affiliate member' },
        { status: 400 }
      )
    }

    // Check if on free plan - must upgrade to Starter
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', user.plan_id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.id === 'trial' || plan.id === 'free') {
      return NextResponse.json(
        { error: 'Must upgrade to Starter plan to join affiliate program' },
        { status: 400 }
      )
    }

    // Generate referral code
    const referralCode = generateReferralCode(user.email)

    // Update user as affiliate
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_affiliate: true,
        affiliate_status: 'active',
        referral_code: referralCode,
        affiliate_tier: 'starter',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user to affiliate:', updateError)
      return NextResponse.json(
        { error: 'Failed to activate affiliate status' },
        { status: 500 }
      )
    }

    // Record application
    const { error: appError } = await supabase
      .from('affiliate_applications')
      .insert({
        user_id: userId,
        status: 'approved',
        approved_date: new Date().toISOString(),
      })

    if (appError) {
      console.error('Error recording application:', appError)
    }

    // Initialize tier record
    const { error: tierError } = await supabase
      .from('affiliate_tiers')
      .insert({
        user_id: userId,
        tier: 'starter',
        active_referral_count: 0,
        discount_percentage: 100,
        effective_date: new Date().toISOString(),
      })

    if (tierError) {
      console.error('Error initializing tier:', tierError)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined affiliate program',
      referralCode: referralCode,
      affiliateStatus: 'active',
      tier: 'starter',
    })
  } catch (error) {
    console.error('Error applying to affiliate program:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/affiliates/apply
 * Check if user can apply (returns eligibility status)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get user and plan
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.is_affiliate) {
      return NextResponse.json({
        canApply: false,
        reason: 'Already an affiliate member',
        referralCode: user.referral_code,
      })
    }

    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', user.plan_id)
      .single()

    if (plan?.id === 'trial' || plan?.id === 'free') {
      return NextResponse.json({
        canApply: false,
        reason: 'Must be on a paid plan to join',
        requiredAction: 'upgrade_to_starter',
      })
    }

    return NextResponse.json({
      canApply: true,
      reason: 'Eligible to join affiliate program',
      currentPlan: plan?.name,
    })
  } catch (error) {
    console.error('Error checking affiliate eligibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
