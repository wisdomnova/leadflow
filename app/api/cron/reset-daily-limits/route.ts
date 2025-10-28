// app/api/cron/reset-daily-limits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reset daily sent counts for all email accounts
    const { error } = await supabase.rpc('reset_daily_email_counts')
    
    if (error) throw error

    console.log('✅ Daily email counts reset')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily limits reset successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Daily reset error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}