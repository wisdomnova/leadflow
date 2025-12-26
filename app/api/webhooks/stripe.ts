import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { updateAffiliateTier, countActiveReferrals, updateReferralStatus } from '@/lib/affiliate-utils'
import { updateSubscriptionDiscount } from '@/lib/stripe-affiliate-utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const subscription = session.subscription as string

        if (userId && subscription) {
          // Get subscription details
          const sub = await stripe.subscriptions.retrieve(subscription)

          // Update user in database
          const { error: updateError } = await supabase
            .from('users')
            .update({
              payment_status: 'completed',
              stripe_subscription_id: subscription,
              subscription_current_period_end: new Date(
                (sub as any).current_period_end * 1000
              ).toISOString(),
            })
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating user after checkout:', updateError)
          } else {
            console.log(`Payment completed for user ${userId}`)

            // If referred by affiliate, mark referral as active after 30 days
            const { data: user } = await supabase
              .from('users')
              .select('referred_by')
              .eq('id', userId)
              .single()

            if (user?.referred_by) {
              // Update referral status to pending (will become active after 30 days)
              await supabase
                .from('affiliate_referrals')
                .update({ subscription_id: subscription, status: 'pending' })
                .eq('affiliate_id', user.referred_by)
                .eq('referred_user_id', userId)
            }
          }
        }
        break
      }

      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge
        const customerId = charge.customer as string

        if (customerId) {
          // Find user by stripe_customer_id
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!userError && user) {
            await supabase
              .from('users')
              .update({ payment_status: 'failed' })
              .eq('id', user.id)

            console.log(`Payment failed for user ${user.id}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (customerId) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, is_affiliate')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!userError && user) {
            await supabase
              .from('users')
              .update({
                subscription_current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
              })
              .eq('id', user.id)

            console.log(`Subscription updated for user ${user.id}`)

            // If user is an affiliate, recalculate tier
            if (user.is_affiliate) {
              const tierInfo = await updateAffiliateTier(user.id)
              console.log(
                `Affiliate tier updated for ${user.id}: ${tierInfo?.tier} (${tierInfo?.activeCount} referrals)`
              )

              // Apply new discount to their subscription if they have one
              if (tierInfo && subscription.id) {
                await updateSubscriptionDiscount(subscription.id, tierInfo.discountPercentage, tierInfo.tier)
              }
            }
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (customerId) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, is_affiliate')
            .eq('stripe_customer_id', customerId)
            .single()

          if (!userError && user) {
            await supabase
              .from('users')
              .update({
                payment_status: 'cancelled',
                stripe_subscription_id: null,
              })
              .eq('id', user.id)

            console.log(`Subscription cancelled for user ${user.id}`)

            // If user is referred by an affiliate, mark referral as churned
            const { data: referredUser } = await supabase
              .from('users')
              .select('referred_by')
              .eq('id', user.id)
              .single()

            if (referredUser?.referred_by) {
              await supabase
                .from('affiliate_referrals')
                .update({ status: 'churned' })
                .eq('affiliate_id', referredUser.referred_by)
                .eq('referred_user_id', user.id)

              // Recalculate affiliate tier since they lost a referral
              const tierInfo = await updateAffiliateTier(referredUser.referred_by)
              console.log(
                `Referral churned for affiliate ${referredUser.referred_by}, new tier: ${tierInfo?.tier}`
              )
            }

            // If user is an affiliate, recalculate their tier
            if (user.is_affiliate) {
              const tierInfo = await updateAffiliateTier(user.id)
              console.log(
                `Affiliate tier updated for ${user.id}: ${tierInfo?.tier} (${tierInfo?.activeCount} referrals)`
              )
            }
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
