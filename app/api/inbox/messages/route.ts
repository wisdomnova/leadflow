// app/api/inbox/messages/route.ts
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const filter = searchParams.get('filter') || 'all'
    const campaignId = searchParams.get('campaignId')
    const contactId = searchParams.get('contactId')
    const intentFilter = searchParams.get('intentFilter')
    const sentimentFilter = searchParams.get('sentimentFilter')

    // Fetch messages using ReplyDetectionService
    const result = await ReplyDetectionService.getInboxMessages(userData.organization_id, {
      page,
      limit,
      filter: filter as any,
      campaignId: campaignId || undefined,
      contactId: contactId || undefined,
      intentFilter: intentFilter || undefined,
      sentimentFilter: sentimentFilter || undefined
    })

    console.log(`📧 Inbox: Fetched ${result.messages.length} messages for organization ${userData.organization_id}`)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Inbox messages API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch inbox messages' 
    }, { status: 500 })
  }
}

// Mark messages as read
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const { messageIds, action } = body

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'messageIds array is required' }, { status: 400 })
    }

    if (action === 'mark_read') {
      await ReplyDetectionService.markAsRead(messageIds, userData.organization_id)
    } else if (action === 'archive') {
      await ReplyDetectionService.archiveMessages(messageIds, userData.organization_id)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Inbox messages PATCH API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update messages' 
    }, { status: 500 })
  }
}