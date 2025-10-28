// app/api/usage/stats/route.ts
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
    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get subscription with usage data
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, monthly_emails_sent, status, created_at')
      .eq('user_id', user.id)
      .single()

    const planId = subscription?.plan_id || 'starter'
    const plan = PLANS[planId as keyof typeof PLANS]
    
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`)
    }

    const monthlyLimit = plan.limits.monthlyEmails
    const currentUsage = subscription?.monthly_emails_sent || 0

    // Get contacts count
    const { count: contactsCount } = await supabase
      .from('contacts')
      .select('id', { count: 'exact' })
      .eq('organization_id', userData.organization_id)

    // Get campaigns count
    const { count: totalCampaigns } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .eq('organization_id', userData.organization_id)

    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active')

    // Get email accounts
    const { data: emailAccounts, count: totalAccounts } = await supabase
      .from('email_accounts')
      .select('status', { count: 'exact' })
      .eq('user_id', user.id)

    const activeAccounts = emailAccounts?.filter(
      acc => acc.status === 'active' || acc.status === 'warming_up'
    ).length || 0

    // Get this month's email statistics
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: emailStats } = await supabase
      .from('email_events')
      .select('event_type')
      .eq('organization_id', userData.organization_id)
      .gte('created_at', startOfMonth.toISOString())

    const eventCounts = emailStats?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate usage percentages
    const emailPercentage = monthlyLimit > 0 
      ? Math.round((currentUsage / monthlyLimit) * 100) 
      : 0

    const contactPercentage = typeof plan.limits.contacts === 'number' && plan.limits.contacts > 0
      ? Math.round(((contactsCount || 0) / plan.limits.contacts) * 100)
      : 0

    const campaignPercentage = typeof plan.limits.campaigns === 'number' && plan.limits.campaigns > 0
      ? Math.round(((totalCampaigns || 0) / plan.limits.campaigns) * 100)
      : 0

    return NextResponse.json({
      usage: {
        current: currentUsage,
        limit: monthlyLimit,
        remaining: Math.max(0, monthlyLimit - currentUsage),
        percentageUsed: emailPercentage
      },
      plan: {
        id: planId,
        name: plan.name,
        status: subscription?.status || 'trialing',
        limits: {
          monthlyEmails: plan.limits.monthlyEmails,
          contacts: plan.limits.contacts,
          campaigns: plan.limits.campaigns,
          maxUsers: plan.limits.maxUsers,
          sendingDomains: plan.limits.sendingDomains
        }
      },
      contacts: {
        used: contactsCount || 0,
        limit: plan.limits.contacts,
        percentageUsed: contactPercentage
      },
      campaigns: {
        total: totalCampaigns || 0,
        active: activeCampaigns || 0,
        limit: plan.limits.campaigns,
        percentageUsed: campaignPercentage
      },
      accounts: {
        total: totalAccounts || 0,
        active: activeAccounts,
        limit: plan.limits.sendingDomains
      },
      events: {
        sent: eventCounts['sent'] || 0,
        delivered: eventCounts['delivered'] || 0,
        opened: eventCounts['opened'] || 0,
        clicked: eventCounts['clicked'] || 0,
        replied: eventCounts['replied'] || 0,
        bounced: eventCounts['bounced'] || 0,
        unsubscribed: eventCounts['unsubscribed'] || 0
      },
      warnings: {
        emailsNearLimit: emailPercentage >= 90,
        contactsNearLimit: contactPercentage >= 90,
        campaignsNearLimit: campaignPercentage >= 90,
        accountsNearLimit: typeof plan.limits.sendingDomains === 'number' 
          ? (totalAccounts || 0) >= plan.limits.sendingDomains * 0.9
          : false
      }
    })
  } catch (error: any) {
    console.error('❌ Usage stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage stats' }, 
      { status: 500 }
    )
  }
}