// app/api/inbox/reclassify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { ReplyDetectionService } from '@/lib/reply-detection'
import jwt from 'jsonwebtoken'

const supabase = createClient()

export async function POST(request: NextRequest) {
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
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    // Reclassify the message
    await ReplyDetectionService.reclassifyMessage(messageId, userData.organization_id)

    console.log(`🤖 Reclassified message ${messageId} for organization ${userData.organization_id}`)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Reclassify API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to reclassify message' 
    }, { status: 500 })
  }
}