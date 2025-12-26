import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getAffiliateDashboard } from '@/lib/affiliate-utils'

/**
 * GET /api/affiliates/dashboard
 * Get affiliate dashboard data (stats, referrals, tier, savings)
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

    const dashboard = await getAffiliateDashboard(userId)

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error)
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
