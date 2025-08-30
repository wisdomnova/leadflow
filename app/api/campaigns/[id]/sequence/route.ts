// ./app/api/campaigns/[id]/sequence/route.ts
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

    console.log('API (sequence): Redirecting to steps API for campaign:', campaignId)

    // Get campaign to verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('organization_id')
      .eq('id', campaignId)
      .single()
 
    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify user belongs to the organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || user.organization_id !== campaign.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get steps from campaign_steps table (new approach)
    const { data: steps, error: stepsError } = await supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index')

    if (stepsError) {
      console.error('Failed to fetch steps:', stepsError)
      return NextResponse.json({ error: 'Failed to fetch sequence' }, { status: 500 })
    }

    // Transform campaign_steps format to legacy sequence format
    const sequenceSteps = (steps || []).map((step: any, index: number) => ({
      id: step.id,
      step_number: index + 1,
      name: `Step ${index + 1}`,
      subject: step.subject || '',
      content: step.content || '',
      delay_amount: step.delay_days || 0,
      delay_unit: step.delay_days > 0 ? 'days' : 'hours'
    }))

    console.log('API (sequence): Returning', sequenceSteps.length, 'steps as legacy format')

    return NextResponse.json({ steps: sequenceSteps })

  } catch (error) {
    console.error('Get sequence error:', error)
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
    const { steps } = await request.json()
    const { id: campaignId } = await params

    console.log('API (sequence): Saving', steps?.length, 'steps to campaign_steps table')

    // Validate steps
    if (!Array.isArray(steps) || steps.length < 1 || steps.length > 5) {
      return NextResponse.json({ error: 'Invalid steps: must have 1-5 steps' }, { status: 400 })
    }

    // Get campaign to verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('organization_id')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify user belongs to the organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || user.organization_id !== campaign.organization_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete existing steps from campaign_steps table
    await supabase
      .from('campaign_steps')
      .delete()
      .eq('campaign_id', campaignId)

    // Transform legacy sequence format to campaign_steps format
    const stepsData = steps.map((step: any, index: number) => ({
      campaign_id: campaignId,
      type: 'email',
      subject: step.subject || '',
      content: step.content || '',
      delay_days: step.delayUnit === 'days' ? (step.delayAmount || 0) : 0,
      delay_hours: step.delayUnit === 'hours' ? (step.delayAmount || 0) : 0,
      order_index: index
    }))

    // Insert into campaign_steps table
    const { error: insertError } = await supabase
      .from('campaign_steps')
      .insert(stepsData)

    if (insertError) {
      console.error('Failed to save to campaign_steps:', insertError)
      return NextResponse.json({ error: 'Failed to save sequence' }, { status: 500 })
    }

    // Update campaign with sequence info
    await supabase 
      .from('campaigns')
      .update({
        is_sequence: true,
        total_steps: steps.length
      })
      .eq('id', campaignId)

    console.log('API (sequence): Successfully saved', steps.length, 'steps')

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save sequence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}