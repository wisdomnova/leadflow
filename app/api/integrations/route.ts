// app/api/integrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get all integrations for the organization
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select(`
        *,
        integration_providers(
          name,
          display_name, 
          description,
          logo_url,
          auth_type
        )
      `)
      .eq('organization_id', userData.organization_id)

    if (error) {
      throw new Error(`Failed to fetch integrations: ${error.message}`)
    }

    return NextResponse.json({ integrations: integrations || [] })

  } catch (error) {
    console.error('Failed to fetch integrations:', error)
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}