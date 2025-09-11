// ./app/api/campaigns/[id]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
 
    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify campaign belongs to user's organization
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, organization_id')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get email events with contact information
    const { data: events, error: eventsError } = await supabase
      .from('email_events')
      .select(`
        *,
        campaign_contacts!inner(email, first_name, last_name)
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (eventsError) {
      console.error('Events query error:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Format events with contact information
    const formattedEvents = events?.map(event => ({
      ...event,
      contact_email: event.campaign_contacts?.email,
      contact_name: `${event.campaign_contacts?.first_name || ''} ${event.campaign_contacts?.last_name || ''}`.trim()
    })) || []

    return NextResponse.json({ events: formattedEvents })

  } catch (error) {
    console.error('Email events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}