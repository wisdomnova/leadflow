import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * STOP a campaign permanently (cannot be resumed)
 * POST /api/campaigns/[id]/stop
 * - Cannot resume after stopping
 * - Pending emails are marked 'skipped'
 * - Already-sent emails remain as-is
 * - Useful for canceling campaigns that shouldn't continue
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const body = await request.json()
    const { reason } = body // optional reason for stopping

    // Get campaign
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status, stopped_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Cannot stop if already stopped or completed
    if (campaign.stopped_at || campaign.status === 'stopped') {
      return NextResponse.json(
        { error: 'Campaign is already stopped' },
        { status: 400 }
      )
    }

    if (campaign.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot stop a completed campaign. It has already finished sending.' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Update campaign: set stopped_at, change status to stopped
    const { error: updErr } = await supabase
      .from('campaigns')
      .update({
        status: 'stopped',
        stopped_at: now,
        stopped_by: userId,
      })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    // Get all pending sends and mark as skipped
    const { data: pendingSends, error: pendErr } = await supabase
      .from('campaign_sends')
      .select('id')
      .eq('campaign_id', id)
      .is('sent_at', null)

    if (!pendErr && pendingSends && pendingSends.length > 0) {
      const updateIds = pendingSends.map((send: any) => send.id)
      await supabase
        .from('campaign_sends')
        .update({
          status: 'skipped',
          skip_reason: `Campaign stopped by user${reason ? ': ' + reason : ''}`,
        })
        .in('id', updateIds)
    }

    // Log to history
    await supabase.from('campaign_status_history').insert({
      campaign_id: id,
      user_id: userId,
      old_status: campaign.status,
      new_status: 'stopped',
      action: 'stop',
      reason: reason || 'User stopped campaign',
    })

    const skippedCount = pendingSends?.length || 0

    return NextResponse.json({
      ok: true,
      message: `Campaign stopped. ${skippedCount} pending emails have been skipped. This action cannot be undone.`,
      status: 'stopped',
      stopped_at: now,
      skipped_count: skippedCount,
    })
  } catch (error) {
    console.error('Stop campaign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
