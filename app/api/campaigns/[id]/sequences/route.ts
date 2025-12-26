import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/campaigns/[id]/sequences
 * List all email sequences for a campaign (for drip campaigns)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    // Verify campaign belongs to user
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, is_sequence, sequence_type')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get all sequences for this campaign
    const { data: sequences, error: seqErr } = await supabase
      .from('campaign_sequences')
      .select('*')
      .eq('campaign_id', id)
      .order('sequence_number', { ascending: true })

    if (seqErr) {
      return NextResponse.json({ error: seqErr.message }, { status: 400 })
    }

    return NextResponse.json({
      campaign: campaign,
      sequences: sequences || [],
      count: sequences?.length || 0,
    })
  } catch (error) {
    console.error('Get sequences error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/sequences
 * Add a new email to the sequence
 * Body: {
 *   sequence_number: 1,
 *   email_subject: "Follow up: Check in",
 *   email_body: "Hi {{firstName}}...",
 *   delay_days: 2,
 *   delay_hours: 4,
 *   send_on_day_of_week: "Monday",
 *   send_at_time: "09:00",
 *   enabled: true,
 *   notes: "Follow-up email"
 * }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    // Verify campaign belongs to user
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Can only edit sequences if draft or paused
    if (!['draft', 'paused'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Can only add sequences to draft or paused campaigns' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      sequence_number,
      email_subject,
      email_body,
      template_id,
      delay_days = 0,
      delay_hours = 0,
      send_on_day_of_week,
      send_at_time,
      enabled = true,
      notes,
    } = body

    if (!sequence_number || !email_subject || !email_body) {
      return NextResponse.json(
        { error: 'Required fields: sequence_number, email_subject, email_body' },
        { status: 400 }
      )
    }

    // Check if sequence number already exists
    const { data: existing } = await supabase
      .from('campaign_sequences')
      .select('id')
      .eq('campaign_id', id)
      .eq('sequence_number', sequence_number)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Sequence ${sequence_number} already exists. Use update to modify.` },
        { status: 400 }
      )
    }

    // Insert sequence
    const { data: sequence, error: insErr } = await supabase
      .from('campaign_sequences')
      .insert({
        campaign_id: id,
        sequence_number,
        email_subject,
        email_body,
        template_id,
        delay_days,
        delay_hours,
        send_on_day_of_week,
        send_at_time,
        enabled,
        notes,
      })
      .select()
      .single()

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 })
    }

    // Mark campaign as sequence if not already
    if (!campaign.id) {
      await supabase
        .from('campaigns')
        .update({
          is_sequence: true,
          sequence_type: 'sequential',
        })
        .eq('id', id)
    }

    return NextResponse.json({
      ok: true,
      sequence: sequence,
      message: `Sequence email ${sequence_number} added. Email will send ${delay_days} days and ${delay_hours} hours after previous email.`,
    })
  } catch (error) {
    console.error('Create sequence error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
