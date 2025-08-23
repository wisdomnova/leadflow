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

    // Get sequence steps
    const { data: steps, error: stepsError } = await supabase
      .from('sequences')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('step_number')

    if (stepsError) {
      return NextResponse.json({ error: 'Failed to fetch sequence' }, { status: 500 })
    }

    return NextResponse.json({ steps: steps || [] })

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

    // Delete existing sequence steps
    await supabase
      .from('sequences')
      .delete()
      .eq('campaign_id', campaignId)

    // Insert new sequence steps
    const sequenceData = steps.map((step: any, index: number) => ({
      campaign_id: campaignId,
      step_number: index + 1,
      name: step.name || `Step ${index + 1}`,
      subject: step.subject || '',
      content: step.content || '',
      delay_amount: step.delayAmount || 0,
      delay_unit: step.delayUnit || 'hours'
    }))

    const { error: insertError } = await supabase
      .from('sequences')
      .insert(sequenceData)

    if (insertError) {
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

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Save sequence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}