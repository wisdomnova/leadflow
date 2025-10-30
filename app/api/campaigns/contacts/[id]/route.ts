// ./app/api/campaigns/contacts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

const supabase = createClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: campaignContactId } = await params

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the campaign contact belongs to this organization
    const { data: campaignContact, error: contactError } = await supabase
      .from('campaign_contacts')
      .select('id, campaign_id, campaigns!inner(organization_id)')
      .eq('id', campaignContactId)
      .single()

    if (contactError || !campaignContact) {
      return NextResponse.json({ error: 'Campaign contact not found' }, { status: 404 })
    }

    // Check organization ownership (campaigns is joined as an object)
    if ((campaignContact.campaigns as any).organization_id !== userData.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the campaign contact
    const { error: deleteError } = await supabase
      .from('campaign_contacts')
      .delete()
      .eq('id', campaignContactId)

    if (deleteError) {
      console.error('Failed to delete campaign contact:', deleteError)
      return NextResponse.json({ error: 'Failed to remove contact from campaign' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Contact removed from campaign successfully' })

  } catch (error) {
    console.error('Delete campaign contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: campaignContactId } = await params
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

    // Verify the campaign contact belongs to this organization
    const { data: campaignContact, error: contactError } = await supabase
      .from('campaign_contacts')
      .select('id, campaign_id, campaigns!inner(organization_id)')
      .eq('id', campaignContactId)
      .single()

    if (contactError || !campaignContact) {
      return NextResponse.json({ error: 'Campaign contact not found' }, { status: 404 })
    }

    // Check organization ownership (campaigns is joined as an object)  
    if ((campaignContact.campaigns as any).organization_id !== userData.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update allowed fields
    const allowedFields = ['status', 'first_name', 'last_name', 'company', 'phone', 'custom_fields']
    const updateData: any = {}
    
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update the campaign contact
    const { data: updatedContact, error: updateError } = await supabase
      .from('campaign_contacts')
      .update(updateData)
      .eq('id', campaignContactId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update campaign contact:', updateError)
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    return NextResponse.json(updatedContact)

  } catch (error) {
    console.error('Update campaign contact error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}