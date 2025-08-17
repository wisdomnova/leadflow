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

    // Get user plan to determine limits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan_type, organization_id, subscription_status')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get contacts count
    const { count: contactsCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)

    // Get campaigns count for this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: campaignsCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)
      .gte('created_at', startOfMonth.toISOString())

    // Get emails sent this month (you'll implement this when you have campaigns)
    const emailsSent = 0 // Placeholder

    // Determine limits based on plan
    const limits = getPlanLimits(user.subscription_status === 'trial' ? 'trial' : user.plan_type)

    return NextResponse.json({
      contacts: {
        used: contactsCount || 0,
        limit: limits.contacts
      },
      campaigns: {
        used: campaignsCount || 0,
        limit: limits.campaigns
      },
      emails: {
        used: emailsSent,
        limit: limits.emails_per_month
      }
    })

  } catch (error) {
    console.error('Usage stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 })
  }
}

function getPlanLimits(plan: string) {
  const limits = {
    trial: {
      contacts: 100,
      campaigns: 3,
      emails_per_month: 500
    },
    starter: {
      contacts: 1000,
      campaigns: 10,
      emails_per_month: 5000
    },
    pro: {
      contacts: 10000,
      campaigns: 50,
      emails_per_month: 50000
    }
  }

  return limits[plan as keyof typeof limits] || limits.trial
}