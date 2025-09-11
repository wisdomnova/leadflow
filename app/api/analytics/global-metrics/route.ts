// ./app/api/analytics/global-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const isPrevious = searchParams.get('previous') === 'true'
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user's organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''))
    const endDate = new Date()
    const startDate = new Date()
    
    if (isPrevious) {
      // For previous period, go back double the time range
      startDate.setDate(endDate.getDate() - (days * 2))
      endDate.setDate(endDate.getDate() - days)
    } else {
      // For current period
      startDate.setDate(endDate.getDate() - days)
    }

    console.log(`🔍 Analytics ${isPrevious ? 'PREVIOUS' : 'CURRENT'} - Date range:`, 
      startDate.toISOString(), 'to', endDate.toISOString())

    // Get campaigns with their events (EXACT same query as campaigns API)
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        campaign_contacts(id, contact_id),
        email_events(event_type, contact_id, created_at)
      `)
      .eq('organization_id', user.organization_id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString()) // Use lt for previous period

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    console.log(`🎯 Analytics ${isPrevious ? 'PREVIOUS' : 'CURRENT'} - Found campaigns:`, campaigns?.length || 0)

    // Process campaigns to calculate totals (EXACT same logic as campaigns API)
    let totalContacts = 0
    let totalDelivered = 0
    let totalOpened = 0
    let totalClicked = 0
    let totalBounced = 0

    campaigns?.forEach((campaign, index) => {
      const contacts = campaign.campaign_contacts || []
      const events = campaign.email_events || []
      
      // Get unique contacts for each event type (EXACT same logic)
      const deliveredContacts = new Set(events.filter((e: any) => e.event_type === 'delivery').map((e: any) => e.contact_id))
      const openedContacts = new Set(events.filter((e: any) => e.event_type === 'open').map((e: any) => e.contact_id))
      const clickedContacts = new Set(events.filter((e: any) => e.event_type === 'click').map((e: any) => e.contact_id))
      const bouncedContacts = new Set(events.filter((e: any) => e.event_type === 'bounce').map((e: any) => e.contact_id))
      
      totalContacts += contacts.length
      totalDelivered += deliveredContacts.size
      totalOpened += openedContacts.size
      totalClicked += clickedContacts.size
      totalBounced += bouncedContacts.size
    })

    // Calculate rates (EXACT same logic)
    const deliveryRate = totalContacts > 0 ? (totalDelivered / totalContacts) * 100 : 0
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
    const bounceRate = totalContacts > 0 ? (totalBounced / totalContacts) * 100 : 0

    const result = {
      totalSent: totalContacts,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      deliveryRate: Number(deliveryRate.toFixed(1)),
      openRate: Number(openRate.toFixed(1)),
      clickRate: Number(clickRate.toFixed(1)), 
      bounceRate: Number(bounceRate.toFixed(1))
    }

    console.log(`📊 Analytics ${isPrevious ? 'PREVIOUS' : 'CURRENT'} - FINAL RESULT:`, result)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Global metrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}