// app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id) 
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
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ✅ CHECK: User must have at least one active email account
    const { data: emailAccounts, error: emailAccountError } = await supabase
      .from('email_accounts')
      .select('id, email, status, provider')
      .eq('user_id', user.id)
      .in('status', ['active', 'warming_up'])
      .limit(1)

    if (emailAccountError) {
      console.error('Email account check error:', emailAccountError)
      return NextResponse.json(
        { error: 'Failed to verify email account' },
        { status: 500 }
      )
    }

    if (!emailAccounts || emailAccounts.length === 0) {
      return NextResponse.json(
        { 
          error: 'You must connect an email account before creating campaigns',
          code: 'NO_EMAIL_ACCOUNT',
          action: 'redirect_to_settings',
          message: 'Please connect a Gmail or Outlook account in Settings to send campaigns.'
        },
        { status: 400 }
      )
    }

    console.log('✅ Email account verified:', emailAccounts[0])

    const body = await request.json()

    console.log('Creating campaign with body:', body)

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single() 

    if (userError || !userData) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('User organization:', userData.organization_id)

    // Use the connected email account as default sender if not specified
    const defaultEmailAccount = emailAccounts[0]

    // Prepare campaign data with ALL required fields
    const campaignData = {
      organization_id: userData.organization_id,
      name: body.name || 'Untitled Campaign',
      description: body.description || null,
      subject: body.subject || '',
      content: body.content || '',
      status: body.status || 'draft',
      type: body.type || 'one-time',
      
      // Use connected email account as default sender
      from_name: body.from_name || null,
      from_email: body.from_email || defaultEmailAccount.email,
      email_account_id: body.email_account_id || defaultEmailAccount.id,
      
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
          user_id: user.id,
          action: 'campaign_created',
          description: `Created campaign "${campaign.name}"`,
          metadata: {
            campaign_id: campaign.id,
            campaign_type: campaign.type,
            email_account_provider: defaultEmailAccount.provider
          }
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