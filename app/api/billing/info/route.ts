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

    // Get user subscription info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id, subscription_status, plan_type, billing_cycle')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get subscription details from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', user.stripe_subscription_id)
      .single()

    return NextResponse.json({
      subscription,
      nextBilling: subscription?.current_period_end || null,
      amount: getPlanAmount(user.plan_type, user.billing_cycle)
    })

  } catch (error) {
    console.error('Billing info error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 })
  }
}

function getPlanAmount(planType: string, billingCycle: string) {
  const prices = {
    starter: { monthly: 29, yearly: 290 },
    pro: { monthly: 79, yearly: 790 }
  }
  return prices[planType as keyof typeof prices]?.[billingCycle as keyof typeof prices.starter] || 0
}