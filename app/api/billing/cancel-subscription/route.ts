import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
 
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Get user subscription
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id, organization_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true
    })

    // Log billing event
    await supabase
      .from('billing_events')
      .insert([{
        organization_id: user.organization_id,
        event_type: 'subscription_cancel_requested',
        data: { subscription_id: user.stripe_subscription_id }
      }])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}