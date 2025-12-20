import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get subscription details from Stripe if exists
    let subscription = null
    let currentPlan = null

    if (user.stripe_subscription_id) {
      subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id, {
        expand: ['items.data.price.product'],
      })

      // Find the plan from subscription
      if (subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id
        
        // Get plan info from database
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('stripe_price_id_monthly', priceId)
          .or(`stripe_price_id_yearly.eq.${priceId}`)
          .single()

        currentPlan = plan
      }
    } else if (user.payment_status === 'completed' && !user.stripe_subscription_id) {
      // User is on trial
      const { data: trialPlan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', 'trial')
        .single()

      currentPlan = trialPlan
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        companyName: user.company_name,
      },
      subscription: {
        status: subscription?.status || (user.payment_status === 'completed' ? 'active' : 'inactive'),
        currentPeriodEnd: subscription ? new Date((subscription as any).current_period_end * 1000).toISOString() : user.subscription_current_period_end,
        billingCycle: user.billing_cycle || 'monthly',
        stripeSubscriptionId: user.stripe_subscription_id,
      },
      currentPlan: currentPlan ? {
        id: currentPlan.id,
        name: currentPlan.name,
        monthlyPrice: currentPlan.monthly_price,
        annualPrice: currentPlan.annual_price,
        emailsPerMonth: currentPlan.emails_per_month,
      } : null,
      paymentStatus: user.payment_status,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}
