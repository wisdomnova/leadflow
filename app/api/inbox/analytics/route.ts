// app/api/inbox/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
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

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'week'

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get basic message counts
    const { data: messageStats } = await supabase
      .from('inbox_messages')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .gte('created_at', startDate.toISOString())

    // Get AI classification stats
    const { data: classificationStats } = await supabase
      .from('message_classifications')
      .select(`
        *,
        inbox_messages!inner(organization_id, created_at)
      `)
      .eq('inbox_messages.organization_id', userData.organization_id)
      .gte('inbox_messages.created_at', startDate.toISOString())

    // Process analytics
    const totalMessages = messageStats?.length || 0
    
    const intentBreakdown = classificationStats?.reduce((acc: Record<string, number>, item: any) => {
      acc[item.intent] = (acc[item.intent] || 0) + 1
      return acc
    }, {}) || {}

    const sentimentBreakdown = classificationStats?.reduce((acc: Record<string, number>, item: any) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1
      return acc
    }, {}) || {}

    const priorityBreakdown = classificationStats?.reduce((acc: Record<string, number>, item: any) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1
      return acc
    }, {}) || {}

    const requiresAttentionCount = classificationStats?.filter((item: any) => item.requires_human_attention)?.length || 0
    
    const avgConfidence = classificationStats?.reduce((sum: number, item: any) => sum + (item.confidence || 0), 0) / Math.max(classificationStats?.length || 1, 1)
    
    const avgProcessingTime = classificationStats?.reduce((sum: number, item: any) => sum + (item.processing_time_ms || 0), 0) / Math.max(classificationStats?.length || 1, 1)

    const analytics = {
      totalMessages,
      intentBreakdown,
      sentimentBreakdown,
      priorityBreakdown,
      averageConfidence: avgConfidence || 0,
      requiresAttentionCount,
      processingTimeAvg: avgProcessingTime || 0
    }

    console.log(`📊 Inbox Analytics: Generated for organization ${userData.organization_id} (${timeframe})`)

    return NextResponse.json({ analytics })

  } catch (error: any) {
    console.error('Inbox analytics API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch inbox analytics' 
    }, { status: 500 })
  }
}