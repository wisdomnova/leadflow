import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get all contacts for user
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('metadata')
      .eq('user_id', userId)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Calculate stats
    const total = contacts?.length || 0
    let active = 0
    let bounced = 0
    let unsubscribed = 0

    contacts?.forEach((contact: any) => {
      const status = contact.metadata?.status || 'Active'
      switch (status) {
        case 'Active':
          active++
          break
        case 'Bounced':
          bounced++
          break
        case 'Unsubscribed':
          unsubscribed++
          break
      }
    })

    return NextResponse.json({
      total,
      active,
      bounced,
      unsubscribed,
    })
  } catch (error) {
    console.error('Error fetching contact stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
