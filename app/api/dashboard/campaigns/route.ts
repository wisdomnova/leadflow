// ./app/api/dashboard/campaigns/route.ts
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

    // Get campaigns with their contacts - SAME logic as your stats route
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        campaign_contacts(id, contact_id)
      `)
      .eq('organization_id', userData.organization_id)
      .limit(4) 

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json({ error: 'Failed to fetch campaign data' }, { status: 500 })
    }

    // Process campaigns for chart
    const campaignData = campaigns?.map(campaign => ({
      name: campaign.name,
      emails: campaign.campaign_contacts?.length || 0
    }))
    .filter(campaign => campaign.emails > 0)
    .sort((a, b) => b.emails - a.emails) || []

    return NextResponse.json(campaignData)

  } catch (error) {
    console.error('Dashboard campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}