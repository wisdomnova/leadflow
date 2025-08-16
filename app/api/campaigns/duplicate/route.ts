import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const { id } = await request.json() // Get id from request body

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get original campaign
    const { data: originalCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id) // Use id from request body
      .eq('organization_id', userData.organization_id)
      .single()

    if (fetchError || !originalCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Create duplicate
    const { data: duplicatedCampaign, error: duplicateError } = await supabase
      .from('campaigns')
      .insert([{
        organization_id: userData.organization_id,
        name: `${originalCampaign.name} (Copy)`,
        subject: originalCampaign.subject,
        content: originalCampaign.content,
        status: 'draft',
        type: originalCampaign.type,
        scheduled_at: null,
        total_recipients: 0,
        delivered: 0,
        opened: 0,
        clicked: 0
      }])
      .select()
      .single()

    if (duplicateError) {
      return NextResponse.json({ error: 'Failed to duplicate campaign' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert([{
        organization_id: userData.organization_id,
        user_id: decoded.userId,
        action: 'campaign_duplicated',
        description: `Duplicated campaign "${originalCampaign.name}"`
      }])

    return NextResponse.json(duplicatedCampaign)

  } catch (error) {
    console.error('Duplicate campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}