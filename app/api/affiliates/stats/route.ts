import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { getAffiliateReferrals } from '@/lib/affiliate-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/affiliates/stats
 * Get detailed referral statistics and history
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
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get paginated referrals
    const { data: referrals, count, error } = await supabase
      .from('affiliate_referrals')
      .select(
        `
        id,
        referred_user_id,
        signup_date,
        status,
        subscription_id,
        thirty_day_mark_date,
        users!referred_user_id (
          id,
          email,
          full_name,
          stripe_subscription_id,
          created_at
        )
      `,
        { count: 'exact' }
      )
      .eq('affiliate_id', userId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referral stats:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Format referrals for response
    const formattedReferrals = referrals?.map((ref: any) => ({
      id: ref.id,
      email: ref.users?.email,
      name: ref.users?.full_name || 'Unknown',
      signupDate: ref.signup_date,
      status: ref.status,
      qualificationDate: ref.thirty_day_mark_date,
      subscriptionId: ref.subscription_id,
      createdAt: ref.users?.created_at,
    })) || []

    // Calculate stats
    const totalReferrals = count || 0
    const activeCount = referrals?.filter((r: any) => r.status === 'active').length || 0
    const pendingCount =
      referrals?.filter((r: any) => r.status === 'pending').length || 0
    const churnedCount = referrals?.filter((r: any) => r.status === 'churned').length || 0

    const totalPages = Math.ceil(totalReferrals / limit)

    return NextResponse.json({
      referrals: formattedReferrals,
      stats: {
        total: totalReferrals,
        active: activeCount,
        pending: pendingCount,
        churned: churnedCount,
      },
      pagination: {
        page,
        limit,
        pages: totalPages,
        total: totalReferrals,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
