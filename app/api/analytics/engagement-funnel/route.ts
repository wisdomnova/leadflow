// ./app/api/analytics/engagement-funnel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user's organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate date range
    const days = parseInt(timeRange.replace('d', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total contacts in organization
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)

    // Get campaigns with their events
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        campaign_contacts(id, contact_id),
        email_events(event_type, contact_id, created_at)
      `)
      .eq('organization_id', user.organization_id)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 })
    }

    // Calculate funnel metrics
    let totalSent = 0
    let uniqueDelivered = new Set()
    let uniqueOpened = new Set() 
    let uniqueClicked = new Set()
    let uniqueReplied = new Set()

    campaigns?.forEach(campaign => {
      const contacts = campaign.campaign_contacts || []
      const events = campaign.email_events || []
      
      totalSent += contacts.length
      
      // Track unique contacts for each stage
      events.forEach((event: any) => {
        if (event.event_type === 'delivery') uniqueDelivered.add(event.contact_id)
        if (event.event_type === 'open') uniqueOpened.add(event.contact_id)
        if (event.event_type === 'click') uniqueClicked.add(event.contact_id)
        if (event.event_type === 'reply') uniqueReplied.add(event.contact_id)
      })
    })

    const funnelData = [
      { 
        name: 'Total Contacts', 
        value: totalContacts || 0, 
        fill: '#6b7280',
        percentage: 100 
      },
      { 
        name: 'Emails Sent', 
        value: totalSent, 
        fill: '#0f66db',
        percentage: totalContacts ? (totalSent / totalContacts) * 100 : 0
      },
      { 
        name: 'Delivered', 
        value: uniqueDelivered.size, 
        fill: '#3b82f6',
        percentage: totalSent ? (uniqueDelivered.size / totalSent) * 100 : 0
      },
      { 
        name: 'Opened', 
        value: uniqueOpened.size, 
        fill: '#6366f1',
        percentage: uniqueDelivered.size ? (uniqueOpened.size / uniqueDelivered.size) * 100 : 0
      },
      { 
        name: 'Clicked', 
        value: uniqueClicked.size, 
        fill: '#059669',
        percentage: uniqueOpened.size ? (uniqueClicked.size / uniqueOpened.size) * 100 : 0
      },
      { 
        name: 'Replied', 
        value: uniqueReplied.size, 
        fill: '#25b43d',
        percentage: uniqueOpened.size ? (uniqueReplied.size / uniqueOpened.size) * 100 : 0
      }
    ]

    return NextResponse.json(funnelData)

  } catch (error) {
    console.error('Engagement funnel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}