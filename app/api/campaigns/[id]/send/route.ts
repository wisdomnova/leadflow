import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const body = await request.json()
    const { scheduled_at } = body

    // Verify campaign
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status, total_recipients')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.total_recipients === 0) {
      return NextResponse.json({ error: 'No recipients added' }, { status: 400 })
    }

    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 })
    }

    // Check warmup limit
    const today = new Date().toISOString().slice(0, 10)
    const { data: warmupLog, error: warmErr } = await supabase
      .from('warmup_daily_log')
      .select('sent_count, limit')
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (warmErr) {
      console.error('Warmup check error:', warmErr)
    }

    const dailyRemaining = warmupLog ? warmupLog.limit - warmupLog.sent_count : 500
    const willQueue = campaign.total_recipients > dailyRemaining

    // Update campaign status
    const newStatus = scheduled_at ? 'scheduled' : 'queued'
    const { error: updErr } = await supabase
      .from('campaigns')
      .update({ status: newStatus, scheduled_at: scheduled_at || null })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
      willQueue,
      dailyRemaining,
      message: willQueue
        ? `Campaign queued. ${dailyRemaining} emails will send today, remaining tomorrow.`
        : scheduled_at
        ? `Campaign scheduled for ${scheduled_at}`
        : 'Campaign queued for immediate send',
    })
  } catch (error) {
    console.error('Send campaign error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
