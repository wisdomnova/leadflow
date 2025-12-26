import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  try {
    // Verify user via JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all campaign replies grouped by sender
    const { data, error } = await supabase.from('email_replies').select(`
      id,
      sender_email,
      sender_name,
      campaign_sends!inner (
        campaign_id,
        campaigns!inner (
          id,
          name,
          user_id
        )
      )
    `).eq('campaign_sends.campaigns.user_id', user.id).order('created_at', { ascending: false })

    if (error) throw error

    // Group by sender and campaign
    const grouped = data?.reduce((acc: any, reply: any) => {
      const key = `${reply.sender_email}-${reply.campaign_sends.campaign_id}`
      const existing = acc.find((g: any) => g.id === key)
      if (existing) {
        existing.reply_count += 1
      } else {
        acc.push({
          id: key,
          contact_email: reply.sender_email,
          contact_name: reply.sender_name,
          campaign_id: reply.campaign_sends.campaign_id,
          campaign_name: reply.campaign_sends.campaigns.name,
          reply_count: 1,
          last_reply: reply.created_at
        })
      }
      return acc
    }, []) || []

    return NextResponse.json({ replies: grouped })
  } catch (error) {
    console.error('Error fetching campaign replies:', error)
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }
}
