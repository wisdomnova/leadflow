import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const body = await request.json()
    const { contact_ids } = body

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json({ error: 'Missing contact_ids array' }, { status: 400 })
    }

    // Verify campaign exists and user owns it
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (campErr || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch contacts with data
    const { data: contacts, error: contactErr } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .in('id', contact_ids)

    if (contactErr) {
      return NextResponse.json({ error: contactErr.message }, { status: 400 })
    }

    // Build recipient records with merge data
    const recipients = contacts.map((c: any) => ({
      campaign_id: id,
      contact_id: c.id,
      merge_data: {
        firstName: c.first_name || c.name?.split(' ')[0] || '',
        lastName: c.last_name || c.name?.split(' ').slice(1).join(' ') || '',
        fullName: c.name || '',
        email: c.email,
        company: c.company || '',
        phone: c.phone || '',
        jobTitle: c.job_title || c.title || '',
        ...c.metadata,
      },
    }))

    // Insert recipients (ignore duplicates)
    const { error: insErr } = await supabase
      .from('campaign_recipients')
      .upsert(recipients, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 })
    }

    // Update campaign total_recipients count
    const { error: updErr } = await supabase
      .from('campaigns')
      .update({ total_recipients: recipients.length })
      .eq('id', id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, added: recipients.length })
  } catch (error) {
    console.error('Add recipients error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const userId = decoded.userId

    const { data, error } = await supabase
      .from('campaign_recipients')
      .select('*, contacts(name, email)')
      .eq('campaign_id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ recipients: data || [] })
  } catch (error) {
    console.error('Get recipients error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
