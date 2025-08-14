import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgId = userData.organization_id

    // Get total contacts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')

    // Get active campaigns
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')

    // Get total emails sent
    const { data: emailStats } = await supabase
      .from('campaigns')
      .select('emails_sent, emails_opened')
      .eq('organization_id', orgId)

    const totalEmailsSent = emailStats?.reduce((sum, campaign) => sum + (campaign.emails_sent || 0), 0) || 0
    const totalEmailsOpened = emailStats?.reduce((sum, campaign) => sum + (campaign.emails_opened || 0), 0) || 0
    const openRate = totalEmailsSent > 0 ? Math.round((totalEmailsOpened / totalEmailsSent) * 100) : 0

    return NextResponse.json({
      totalContacts: totalContacts || 0,
      activeCampaigns: activeCampaigns || 0,
      emailsSent: totalEmailsSent,
      openRate: openRate
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}