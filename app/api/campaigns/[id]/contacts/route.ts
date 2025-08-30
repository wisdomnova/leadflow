// ./app/api/campaigns/[id]/contacts/route.ts - Updated to use email_events

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
      .select('id')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get campaign contacts with their linked contact details
    const { data: campaignContacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select(`
        id,
        contact_id,
        email,
        first_name,
        last_name,
        company,
        phone,
        status,
        added_at,
        sent_at,
        opened_at,
        clicked_at,
        scheduled_send_time,
        last_error,
        retry_count,
        created_at,
        updated_at
      `)
      .eq('campaign_id', campaignId)
      .order('added_at', { ascending: false })

    if (contactsError) {
      console.error('Contacts fetch error:', contactsError)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    if (!campaignContacts || campaignContacts.length === 0) {
      return NextResponse.json([])
    }

    // Get contact IDs for email events lookup
    const contactIds = campaignContacts
      .map(cc => cc.contact_id)
      .filter(Boolean) // Remove any null contact_ids

    // Get email events for all contacts in this campaign
    let emailEvents: any[] = []
    if (contactIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false })

      if (eventsError) {
        console.warn('Error fetching email events:', eventsError)
      } else {
        emailEvents = events || []
      }
    }

    // Process contacts with their latest email events
    const processedContacts = campaignContacts.map(campaignContact => {
      // Get events for this contact (using contact_id if available, otherwise use email matching)
      const contactEvents = emailEvents.filter(e => 
        campaignContact.contact_id ? 
          e.contact_id === campaignContact.contact_id :
          false // If no contact_id, we can't match events
      )
      
      // Determine status based on latest events (priority order)
      let finalStatus = campaignContact.status || 'pending'
      let opened_at = campaignContact.opened_at
      let clicked_at = campaignContact.clicked_at
      let bounced_at = null
      let delivered_at = null
      let unsubscribed_at = null

      // Get latest events by type
      const latestDelivery = contactEvents.find(e => e.event_type === 'delivery')
      const latestOpen = contactEvents.find(e => e.event_type === 'open')
      const latestClick = contactEvents.find(e => e.event_type === 'click')
      const latestBounce = contactEvents.find(e => e.event_type === 'bounce')
      const latestComplaint = contactEvents.find(e => e.event_type === 'complaint')
      const latestUnsubscribe = contactEvents.find(e => e.event_type === 'unsubscribe')

      // Set timestamps from events
      if (latestDelivery) delivered_at = latestDelivery.created_at
      if (latestOpen) opened_at = latestOpen.created_at
      if (latestClick) clicked_at = latestClick.created_at
      if (latestBounce) bounced_at = latestBounce.created_at
      if (latestUnsubscribe) unsubscribed_at = latestUnsubscribe.created_at

      // Determine final status (priority: clicked > opened > delivered > bounced > complained > unsubscribed)
      if (latestClick) {
        finalStatus = 'clicked'
      } else if (latestOpen) {
        finalStatus = 'opened'
      } else if (latestDelivery) {
        finalStatus = 'delivered'
      } else if (latestBounce) {
        finalStatus = 'bounced'
      } else if (latestComplaint) {
        finalStatus = 'complained'
      } else if (latestUnsubscribe) {
        finalStatus = 'unsubscribed'
      }
      // If no events and status is 'sent', keep it as 'sent'
      // If no events and status is 'pending', keep it as 'pending'

      return {
        id: campaignContact.id,
        contact_id: campaignContact.contact_id,
        email: campaignContact.email,
        first_name: campaignContact.first_name,
        last_name: campaignContact.last_name,
        company: campaignContact.company,
        phone: campaignContact.phone,
        status: finalStatus,
        added_at: campaignContact.added_at,
        sent_at: campaignContact.sent_at,
        opened_at,
        clicked_at,
        bounced_at,
        delivered_at,
        unsubscribed_at,
        scheduled_send_time: campaignContact.scheduled_send_time,
        last_error: campaignContact.last_error,
        retry_count: campaignContact.retry_count,
        // Debug info (can remove in production)
        total_events: contactEvents.length,
        latest_event: contactEvents.length > 0 ? contactEvents[0].event_type : null,
        event_summary: {
          sent: contactEvents.filter(e => e.event_type === 'sent').length,
          delivered: contactEvents.filter(e => e.event_type === 'delivery').length,
          opened: contactEvents.filter(e => e.event_type === 'open').length,
          clicked: contactEvents.filter(e => e.event_type === 'click').length,
          bounced: contactEvents.filter(e => e.event_type === 'bounce').length
        }
      }
    })

    return NextResponse.json(processedContacts)

  } catch (error) {
    console.error('Get campaign contacts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST method remains the same
export async function POST(
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
    const body = await request.json()

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
      .select('id')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Handle bulk contact addition
    if (body.contactIds && Array.isArray(body.contactIds)) {
      // First, get the contact details from the contacts table
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, company, phone')
        .in('id', body.contactIds)
        .eq('organization_id', userData.organization_id)

      if (contactsError) {
        return NextResponse.json({ error: 'Failed to fetch contact details' }, { status: 500 })
      }

      if (!contactsData || contactsData.length === 0) {
        return NextResponse.json({ error: 'No valid contacts found' }, { status: 400 })
      }

      // Remove existing campaign contacts first
      await supabase
        .from('campaign_contacts')
        .delete()
        .eq('campaign_id', campaignId)

      // Prepare campaign contacts data
      const campaignContacts = contactsData.map(contact => ({
        campaign_id: campaignId,
        contact_id: contact.id,
        email: contact.email.toLowerCase(),
        first_name: contact.first_name,
        last_name: contact.last_name,
        company: contact.company || null,
        phone: contact.phone || null,
        status: 'pending',
        added_at: new Date().toISOString(),
        scheduled_send_time: new Date().toISOString() // Schedule immediately
      }))

      // Insert campaign contacts
      const { data: insertedContacts, error: insertError } = await supabase
        .from('campaign_contacts')
        .insert(campaignContacts)
        .select()

      if (insertError) {
        console.error('Bulk contact insert error:', insertError)
        return NextResponse.json({ 
          error: 'Failed to add contacts to campaign',
          details: insertError.message 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'Contacts added successfully',
        count: insertedContacts.length,
        contacts: insertedContacts
      })
    }

    // Handle single contact addition (existing logic)
    // Check if contact already exists in this campaign
    const { data: existingContact } = await supabase
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('email', body.email.toLowerCase())
      .single()

    if (existingContact) {
      return NextResponse.json({ error: 'Contact already exists in this campaign' }, { status: 400 })
    }

    // Add contact to campaign
    const { data: contact, error: addError } = await supabase
      .from('campaign_contacts')
      .insert([{
        campaign_id: campaignId,
        contact_id: body.contact_id || null, // Link to contacts table if provided
        email: body.email.toLowerCase(),
        first_name: body.first_name,
        last_name: body.last_name,
        company: body.company || null,
        phone: body.phone || null,
        status: 'pending',
        added_at: new Date().toISOString(),
        scheduled_send_time: new Date().toISOString() // Schedule immediately
      }])
      .select()
      .single()

    if (addError) {
      console.error('Contact add error:', addError) 
      return NextResponse.json({ 
        error: 'Failed to add contact',
        details: addError.message 
      }, { status: 500 })
    }

    return NextResponse.json(contact) 

  } catch (error) {
    console.error('Add contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}