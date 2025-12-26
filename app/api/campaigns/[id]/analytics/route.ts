import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get detailed send statuses
    const { data: sends, error: sendsErr } = await supabase
      .from('campaign_sends')
      .select('status, sent_at, delivered_at, opened_at, clicked_at, replied_at, contacts(name, email)')
      .eq('campaign_id', id)

    if (sendsErr) {
      return NextResponse.json({ error: sendsErr.message }, { status: 400 })
    }

    // Calculate metrics
    const analytics = {
      total: campaign.total_recipients || 0,
      sent: campaign.sent_count || 0,
      delivered: campaign.delivered_count || 0,
      bounced: campaign.bounced_count || 0,
      opened: campaign.opened_count || 0,
      clicked: campaign.clicked_count || 0,
      replied: campaign.replied_count || 0,
      unsubscribed: campaign.unsubscribed_count || 0,
      openRate: campaign.delivered_count ? ((campaign.opened_count / campaign.delivered_count) * 100).toFixed(1) : '0.0',
      clickRate: campaign.delivered_count ? ((campaign.clicked_count / campaign.delivered_count) * 100).toFixed(1) : '0.0',
      replyRate: campaign.delivered_count ? ((campaign.replied_count / campaign.delivered_count) * 100).toFixed(1) : '0.0',
      sends: sends || [],
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
