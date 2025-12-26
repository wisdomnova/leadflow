import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/campaigns/[id]/sequences/[sequenceNumber]
 * Get a specific sequence email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sequenceNumber: string }> }
) {
  try {
    const { id, sequenceNumber } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    // Verify campaign belongs to user
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const { data: sequence, error: seqErr } = await supabase
      .from('campaign_sequences')
      .select('*')
      .eq('campaign_id', id)
      .eq('sequence_number', parseInt(sequenceNumber))
      .single()

    if (seqErr) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Get sequence send stats for all contacts
    const { data: sends, error: sendsErr } = await supabase
      .from('campaign_sequence_sends')
      .select('status')
      .eq('campaign_id', id)
      .eq('sequence_number', parseInt(sequenceNumber))

    if (!sendsErr && sends) {
      const stats = {
        total: sends.length,
        pending: sends.filter((s: any) => s.status === 'pending').length,
        scheduled: sends.filter((s: any) => s.status === 'scheduled').length,
        sent: sends.filter((s: any) => s.status === 'sent').length,
        delivered: sends.filter((s: any) => s.status === 'delivered').length,
        opened: sends.filter((s: any) => s.status === 'opened').length,
        clicked: sends.filter((s: any) => s.status === 'clicked').length,
        bounced: sends.filter((s: any) => s.status === 'bounced').length,
        skipped: sends.filter((s: any) => s.status === 'skipped').length,
      }
      return NextResponse.json({ sequence, stats })
    }

    return NextResponse.json({ sequence })
  } catch (error) {
    console.error('Get sequence error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/campaigns/[id]/sequences/[sequenceNumber]
 * Update a sequence email
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sequenceNumber: string }> }
) {
  try {
    const { id, sequenceNumber } = await params
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

    // Can only edit if draft or paused
    if (!['draft', 'paused'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Can only edit sequences in draft or paused campaigns' },
        { status: 400 }
      )
    }

    const body = await request.json()

    const { data: sequence, error: updErr } = await supabase
      .from('campaign_sequences')
      .update(body)
      .eq('campaign_id', id)
      .eq('sequence_number', parseInt(sequenceNumber))
      .select()
      .single()

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      sequence,
      message: `Sequence ${sequenceNumber} updated`,
    })
  } catch (error) {
    console.error('Update sequence error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]/sequences/[sequenceNumber]
 * Delete a sequence email
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sequenceNumber: string }> }
) {
  try {
    const { id, sequenceNumber } = await params
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

    // Can only delete if draft or paused
    if (!['draft', 'paused'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Can only delete sequences in draft or paused campaigns' },
        { status: 400 }
      )
    }

    const { error: delErr } = await supabase
      .from('campaign_sequences')
      .delete()
      .eq('campaign_id', id)
      .eq('sequence_number', parseInt(sequenceNumber))

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      message: `Sequence ${sequenceNumber} deleted`,
    })
  } catch (error) {
    console.error('Delete sequence error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
