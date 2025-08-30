// ./app/api/campaigns/[id]/steps/route.ts
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

    console.log('API: Loading steps for campaign:', campaignId)

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

    // Get campaign steps
    const { data: steps, error: stepsError } = await supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('order_index')

    if (stepsError) {
      console.error('Database error loading steps:', stepsError)
      return NextResponse.json({ error: 'Failed to load steps' }, { status: 500 })
    }

    console.log('API: Found steps:', steps?.length || 0, steps)

    return NextResponse.json(steps || [])

  } catch (error) {
    console.error('Get campaign steps error:', error)
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

    console.log('API: Creating step for campaign:', campaignId, body)

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
        subject: body.subject || '',
        content: body.content || '',
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

    console.log('API: Created step:', step)

    return NextResponse.json(step)

  } catch (error) {
    console.error('Create campaign step error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { id: campaignId } = await params

    console.log('API: Deleting all steps for campaign:', campaignId)

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

    // Delete all campaign steps
    const { error: deleteError } = await supabase
      .from('campaign_steps')
      .delete()
      .eq('campaign_id', campaignId)

    if (deleteError) {
      console.error('Failed to delete campaign steps:', deleteError)
      return NextResponse.json({ error: 'Failed to delete steps' }, { status: 500 })
    }

    console.log('API: Deleted all steps for campaign:', campaignId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete campaign steps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const { steps } = await request.json()

    console.log('API: Updating all steps for campaign:', campaignId, 'Steps count:', steps?.length)

    // Validate steps
    if (!Array.isArray(steps) || steps.length < 1 || steps.length > 5) {
      return NextResponse.json({ error: 'Invalid steps: must have 1-5 steps' }, { status: 400 })
    }

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

    // Delete existing steps
    const { error: deleteError } = await supabase
      .from('campaign_steps')
      .delete()
      .eq('campaign_id', campaignId)

    if (deleteError) {
      console.error('Failed to delete existing steps:', deleteError)
      return NextResponse.json({ error: 'Failed to delete existing steps' }, { status: 500 })
    }

    // Insert new steps
    const stepsData = steps.map((step: any, index: number) => ({
      campaign_id: campaignId,
      type: 'email',
      subject: step.subject || '',
      content: step.content || '',
      delay_days: step.delayDays || 0,
      delay_hours: step.delayHours || 0,
      order_index: index
    }))

    const { data: newSteps, error: insertError } = await supabase
      .from('campaign_steps')
      .insert(stepsData)
      .select()

    if (insertError) {
      console.error('Failed to insert new steps:', insertError)
      return NextResponse.json({ error: 'Failed to save steps' }, { status: 500 })
    }

    console.log('API: Successfully updated steps:', newSteps?.length)

    return NextResponse.json(newSteps || [])

  } catch (error) {
    console.error('Update campaign steps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}