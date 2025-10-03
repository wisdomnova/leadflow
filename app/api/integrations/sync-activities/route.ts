// app/api/integrations/sync-activities/route.ts
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

    // Get recent sync activities
    const { data: activities, error } = await supabase
      .from('sync_activity_logs')
      .select(`
        *,
        user_integrations!inner(
          integration_providers!inner(display_name)
        )
      `)
      .eq('organization_id', userData.organization_id) 
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(`Failed to fetch sync activities: ${error.message}`)
    }

    // Flatten the nested structure
    const formattedActivities = (activities || []).map(activity => ({
      ...activity,
      integration_providers: activity.user_integrations.integration_providers
    }))

    return NextResponse.json({ activities: formattedActivities })

  } catch (error) {
    console.error('Failed to fetch sync activities:', error)
    return NextResponse.json({ error: 'Failed to fetch sync activities' }, { status: 500 })
  }
}