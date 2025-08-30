// ./app/api/campaigns/[id]/pause/route.ts
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
    const result = await EmailScheduler.pauseCampaign(campaignId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pause campaign error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to pause campaign' 
    }, { status: 500 })
  }
} 