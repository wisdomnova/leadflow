// ./app/api/dashboard/stats/route.ts - Fixed to match campaigns approach

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

    const organizationId = userData.organization_id

    // Get total contacts count
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Get active campaigns count - match your campaigns page logic
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['active', 'sending', 'scheduled']) // Match campaigns page logic

    // Get campaigns with their email events - SAME as campaigns route
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        campaign_contacts(id, contact_id),
        email_events(event_type, contact_id)
      `)
      .eq('organization_id', organizationId)

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Process campaigns to calculate stats - SAME logic as campaigns route
    let totalEmailsSent = 0
    let totalDelivered = 0
    let totalOpened = 0
    let totalRecipients = 0

    if (campaigns && campaigns.length > 0) {
      campaigns.forEach(campaign => {
        const contacts = campaign.campaign_contacts || []
        const events = campaign.email_events || []
        
        // Count total recipients across all campaigns
        totalRecipients += contacts.length
        
        // Get unique contacts for each event type - SAME logic as campaigns
        const deliveredContacts = new Set(
          events.filter((e: { event_type: string }) => e.event_type === 'delivery')
               .map((e: { contact_id: any }) => e.contact_id)
        )
        const openedContacts = new Set(
          events.filter((e: { event_type: string }) => e.event_type === 'open')
               .map((e: { contact_id: any }) => e.contact_id)
        )
        const sentEvents = events.filter((e: { event_type: string }) => 
          ['sent', 'delivery'].includes(e.event_type)
        )
        
        totalEmailsSent += sentEvents.length
        totalDelivered += deliveredContacts.size
        totalOpened += openedContacts.size
      })
    }

    // Calculate open rate (opened/delivered * 100) - SAME logic as campaigns
    const openRate = totalDelivered > 0 ? 
      Math.round((totalOpened / totalDelivered) * 100 * 10) / 10 : 0

    const stats = {
      totalContacts: totalContacts || 0,
      activeCampaigns: activeCampaigns || 0,
      emailsSent: totalEmailsSent,
      openRate,
      emailsDelivered: totalDelivered,
      emailsOpened: totalOpened
    }

    console.log('📊 Dashboard stats calculated:', stats)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}