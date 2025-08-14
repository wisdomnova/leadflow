import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent activity
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    // Format activities
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      message: activity.description,
      timestamp: new Date(activity.created_at).toLocaleString()
    })) || []

    return NextResponse.json(formattedActivities)

  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}