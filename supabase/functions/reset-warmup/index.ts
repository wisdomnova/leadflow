import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface WarmupSchedule {
  id: string
  user_id: string
  current_day: number
  total_days: number
  status: string
}

const DEFAULT_WARMUP_PLAN = {
  totalDays: 14,
  dailyLimits: [25, 35, 50, 75, 100, 150, 200, 300, 400, 500, 650, 800, 1000, 1200],
}

function getDailyLimit(dayNumber: number): number {
  const idx = Math.max(1, Math.min(dayNumber, DEFAULT_WARMUP_PLAN.totalDays)) - 1
  return DEFAULT_WARMUP_PLAN.dailyLimits[idx]
}

function getNextDay(currentDay: number): number {
  return Math.min(currentDay + 1, DEFAULT_WARMUP_PLAN.totalDays)
}

function isCompleted(currentDay: number): boolean {
  return currentDay >= DEFAULT_WARMUP_PLAN.totalDays
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const today = new Date().toISOString().slice(0, 10)

    const { data: schedules, error } = await supabase
      .from('user_warmup_schedule')
      .select('id, user_id, current_day, total_days, status')
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching schedules:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const typedSchedules = schedules as WarmupSchedule[]

    for (const s of typedSchedules) {
      const nextDay = getNextDay(s.current_day)
      const completed = isCompleted(nextDay)
      const newLimit = getDailyLimit(nextDay)

      await supabase
        .from('user_warmup_schedule')
        .update({
          current_day: nextDay,
          daily_limit: newLimit,
          status: completed ? 'completed' : 'active',
        })
        .eq('id', s.id)

      await supabase.from('warmup_daily_log').insert({
        user_id: s.user_id,
        schedule_id: s.id,
        day_number: nextDay,
        date: today,
        sent_count: 0,
        limit: newLimit,
      })
    }

    return new Response(
      JSON.stringify({ ok: true, updated: typedSchedules.length }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Warmup cron error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
