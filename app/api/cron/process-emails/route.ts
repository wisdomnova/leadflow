// ./app/api/cron/process-emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailProcessor } from '@/lib/email-processor'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (in production, you'd use proper auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Processing email queue...')
    
    const processedCount = await EmailProcessor.processPendingJobs(20)
    
    console.log(`✅ Processed ${processedCount} emails`)
    
    return NextResponse.json({ 
      success: true, 
      processedCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Cron job failed' 
    }, { status: 500 })
  }
}