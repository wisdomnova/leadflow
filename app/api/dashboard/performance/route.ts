// ./app/api/dashboard/performance/route.ts
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

    // Get last 7 days of email events
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const { data: emailEvents, error: eventsError } = await supabase
      .from('email_events')
      .select(`
        *,
        campaigns!inner(organization_id)
      `)
      .eq('campaigns.organization_id', userData.organization_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (eventsError) {
      console.error('Email events fetch error:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 })
    }

    // Group events by date
    const eventsByDate: { [key: string]: any } = {}
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      
      eventsByDate[dateKey] = {
        date: dayName,
        sent: new Set(),
        opens: new Set(),
        replies: new Set()
      }
    }

    // Process events
    emailEvents?.forEach(event => {
      const date = event.created_at.split('T')[0]
      if (eventsByDate[date]) {
        if (['sent', 'delivery'].includes(event.event_type)) {
          eventsByDate[date].sent.add(event.contact_id)
        } else if (event.event_type === 'open') { 
          eventsByDate[date].opens.add(event.contact_id)
        } else if (event.event_type === 'reply') {
          eventsByDate[date].replies.add(event.contact_id)
        }
      }
    })

    // Convert to chart format
    const performanceData = Object.values(eventsByDate).map(day => ({
      date: day.date,
      sent: day.sent.size,
      opens: day.opens.size,
      replies: day.replies.size
    }))

    return NextResponse.json(performanceData)

  } catch (error) {
    console.error('Dashboard performance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}