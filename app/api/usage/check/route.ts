// app/api/usage/check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { PLANS } from '@/lib/plans'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, monthly_emails_sent, status')
      .eq('user_id', user.id)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is okay for new users
      console.error('Subscription fetch error:', subError)
      throw subError
    }

    // Default to starter plan if no subscription exists
    const planId = subscription?.plan_id || 'starter'
    const plan = PLANS[planId as keyof typeof PLANS]
    
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`)
    }

    const monthlyLimit = plan.limits.monthlyEmails
    const currentUsage = subscription?.monthly_emails_sent || 0

    const canSend = currentUsage < monthlyLimit
    const remaining = Math.max(0, monthlyLimit - currentUsage)
    const percentageUsed = monthlyLimit > 0 
      ? Math.round((currentUsage / monthlyLimit) * 100) 
      : 0

    // Determine warning level
    let warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded' = 'safe'
    if (percentageUsed >= 100) {
      warningLevel = 'exceeded'
    } else if (percentageUsed >= 90) {
      warningLevel = 'critical'
    } else if (percentageUsed >= 75) {
      warningLevel = 'warning'
    }

    return NextResponse.json({
      canSend,
      remaining,
      used: currentUsage,
      limit: monthlyLimit,
      percentageUsed,
      warningLevel,
      planId,
      planName: plan.name,
      subscriptionStatus: subscription?.status || 'none'
    })
  } catch (error: any) {
    console.error('❌ Usage check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check usage' }, 
      { status: 500 }
    )
  }
}