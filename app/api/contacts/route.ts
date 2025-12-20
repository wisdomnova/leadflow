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

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Apply search filter
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%`
      )
    }

    // Apply status filter (stored in metadata)
    if (status && status !== 'all') {
      query = query.eq("metadata->>'status'", status)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Format contacts response
    const contacts = (data || []).map((contact: any) => ({
      id: contact.id,
      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
      email: contact.email,
      company: contact.company || 'Unknown',
      tags: contact.tags || [],
      status: contact.metadata?.status || 'Active',
      lastActivity: contact.metadata?.lastActivity || 'Never',
      createdAt: contact.created_at,
    }))

    return NextResponse.json({
      contacts,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { email, firstName, lastName, company, phone, tags } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Contact already exists' }, { status: 409 })
    }

    // Create contact
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        company: company || null,
        phone: phone || null,
        tags: tags || [],
        metadata: { status: 'Active', lastActivity: new Date().toISOString() },
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      id: data.id,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
      email: data.email,
      company: data.company || 'Unknown',
      tags: data.tags,
      status: data.metadata?.status || 'Active',
    })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
