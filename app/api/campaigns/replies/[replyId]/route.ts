import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ replyId: string }> }) {
  const { replyId } = await params
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  try {
    // Verify user via JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse the reply ID (format: "email-campaignId")
    const [senderEmail, campaignId] = replyId.split('-')
    
    if (!senderEmail || !campaignId) {
      return NextResponse.json({ error: 'Invalid reply ID' }, { status: 400 })
    }

    // Fetch replies for this sender/campaign
    const { data, error } = await supabase.from('email_replies').select(`
      id,
      sender_email,
      sender_name,
      subject,
      body,
      category,
      sentiment,
      created_at,
      campaign_sends!inner (
        campaigns!inner (
          id,
          user_id
        )
      )
    `).eq('sender_email', decodeURIComponent(senderEmail))
      .eq('campaign_sends.campaign_id', campaignId)
      .eq('campaign_sends.campaigns.user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ replies: data || [] })
  } catch (error) {
    console.error('Error fetching reply thread:', error)
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}
