import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * RESUME a paused campaign (resumes pending sends)
 * POST /api/campaigns/[id]/resume
 * - Can only resume paused campaigns
 * - Re-queues pending sends
 * - Changes status back to queued or scheduled
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
      .select('id, status, paused_at, scheduled_for')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Can only resume if paused
    if (campaign.status !== 'paused') {
      return NextResponse.json(
        { error: `Cannot resume campaign with status: ${campaign.status}. Only paused campaigns can be resumed.` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Determine new status
    const newStatus = campaign.scheduled_for && new Date(campaign.scheduled_for) > new Date(now)
      ? 'scheduled'
      : 'queued'

    // Update campaign: clear paused_at, restore status
    const { error: updErr } = await supabase
      .from('campaigns')
      .update({
        status: newStatus,
        paused_at: null,
        paused_by: null,
      })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    // Log to history
    await supabase.from('campaign_status_history').insert({
      campaign_id: id,
      user_id: userId,
      old_status: 'paused',
      new_status: newStatus,
      action: 'resume',
      reason: 'User resumed campaign',
    })

    return NextResponse.json({
      ok: true,
      message: `Campaign resumed. Pending sends are re-queued and will continue ${newStatus === 'scheduled' ? 'at scheduled time' : 'immediately'}.`,
      status: newStatus,
      resumed_at: now,
    })
  } catch (error) {
    console.error('Resume campaign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
