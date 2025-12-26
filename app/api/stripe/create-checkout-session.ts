import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { PLANS } from '@/lib/plans'
import { calculateAffiliateTier } from '@/lib/affiliate-utils'
import { getOrCreateAffiliateCoupon } from '@/lib/stripe-affiliate-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, billingCycle = 'monthly', referralCode } = body

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing userId or planId' },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find the plan
    const plan = PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Free plan - no checkout needed
    if (planId === 'trial') {
      // Update user to trial plan
      const { error: trialError } = await supabase
        .from('users')
        .update({
          payment_status: 'completed',
          billing_cycle: 'none',
        })
        .eq('id', userId)

      if (trialError) {
        console.error('Error updating trial status:', trialError)
        return NextResponse.json(
          { error: 'Failed to update trial status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        sessionUrl: `/auth/email-setup`,
        free: true,
      })
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
          companyName: user.company_name,
        },
      })
      customerId = customer.id

      // Update user with stripe_customer_id
      const { error: customerUpdateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (customerUpdateError) {
        console.error('Error updating stripe_customer_id:', customerUpdateError)
        return NextResponse.json(
          { error: 'Failed to update customer ID' },
          { status: 500 }
        )
      }
    }

    // Get the price ID based on billing cycle
    const priceId = billingCycle === 'yearly' 
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not available for this plan' },
        { status: 400 }
      )
    }

    // Handle referral code if provided
    let couponId: string | undefined
    let affiliateId: string | undefined

    if (referralCode) {
      // Find affiliate by referral code
      const { data: affiliate, error: affiliateError } = await supabase
        .from('users')
        .select('id, affiliate_tier')
        .eq('referral_code', referralCode)
        .single()

      if (affiliate && affiliate.id !== userId) {
        // Valid affiliate referral
        affiliateId = affiliate.id

        // Link user to affiliate
        await supabase
          .from('users')
          .update({ referred_by: affiliateId })
          .eq('id', userId)

        // Get affiliate tier and discount
        const { data: tierData } = await supabase
          .from('affiliate_tiers')
          .select('discount_percentage, stripe_coupon_id')
          .eq('user_id', affiliateId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (tierData?.discount_percentage) {
          // Use existing coupon or create new one
          couponId =
            tierData.stripe_coupon_id ||
            (await getOrCreateAffiliateCoupon(tierData.discount_percentage, affiliate.affiliate_tier))

          // Record referral
          await supabase.from('affiliate_referrals').insert({
            affiliate_id: affiliateId,
            referred_user_id: userId,
            status: 'pending',
          })
        }
      }
    }

    // Build line items with optional coupon
    const lineItems: any[] = [
      {
        price: priceId,
        quantity: 1,
      },
    ]

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment-cancelled`,
      metadata: {
        userId: userId,
        planId: planId,
        billingCycle: billingCycle,
        affiliateId: affiliateId || '',
      },
      client_reference_id: userId,
    }

    // Add coupon if available
    if (couponId) {
      sessionConfig.discounts = [{ coupon: couponId }]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Update user payment status to processing
    const { error: processingError } = await supabase
      .from('users')
      .update({
        payment_status: 'processing',
        billing_cycle: billingCycle,
      })
      .eq('id', userId)

    if (processingError) {
      console.error('Error updating payment status:', processingError)
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
      discountApplied: !!couponId,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
