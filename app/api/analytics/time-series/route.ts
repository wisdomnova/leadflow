// ./app/api/analytics/time-series/route.ts
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

    console.log('📈 Time Series - Date range:', startDate.toISOString())
    console.log('📈 Time Series - Organization:', user.organization_id)

    // Get all email events for the time period from campaigns in this org
    const { data: events, error } = await supabase
      .from('email_events')
      .select(`
        event_type,
        contact_id,
        created_at,
        campaigns!inner(organization_id)
      `)
      .eq('campaigns.organization_id', user.organization_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch time series data' }, { status: 500 })
    }

    console.log('📈 Time Series - Found events:', events?.length || 0)

    // Group events by date and calculate unique contacts
    const eventsByDate: { [key: string]: any } = {}
    
    // Initialize all dates in range
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      eventsByDate[dateKey] = {
        date: dateKey,
        sent: new Set(),
        delivered: new Set(),
        opened: new Set(),
        clicked: new Set(),
        bounced: new Set()
      }
    }

    // Process events and count unique contacts per day
    events?.forEach(event => {
      const date = event.created_at.split('T')[0]
      if (eventsByDate[date]) {
        if (event.event_type === 'delivery') {
          eventsByDate[date].delivered.add(event.contact_id)
        } else if (event.event_type === 'open') {
          eventsByDate[date].opened.add(event.contact_id)
        } else if (event.event_type === 'click') {
          eventsByDate[date].clicked.add(event.contact_id)
        } else if (event.event_type === 'bounce') {
          eventsByDate[date].bounced.add(event.contact_id) 
        }
      }
    })

    // Convert Sets to counts and format for chart
    const timeSeriesData = Object.values(eventsByDate).map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sent: day.sent.size,
      delivered: day.delivered.size,
      opened: day.opened.size,
      clicked: day.clicked.size,
      bounced: day.bounced.size
    }))

    console.log('📈 Time Series - Sample data:', timeSeriesData.slice(0, 3))

    return NextResponse.json(timeSeriesData)

  } catch (error) {
    console.error('Time series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}