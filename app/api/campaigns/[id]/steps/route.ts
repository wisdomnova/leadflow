// ./app/api/campaigns/[id]/steps/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const campaignId = params.id
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

    // Create campaign step
    const { data: step, error: stepError } = await supabase
      .from('campaign_steps')
      .insert({
        campaign_id: campaignId,
        type: body.type || 'email',
        subject: body.subject,
        content: body.content,
        delay_days: body.delay_days || 0,
        delay_hours: body.delay_hours || 0,
        order_index: body.order_index || 0 
      })
      .select()
      .single()

    if (stepError) {
      console.error('Failed to create campaign step:', stepError)
      return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
    }

    return NextResponse.json(step)

  } catch (error) {
    console.error('Create campaign step error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}