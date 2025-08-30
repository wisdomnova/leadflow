// ./app/api/campaigns/[id]/stop/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailScheduler } from '@/lib/email-scheduler'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const result = await EmailScheduler.stopCampaign(campaignId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Stop campaign error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to stop campaign' 
    }, { status: 500 })
  }
}