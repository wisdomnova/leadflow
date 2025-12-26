import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/campaigns/[id]/status
 * Get detailed campaign status and progress
 * Includes: current state, send progress, sequence progress (if applicable)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    // Get campaign with full details
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get overall send stats
    const { data: sends } = await supabase
      .from('campaign_sends')
      .select('status, sent_at, delivered_at, opened_at, clicked_at, replied_at')
      .eq('campaign_id', id)

    const sendStats = {
      total_recipients: campaign.total_recipients || 0,
      sent: sends?.filter((s) => s.sent_at).length || 0,
      delivered: sends?.filter((s) => s.delivered_at).length || 0,
      opened: sends?.filter((s) => s.opened_at).length || 0,
      clicked: sends?.filter((s) => s.clicked_at).length || 0,
      replied: sends?.filter((s) => s.replied_at).length || 0,
      pending: sends?.filter((s) => !s.sent_at).length || 0,
    }

    // Calculate rates
    const sentRate = sendStats.total_recipients > 0
      ? Math.round((sendStats.sent / sendStats.total_recipients) * 100)
      : 0
    const openRate = sendStats.sent > 0
      ? Math.round((sendStats.opened / sendStats.sent) * 100)
      : 0
    const clickRate = sendStats.sent > 0
      ? Math.round((sendStats.clicked / sendStats.sent) * 100)
      : 0
    const replyRate = sendStats.sent > 0
      ? Math.round((sendStats.replied / sendStats.sent) * 100)
      : 0

    // If sequence campaign, get sequence-level stats
    let sequenceStats = null
    if (campaign.is_sequence) {
      const { data: sequences } = await supabase
        .from('campaign_sequences')
        .select('sequence_number, enabled')
        .eq('campaign_id', id)
        .order('sequence_number', { ascending: true })

      if (sequences && sequences.length > 0) {
        sequenceStats = {
          total_sequences: sequences.length,
          enabled_sequences: sequences.filter((s) => s.enabled).length,
          sequences: await Promise.all(
            sequences.map(async (seq) => {
              const { data: seqSends } = await supabase
                .from('campaign_sequence_sends')
                .select('status')
                .eq('campaign_id', id)
                .eq('sequence_number', seq.sequence_number)

              const stats = {
                sequence_number: seq.sequence_number,
                enabled: seq.enabled,
                total: seqSends?.length || 0,
                pending: seqSends?.filter((s: any) => s.status === 'pending').length || 0,
                scheduled: seqSends?.filter((s: any) => s.status === 'scheduled').length || 0,
                sent: seqSends?.filter((s: any) => s.status === 'sent').length || 0,
                delivered: seqSends?.filter((s: any) => s.status === 'delivered').length || 0,
                bounced: seqSends?.filter((s: any) => s.status === 'bounced').length || 0,
                skipped: seqSends?.filter((s: any) => s.status === 'skipped').length || 0,
              }
              return stats
            })
          ),
        }
      }
    }

    // Get status history
    const { data: history } = await supabase
      .from('campaign_status_history')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        is_sequence: campaign.is_sequence,
        paused_at: campaign.paused_at,
        stopped_at: campaign.stopped_at,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
      },
      send_stats: sendStats,
      rates: {
        sent_percent: sentRate,
        open_rate: openRate,
        click_rate: clickRate,
        reply_rate: replyRate,
      },
      sequence_stats: sequenceStats,
      status_history: history,
      actions_available: {
        pause: ['queued', 'sending', 'scheduled'].includes(campaign.status),
        resume: campaign.status === 'paused',
        stop: ['draft', 'queued', 'sending', 'scheduled', 'paused'].includes(campaign.status),
        send: campaign.status === 'draft',
      },
    })
  } catch (error) {
    console.error('Get campaign status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
