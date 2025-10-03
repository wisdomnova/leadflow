// app/api/integrations/salesforce/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

    const { data: provider } = await supabase
      .from('integration_providers')
      .select('id')
      .eq('name', 'salesforce')
      .single()

    if (provider) {
      await supabase
        .from('user_integrations')
        .update({ status: 'disconnected' })
        .eq('organization_id', userData.organization_id)
        .eq('provider_id', provider.id)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Salesforce disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}