// app/api/integrations/pipedrive/connect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { PipedriveIntegrationService } from '@/lib/integrations/pipedrive'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const authUrl = PipedriveIntegrationService.getAuthorizationUrl(userData.organization_id)
    return NextResponse.json({ authUrl })

  } catch (error) {
    console.error('Pipedrive connect error:', error)
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 })
  }
}