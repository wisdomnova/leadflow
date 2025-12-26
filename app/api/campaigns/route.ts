import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import { getUserPlanId } from '@/lib/user-plan'
import { getFeatureLimit, hasReachedLimit } from '@/lib/plan-features'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('campaigns')
      .select('*, templates(name)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ campaigns: data || [], total: count || 0, page, limit })
  } catch (error) {
    console.error('List campaigns error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    // Check user's plan and campaign limit
    const planId = await getUserPlanId(userId)
    
    // Get current campaign count
    const { count: campaignCount, error: countError } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return NextResponse.json({ error: 'Failed to check campaign limit' }, { status: 400 })
    }

    const campaignLimit = getFeatureLimit(planId, 'campaignsLimit')
    const currentCount = campaignCount || 0

    // Check if user has reached campaign limit
    if (campaignLimit > 0 && currentCount >= campaignLimit) {
      return NextResponse.json(
        { 
          error: `Campaign limit reached (${campaignLimit} campaigns)`,
          code: 'CAMPAIGN_LIMIT_REACHED',
          limit: campaignLimit,
          current: currentCount,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, template_id, subject, preview_text, body: emailBody, from_name, from_email, reply_to, provider, domain, settings, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name,
        template_id: template_id || null,
        subject,
        preview_text,
        body: emailBody,
        from_name,
        from_email,
        reply_to,
        provider: provider || 'aws_ses',
        domain,
        settings: settings || {},
        notes: notes || '',
        status: 'draft',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ campaign: data })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
