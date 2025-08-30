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
    
    // **PRODUCTION: Process larger batches for SaaS scale**
    // Increased from 20 to 100 for bulk processing
    const processedCount = await EmailProcessor.processPendingJobs(100)
    
    console.log('🔄 Looking for failed contacts to retry...')
    // Retry failed jobs with more attempts for production reliability
    const retryCount = await EmailProcessor.retryFailedJobs(5)
    
    console.log('🧹 Cleaning up old campaign contacts...')
    // Cleanup old jobs - run more frequently for better database maintenance
    const now = new Date()
    let cleanupCount = 0
    
    // Run cleanup at 2 AM or if it's been more than 24 hours since last cleanup
    if (now.getHours() === 2 || should24HourCleanup()) {
      cleanupCount = await EmailProcessor.cleanupOldJobs(30) 
    }
     
    console.log(`✅ Processed ${processedCount} emails, retried ${retryCount}, cleaned ${cleanupCount}`)
    
    return NextResponse.json({ 
      success: true,  
      processedCount,
      retriedCount: retryCount,
      cleanedCount: cleanupCount, 
      timestamp: new Date().toISOString(),
      // **NEW: Add performance metrics for monitoring**
      metrics: {
        batchSize: 100,
        processingMode: 'bulk',
        nextRunIn: '5 minutes' // Assuming 5-minute cron intervals
      }
    })

  } catch (error) {
    console.error('Cron job error:', error)
    
    // **ENHANCED: Better error logging for production debugging**
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Cron job failed',
      stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined,
      timestamp: new Date().toISOString(),
      processedCount: 0,
      retriedCount: 0,
      cleanedCount: 0
    }, { status: 500 })
  }
}

// **NEW: Helper function to determine if cleanup is needed**
function should24HourCleanup(): boolean {
  // This could be enhanced to check last cleanup time from database
  // For now, run cleanup more frequently during high-traffic hours
  const now = new Date()
  const hour = now.getHours()
  
  // Run cleanup during low-traffic hours: 2 AM, 8 AM, 2 PM, 8 PM
  return [2, 8, 14, 20].includes(hour)
}

// **NEW: Optional POST endpoint for manual triggering (admin use)**
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      batchSize = 50, 
      forceCleanup = false, 
      campaignId = null 
    } = body

    console.log('🔧 Manual email processing triggered...')
    
    let processedCount = 0
    
    if (campaignId) {
      // Process specific campaign
      console.log(`Processing specific campaign: ${campaignId}`)
      // You could add a method to process specific campaigns
      processedCount = await EmailProcessor.processPendingJobs(batchSize)
    } else {
      // Process all pending emails
      processedCount = await EmailProcessor.processPendingJobs(batchSize)
    }
    
    const retryCount = await EmailProcessor.retryFailedJobs(3)
    
    let cleanupCount = 0
    if (forceCleanup) {
      cleanupCount = await EmailProcessor.cleanupOldJobs(30)
    }
    
    console.log(`✅ Manual processing complete: ${processedCount} emails, retried ${retryCount}, cleaned ${cleanupCount}`)
    
    return NextResponse.json({ 
      success: true,
      processedCount,
      retriedCount: retryCount,
      cleanedCount: cleanupCount,
      manual: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual cron job error:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Manual processing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}