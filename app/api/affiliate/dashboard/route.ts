// app/api/affiliate/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { AffiliateManager } from '@/lib/affiliate/affiliate-manager'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user's affiliate account
    const affiliate = await AffiliateManager.getAffiliateByUserId(decoded.userId)
    if (!affiliate) {
      return NextResponse.json({ error: 'No affiliate account found' }, { status: 404 })
    }

    // Get timeframe from query params
    const url = new URL(request.url)
    const timeframe = url.searchParams.get('timeframe') as 'day' | 'week' | 'month' | 'year' || 'month'

    // Get dashboard data
    const dashboard = await AffiliateManager.getAffiliateDashboard(affiliate.id, timeframe)

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        affiliate_code: affiliate.affiliate_code,
        referral_link: affiliate.referral_link,
        status: affiliate.status,
        total_referrals: affiliate.total_referrals,
        total_earnings: affiliate.total_earnings,
        pending_earnings: affiliate.pending_earnings,
        paid_earnings: affiliate.paid_earnings
      },
      ...dashboard
    })

  } catch (error) {
    console.error('Affiliate dashboard error:', error)
    return NextResponse.json({ error: 'Failed to get dashboard data' }, { status: 500 })
  }
}