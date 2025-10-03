// app/api/integrations/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CRMSyncManager } from '@/lib/integrations/crm-sync-manager'

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

    const { contactIds } = await request.json()
 
    if (!contactIds || !Array.isArray(contactIds)) {
      return NextResponse.json({ error: 'Invalid contact IDs' }, { status: 400 })
    }

    // Trigger manual sync
    const result = await CRMSyncManager.manualSync(userData.organization_id, contactIds)

    return NextResponse.json({
      success: true,
      synced: result.success,
      failed: result.failed,
      errors: result.errors
    })

  } catch (error) {
    console.error('Manual sync failed:', error)
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}