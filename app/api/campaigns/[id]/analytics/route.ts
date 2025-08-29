// ./app/api/campaigns/[id]/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id: campaignId } = await params

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify campaign belongs to user's organization
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, organization_id')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get contact counts by status
    const { data: contactStats } = await supabase
      .from('campaign_contacts')
      .select('status')
      .eq('campaign_id', campaignId)

    // Get email event counts
    const { data: eventStats } = await supabase
      .from('email_events')
      .select('event_type, created_at, contact_id')
      .eq('campaign_id', campaignId)

    // Get daily activity for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyActivity } = await supabase
      .from('email_events')
      .select('event_type, created_at, contact_id')
      .eq('campaign_id', campaignId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at')

    // Process the data
    const contacts = contactStats || []
    const events = eventStats || []
    const activity = dailyActivity || []

    // Calculate metrics
    const totalContacts = contacts.length
    const totalSent = contacts.filter(c => ['sent', 'opened', 'clicked', 'bounced', 'complained'].includes(c.status)).length
    const totalOpened = events.filter(e => e.event_type === 'open').length
    const uniqueOpens = new Set(events.filter(e => e.event_type === 'open').map(e => e.contact_id)).size
    const totalClicked = events.filter(e => e.event_type === 'click').length
    const uniqueClicks = new Set(events.filter(e => e.event_type === 'click').map(e => e.contact_id)).size
    const totalBounced = events.filter(e => e.event_type === 'bounce').length
    const totalComplaints = events.filter(e => e.event_type === 'complaint').length
    const totalUnsubscribed = contacts.filter(c => c.status === 'unsubscribed').length

    // Calculate rates
    const deliveryRate = totalContacts > 0 ? ((totalSent - totalBounced) / totalContacts) * 100 : 0
    const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0
    const clickRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0
    const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
    const complaintRate = totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0
    const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0

    // Process daily activity
    const dailyStats = activity.reduce((acc: any, event: any) => {
      const date = event.created_at.split('T')[0]
      if (!acc[date]) {
        acc[date] = { sent: 0, opened: 0, clicked: 0, bounced: 0 }
      }
      acc[date][event.event_type] = (acc[date][event.event_type] || 0) + 1
      return acc
    }, {})

    const analytics = {
      overview: {
        totalContacts,
        totalSent,
        uniqueOpens,
        uniqueClicks,
        totalBounced,
        totalComplaints,
        totalUnsubscribed
      },
      rates: {
        deliveryRate: Number(deliveryRate.toFixed(2)),
        openRate: Number(openRate.toFixed(2)),
        clickRate: Number(clickRate.toFixed(2)),
        clickToOpenRate: Number(clickToOpenRate.toFixed(2)),
        bounceRate: Number(bounceRate.toFixed(2)),
        complaintRate: Number(complaintRate.toFixed(2)),
        unsubscribeRate: Number(unsubscribeRate.toFixed(2))
      },
      contactsByStatus: contacts.reduce((acc: any, contact: any) => {
        acc[contact.status] = (acc[contact.status] || 0) + 1
        return acc
      }, {}),
      eventsByType: events.reduce((acc: any, event: any) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {}),
      dailyActivity: dailyStats
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}