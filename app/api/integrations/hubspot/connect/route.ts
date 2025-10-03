// app/api/integrations/hubspot/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { HubSpotIntegrationService } from '@/lib/integrations/hubspot'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await supabase 
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Generate authorization URL
    const authUrl = HubSpotIntegrationService.getAuthorizationUrl(userData.organization_id)

    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('HubSpot connect error:', error)
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 })
  }
}