import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * PAUSE a campaign (keeps pending sends queued, stops new sends)
 * POST /api/campaigns/[id]/pause
 * - Paused campaigns can be resumed
 * - Already-sent emails remain sent
 * - Pending emails won't send until resumed
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    // Get campaign
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status, paused_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Can only pause if sending, queued, or scheduled
    if (!['sending', 'queued', 'scheduled'].includes(campaign.status)) {
      return NextResponse.json(
        { error: `Cannot pause campaign with status: ${campaign.status}` },
        { status: 400 }
      )
    }

    // Already paused?
    if (campaign.paused_at) {
      return NextResponse.json(
        { error: 'Campaign is already paused' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Update campaign: add paused_at, change status to paused
    const { error: updErr } = await supabase
      .from('campaigns')
      .update({
        status: 'paused',
        paused_at: now,
        paused_by: userId,
      })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    // Log to history
    await supabase.from('campaign_status_history').insert({
      campaign_id: id,
      user_id: userId,
      old_status: campaign.status,
      new_status: 'paused',
      action: 'pause',
      reason: 'User paused campaign',
    })

    return NextResponse.json({
      ok: true,
      message: 'Campaign paused. Pending sends have been halted. Click resume to continue.',
      status: 'paused',
      paused_at: now,
    })
  } catch (error) {
    console.error('Pause campaign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
