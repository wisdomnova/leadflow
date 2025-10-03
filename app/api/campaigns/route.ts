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
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get campaigns for the organization
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_contacts(id, contact_id),
        email_events(event_type, contact_id)
      `)
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false })

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Process campaigns to calculate stats from email_events
    const processedCampaigns = campaigns?.map(campaign => {
      const contacts = campaign.campaign_contacts || []
      const events = campaign.email_events || []
      
      // Get unique contacts for each event type
      const deliveredContacts = new Set(events.filter((e: { event_type: string }) => e.event_type === 'delivery').map((e: { contact_id: any }) => e.contact_id))
      const openedContacts = new Set(events.filter((e: { event_type: string }) => e.event_type === 'open').map((e: { contact_id: any }) => e.contact_id))
      const clickedContacts = new Set(events.filter((e: { event_type: string }) => e.event_type === 'click').map((e: { contact_id: any }) => e.contact_id))
      const bouncedContacts = new Set(events.filter((e: { event_type: string }) => e.event_type === 'bounce').map((e: { contact_id: any }) => e.contact_id))
      const complainedContacts = new Set(events.filter((e: { event_type: string }) => e.event_type === 'complaint').map((e: { contact_id: any }) => e.contact_id))
      const unsubscribedContacts = new Set(events.filter((e: { event_type: string }) => e.event_type === 'unsubscribe').map((e: { contact_id: any }) => e.contact_id))
      
      return {
        ...campaign,
        total_recipients: contacts.length,
        delivered: deliveredContacts.size,
        opened: openedContacts.size,
        clicked: clickedContacts.size,
        bounced: bouncedContacts.size, 
        complained: complainedContacts.size,
        unsubscribed: unsubscribedContacts.size,
        // Clean up nested data 
        campaign_contacts: undefined,
        email_events: undefined
      }
    }) || []

    return NextResponse.json(processedCampaigns)

  } catch (error) {
    console.error('Campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const body = await request.json()

    console.log('Creating campaign with body:', body)

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single() 

    if (userError || !userData) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User organization:', userData.organization_id)

    // Prepare campaign data with ALL required fields
    const campaignData = {
      organization_id: userData.organization_id,
      name: body.name || 'Untitled Campaign',
      description: body.description || null,
      subject: body.subject || '',
      content: body.content || '',
      status: body.status || 'draft',
      type: body.type || 'one-time',
      
      // IMPORTANT: Add the missing sender fields
      from_name: body.from_name || null,
      from_email: body.from_email || null,
      
      // Sequence-specific fields
      is_sequence: body.type === 'sequence',
      total_steps: body.total_steps || (body.type === 'sequence' ? 1 : 0),
      
      // Scheduling fields
      scheduled_at: body.scheduled_at || null,
      sent_at: null,
      launched_at: null,
      
      // Stats fields (start at 0)
      total_recipients: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0, 
      unsubscribed: 0, 
      
      // Settings
      send_rate: body.send_rate || 50,
      track_opens: body.track_opens !== false, // Default to true
      track_clicks: body.track_clicks !== false, // Default to true
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Campaign data to insert:', campaignData)

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([campaignData])
      .select()
      .single()

    if (campaignError) {
      console.error('Campaign creation error:', campaignError)
      return NextResponse.json({ 
        error: 'Failed to create campaign',
        details: campaignError.message,
        hint: campaignError.hint
      }, { status: 500 })
    }

    console.log('Campaign created successfully:', campaign)

    // Log activity (don't fail if this fails)
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          organization_id: userData.organization_id,
          user_id: decoded.userId,
          action: 'campaign_created',
          description: `Created campaign "${campaign.name}"`
        }])
    } catch (activityError) {
      console.warn('Activity logging failed:', activityError)
      // Don't fail the request for this
    }

    return NextResponse.json(campaign)

  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}