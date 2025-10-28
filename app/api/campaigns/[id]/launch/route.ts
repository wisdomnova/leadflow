// app/api/campaigns/[id]/launch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use custom JWT authentication
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId
    const resolvedParams = await params
    const campaignId = resolvedParams.id

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get campaign with email account
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        email_accounts (*)
      `)
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.email_account_id) {
      return NextResponse.json({ 
        error: 'Email account not selected. Please select an email account for this campaign.' 
      }, { status: 400 })
    }

    // Get campaign steps for email content
    const { data: campaignSteps, error: stepsError } = await supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index')

    if (stepsError || !campaignSteps || campaignSteps.length === 0) {
      return NextResponse.json({ 
        error: 'No email steps found. Please add email content to your campaign.' 
      }, { status: 400 })
    }

    // Get campaign contacts
    const { data: campaignContacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)

    if (contactsError || !campaignContacts || campaignContacts.length === 0) {
      return NextResponse.json({ 
        error: 'No contacts added to campaign' 
      }, { status: 400 })
    }

    // Queue emails for each contact and each step
    const emailsToQueue = []
    
    for (const contact of campaignContacts) {
      for (let stepIndex = 0; stepIndex < campaignSteps.length; stepIndex++) {
        const step = campaignSteps[stepIndex]
        const baseDelay = stepIndex * 60000 // 1 minute between contacts for same step
        const stepDelay = (step.delay_days * 24 * 60 * 60 * 1000) + (step.delay_hours * 60 * 60 * 1000)
        
        emailsToQueue.push({
          campaign_id: campaignId,
          email_account_id: campaign.email_account_id,
          contact_id: contact.id,
          subject: step.subject || 'No Subject',
          body: step.content || 'No Content',
          variables: {},
          scheduled_for: new Date(Date.now() + baseDelay + stepDelay).toISOString(),
          status: 'pending'
        })
      }
    }

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
      message: `Campaign launched! ${emailsToQueue.length} emails queued across ${campaignSteps.length} steps.`
    })

  } catch (error: any) {
    console.error('Campaign launch error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to launch campaign' 
    }, { status: 500 })
  }
}