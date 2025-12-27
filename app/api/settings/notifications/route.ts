import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const defaultPrefs = {
  comments: true,
  messages: true,
  mentions: true,
  shares: true,
  invites: true,
  product_updates: true,
}

function getPayload(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const payload = getPayload(request)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('comments, messages, mentions, shares, invites, product_updates')
      .eq('user_id', payload.userId)
      .single()

    if (error || !prefs) {
      return NextResponse.json({ preferences: defaultPrefs })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = getPayload(request)
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const prefs = {
      comments: !!body.comments,
      messages: !!body.messages,
      mentions: !!body.mentions,
      shares: !!body.shares,
      invites: !!body.invites,
      product_updates: !!body.product_updates,
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: payload.userId, ...prefs }, { onConflict: 'user_id' })
      .select('comments, messages, mentions, shares, invites, product_updates')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error('Error saving notification preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
