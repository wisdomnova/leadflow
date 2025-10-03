// ./app/api/cron/process-emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailProcessor } from '@/lib/email-processor'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Processing email queue...') 
    
    // *** REDUCED BATCH SIZE: Process 5 emails at a time with delays ***
    const processedCount = await EmailProcessor.processPendingJobs(5) // <-- Reduced from 20 to 5
    
    // Retry failed jobs (run less frequently)
    const retryCount = await EmailProcessor.retryFailedJobs(3)
    
    // Cleanup old jobs (run once daily at 2 AM)
    const now = new Date()
    let cleanupCount = 0
    if (now.getHours() === 2) {
      cleanupCount = await EmailProcessor.cleanupOldJobs(30) 
    }
     
    console.log(`✅ Processed ${processedCount} emails, retried ${retryCount}, cleaned ${cleanupCount}`)
    
    return NextResponse.json({ 
      success: true,  
      processedCount,
      retriedCount: retryCount,
      cleanedCount: cleanupCount,  
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Cron job failed' 
    }, { status: 500 })
  }
}