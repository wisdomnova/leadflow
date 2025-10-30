// app/api/cron/poll-inboxes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { pollInboxes } from '@/lib/email-oauth/inbox-poller'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting scheduled inbox polling...') 
    await pollInboxes()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Inboxes polled successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Inbox polling cron error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}