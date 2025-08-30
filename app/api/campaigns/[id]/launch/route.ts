// ./app/api/campaigns/[id]/launch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { EmailScheduler } from '@/lib/email-scheduler'
import jwt from 'jsonwebtoken'

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
      .select('*') // Get all campaign data for validation
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if campaign can be launched - accept both 'draft' and 'ready' status
    if (!['draft', 'ready'].includes(campaign.status)) {
      return NextResponse.json({ 
        error: `Campaign cannot be launched. Current status: ${campaign.status}. Campaign must be in 'draft' or 'ready' status.` 
      }, { status: 400 })
    }

    // Additional validation - check if campaign has the required data
    if (!campaign.from_email || !campaign.from_name) {
      return NextResponse.json({ 
        error: 'Campaign is missing required sender information (from_email, from_name)' 
      }, { status: 400 })
    }

    // Check if campaign has contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)

    if (contactsError) {
      return NextResponse.json({ error: 'Failed to check campaign contacts' }, { status: 500 })
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ 
        error: 'Campaign has no contacts. Please add contacts before launching.' 
      }, { status: 400 })
    }

    console.log(`Launching campaign ${campaignId} with ${contacts.length} contacts`)

    // Launch the campaign
    const result = await EmailScheduler.launchCampaign(campaignId)

    // Update campaign status to 'sending' and set launched_at timestamp
    await supabase
      .from('campaigns')
      .update({ 
        status: 'sending',
        launched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    console.log('Campaign launched successfully:', result)

    return NextResponse.json({
      message: 'Campaign launched successfully',
      contactsScheduled: contacts.length,
      ...result
    })

  } catch (error) {
    console.error('Launch campaign error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to launch campaign' 
    }, { status: 500 })
  }
}