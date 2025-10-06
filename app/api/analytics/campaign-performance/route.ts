// ./app/api/analytics/campaign-performance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
     
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
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log('📊 Campaign Performance - Date range:', startDate.toISOString())

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
      .gte('created_at', startDate.toISOString()) // Filter campaigns created in time range

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch campaign performance' }, { status: 500 })
    }

    console.log('📊 Campaign Performance - Found campaigns:', campaigns?.length || 0)

    // Process campaigns to calculate performance (EXACT same logic as campaigns API)
    const campaignPerformance = campaigns?.map((campaign, index) => {
      const contacts = campaign.campaign_contacts || []
      const events = campaign.email_events || []
      
      console.log(`📈 Campaign ${index + 1} "${campaign.name}":`, {
        contacts: contacts.length,
        events: events.length
      })
      
      // Get unique contacts for each event type (EXACT same logic)
      const deliveredContacts = new Set(events.filter((e: any) => e.event_type === 'delivery').map((e: any) => e.contact_id))
      const openedContacts = new Set(events.filter((e: any) => e.event_type === 'open').map((e: any) => e.contact_id))
      const clickedContacts = new Set(events.filter((e: any) => e.event_type === 'click').map((e: any) => e.contact_id))
      
      const sent = contacts.length
      const delivered = deliveredContacts.size
      const opened = openedContacts.size
      const clicked = clickedContacts.size

      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0

      const result = {
        id: campaign.id,
        name: campaign.name,
        sent,
        delivered,
        opened,
        clicked,
        deliveryRate: Number(deliveryRate.toFixed(1)), 
        openRate: Number(openRate.toFixed(1)),
        clickRate: Number(clickRate.toFixed(1))
      }

      console.log(`  📊 Campaign "${campaign.name}" metrics:`, result)

      return result
    }).filter(campaign => campaign.sent > 0) // Only show campaigns with activity
    .sort((a, b) => b.sent - a.sent) || [] // Sort by most sent

    console.log('📊 Campaign Performance - FINAL RESULT:', campaignPerformance.length, 'campaigns')

    return NextResponse.json(campaignPerformance)

  } catch (error) {
    console.error('Campaign performance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}