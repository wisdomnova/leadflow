// ./app/api/cron/reset-quotas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting monthly quota reset job...')

    // Get all organizations with active subscriptions
    const { data: organizations, error: orgsError } = await supabase
      .from('organizations')
      .select(`
        id,
        subscription_status,
        plan_type,
        users!inner(id)
      `)
      .in('subscription_status', ['active', 'trialing'])

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    let resetCount = 0
    let errorCount = 0

    // Reset quotas for each organization
    for (const org of organizations) {
      try {
        // Reset organization-level quotas (if you have them)
        const { error: orgUpdateError } = await supabase
          .from('organizations')
          .update({
            emails_sent_this_month: 0,
            campaigns_created_this_month: 0,
            last_quota_reset: new Date().toISOString()
          })
          .eq('id', org.id)

        if (orgUpdateError) {
          console.error(`Error resetting org quota for ${org.id}:`, orgUpdateError)
          errorCount++
        }

        // Reset user-level quotas for users in this org
        for (const user of org.users) {
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({
              emails_sent_this_month: 0,
              last_quota_reset: new Date().toISOString()
            })
            .eq('id', user.id)

          if (userUpdateError) {
            console.error(`Error resetting user quota for ${user.id}:`, userUpdateError)
            errorCount++
          } else {
            resetCount++
          }
        }

      } catch (error) {
        console.error(`Error processing organization ${org.id}:`, error)
        errorCount++
      }
    }

    // Log the reset job to a system logs table (create if needed)
    try {
      await supabase
        .from('system_logs')
        .insert([{
          event_type: 'quota_reset',
          data: {
            reset_count: resetCount,
            error_count: errorCount,
            total_organizations: organizations.length
          },
          created_at: new Date().toISOString()
        }]);
    } catch (err) {
      // Ignore if system_logs table doesn't exist yet
      console.log('System logs table not available');
    }

    console.log(`✅ Monthly quota reset completed: ${resetCount} users reset, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      reset_count: resetCount,
      error_count: errorCount,
      total_organizations: organizations.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Monthly quota reset job failed:', error)
    return NextResponse.json({ error: 'Job failed' }, { status: 500 })
  }
}