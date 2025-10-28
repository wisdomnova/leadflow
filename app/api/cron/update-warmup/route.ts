// app/api/cron/update-warmup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Warmup stages: Day 0-7: 20/day, Day 8-14: 50/day, Day 15-21: 100/day, Day 22-28: 200/day, Day 29+: unlimited
const WARMUP_STAGES = [
  { days: 7, limit: 20, stage: 1 },
  { days: 14, limit: 50, stage: 2 },
  { days: 21, limit: 100, stage: 3 },
  { days: 28, limit: 200, stage: 4 },
  { days: Infinity, limit: 500, stage: 5 } // unlimited (but capped at 500 for safety)
]

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all accounts in warming_up status
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('status', 'warming_up')

    if (error) throw error

    let updated = 0

    for (const account of accounts || []) {
      const warmupStartDate = new Date(account.warmup_started_at)
      const daysSinceStart = Math.floor(
        (Date.now() - warmupStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Find appropriate stage
      const stage = WARMUP_STAGES.find(s => daysSinceStart < s.days) || WARMUP_STAGES[WARMUP_STAGES.length - 1]

      // Update if stage changed
      if (account.warmup_stage !== stage.stage || account.daily_limit !== stage.limit) {
        const updateData: any = {
          warmup_stage: stage.stage,
          daily_limit: stage.limit
        }

        // If reached final stage, mark as active
        if (stage.stage === 5) {
          updateData.status = 'active'
        }

        await supabase
          .from('email_accounts')
          .update(updateData)
          .eq('id', account.id)

        updated++
        console.log(`📈 Updated ${account.email} to stage ${stage.stage} (${stage.limit}/day)`)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updated} accounts`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Warmup update error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}