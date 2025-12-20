import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

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
            .select('id')
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
            .select('id')
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
