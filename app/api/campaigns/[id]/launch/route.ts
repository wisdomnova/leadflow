// app/api/campaigns/[id]/launch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const campaignId = resolvedParams.id

    // Get campaign with email account
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        email_accounts (*)
      `)
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.email_account_id) {
      return NextResponse.json({ 
        error: 'Email account not selected. Please select an email account for this campaign.' 
      }, { status: 400 })
    }

    // Get campaign contacts
    const { data: campaignContacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('contact_id')
      .eq('campaign_id', campaignId)

    if (contactsError || !campaignContacts || campaignContacts.length === 0) {
      return NextResponse.json({ 
        error: 'No contacts added to campaign' 
      }, { status: 400 })
    }

    // Queue emails for each contact
    const emailsToQueue = campaignContacts.map((cc, index) => ({
      campaign_id: campaignId,
      email_account_id: campaign.email_account_id,
      contact_id: cc.contact_id,
      subject: campaign.subject,
      body: campaign.body,
      variables: {}, // Add any custom variables here
      scheduled_at: new Date(Date.now() + index * 60000).toISOString(), // 1 minute apart
      status: 'pending'
    }))

    const { error: queueError } = await supabase
      .from('email_queue')
      .insert(emailsToQueue)

    if (queueError) {
      throw queueError
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true,
      message: `Campaign launched! ${emailsToQueue.length} emails queued.`
    })

  } catch (error: any) {
    console.error('Campaign launch error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to launch campaign' 
    }, { status: 500 })
  }
}