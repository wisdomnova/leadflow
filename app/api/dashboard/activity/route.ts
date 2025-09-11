// ./app/api/dashboard/activity/route.ts - Fixed activity route

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

    // Get recent email events as activity - using the SAME join as campaigns
    const { data: emailEvents, error: eventsError } = await supabase
      .from('email_events')
      .select(`
        *,
        campaigns!inner(organization_id, name)
      `)
      .eq('campaigns.organization_id', userData.organization_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (eventsError) {
      console.warn('Email events fetch error:', eventsError)
    }

    // Format activities from email events
    const activities: any[] = []

    if (emailEvents && emailEvents.length > 0) {
      emailEvents.forEach(event => {
        let message = ''
        const campaignName = event.campaigns?.name || 'Unknown Campaign'
        
        switch (event.event_type) {
          case 'sent':
            message = `Email sent in campaign "${campaignName}"`
            break
          case 'delivery':
            message = `Email delivered in campaign "${campaignName}"`
            break
          case 'open':
            message = `Email opened in campaign "${campaignName}"`
            break
          case 'click':
            message = `Email clicked in campaign "${campaignName}"`
            break
          case 'bounce':
            message = `Email bounced in campaign "${campaignName}"`
            break
          default:
            message = `Email ${event.event_type} in campaign "${campaignName}"`
        }

        activities.push({
          id: `email-${event.id}`,
          message,
          timestamp: new Date(event.created_at).toLocaleString()
        })
      }) 
    }

    // If no email events, show empty state
    if (activities.length === 0) {
      return NextResponse.json([])
    } 

    return NextResponse.json(activities)

  } catch (error) {
    console.error('Dashboard activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}