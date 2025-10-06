// ./app/api/dashboard/funnel/route.ts
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

    // Get total contacts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
 
    // Get campaigns with their events
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        campaign_contacts(id, contact_id),
        email_events(event_type, contact_id)
      `)
      .eq('organization_id', userData.organization_id)

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 })
    }

    // Calculate funnel metrics
    let totalEmailsSent = 0
    let totalOpened = 0
    let totalReplied = 0
    let totalClicked = 0

    campaigns?.forEach(campaign => {
      const contacts = campaign.campaign_contacts || []
      const events = campaign.email_events || []
      
      // Get unique contacts for each event type
      const openedContacts = new Set(events.filter((e: any) => e.event_type === 'open').map((e: any) => e.contact_id))
      const repliedContacts = new Set(events.filter((e: any) => e.event_type === 'reply').map((e: any) => e.contact_id))
      const clickedContacts = new Set(events.filter((e: any) => e.event_type === 'click').map((e: any) => e.contact_id))
      
      totalEmailsSent += contacts.length
      totalOpened += openedContacts.size
      totalReplied += repliedContacts.size
      totalClicked += clickedContacts.size
    })

    const funnelData = [
      { name: 'Contacts', value: totalContacts || 0, fill: '#0f66db' },
      { name: 'Emails Sent', value: totalEmailsSent, fill: '#3b82f6' },
      { name: 'Opened', value: totalOpened, fill: '#6366f1' },
      { name: 'Clicked', value: totalClicked, fill: '#059669' },
      { name: 'Replied', value: totalReplied, fill: '#25b43d' }
    ]

    return NextResponse.json(funnelData)

  } catch (error) {
    console.error('Dashboard funnel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}