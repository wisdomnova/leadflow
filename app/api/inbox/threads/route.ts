// app/api/inbox/threads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { ReplyDetectionService } from '@/lib/reply-detection'
import jwt from 'jsonwebtoken'

const supabase = createClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const campaignId = searchParams.get('campaignId')
    const contactId = searchParams.get('contactId')

    // Fetch threads using ReplyDetectionService
    const result = await ReplyDetectionService.getEmailThreads(userData.organization_id, {
      page,
      limit,
      campaignId: campaignId || undefined,
      contactId: contactId || undefined
    })

    console.log(`📧 Inbox Threads: Fetched ${result.threads.length} threads for organization ${userData.organization_id}`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Inbox threads API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch inbox threads' 
    }, { status: 500 })
  }
}