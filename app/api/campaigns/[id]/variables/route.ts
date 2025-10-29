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

    // Get campaign variables
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, variables')
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      variables: campaign.variables || {}
    })

  } catch (error) {
    console.error('Get campaign variables error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const { variables } = await request.json()

    // Get user's organization  
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update campaign variables
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .update({ 
        variables: variables || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .eq('organization_id', userData.organization_id)
      .select()
      .single()

    if (campaignError) {
      return NextResponse.json({ error: 'Failed to update variables' }, { status: 500 })
    }

    return NextResponse.json({ 
      variables: campaign.variables || {}
    })

  } catch (error) {
    console.error('Update campaign variables error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
