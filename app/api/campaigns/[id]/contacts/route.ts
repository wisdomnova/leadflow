// ./app/api/campaigns/[id]/contacts/route.ts
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

    // Get campaign contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select(`
        id,
        email,
        first_name,
        last_name,
        company,
        phone,
        status,
        added_at,
        sent_at,
        opened_at,
        clicked_at
      `)
      .eq('campaign_id', campaignId)
      .order('added_at', { ascending: false })

    if (contactsError) {
      console.error('Contacts fetch error:', contactsError)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json(contacts || [])

  } catch (error) {
    console.error('Get campaign contacts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
        added_at: new Date().toISOString()
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
        email: body.email.toLowerCase(),
        first_name: body.first_name,
        last_name: body.last_name,
        company: body.company || null,
        phone: body.phone || null,
        status: 'pending',
        added_at: new Date().toISOString() 
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