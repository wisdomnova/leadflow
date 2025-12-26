import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { DEFAULT_WARMUP_PLAN, getDailyLimit } from '@/lib/warmup-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const body = await request.json()
    const { provider, domain } = body || {}
    if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })

    const today = new Date()
    const day1Limit = getDailyLimit(1, DEFAULT_WARMUP_PLAN)

    const { data: ins, error: insErr } = await supabase
      .from('user_warmup_schedule')
      .insert({
        user_id: userId,
        provider,
        domain,
        start_date: today.toISOString().slice(0, 10),
        total_days: DEFAULT_WARMUP_PLAN.totalDays,
        current_day: 1,
        daily_limit: day1Limit,
        enforced: true,
        status: 'active',
      })
      .select('id, daily_limit')
      .limit(1)

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })

    const schedule = ins?.[0]
    if (schedule) {
      await supabase
        .from('warmup_daily_log')
        .insert({
          user_id: userId,
          schedule_id: schedule.id,
          day_number: 1,
          date: today.toISOString().slice(0, 10),
          sent_count: 0,
          limit: schedule.daily_limit,
        })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Warmup start error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
