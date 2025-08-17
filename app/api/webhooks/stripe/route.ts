import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(request: NextRequest) { 
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log all events
    await supabase
      .from('billing_events')
      .insert([{
        organization_id: ('metadata' in event.data.object && event.data.object.metadata?.organizationId) || null,
        event_type: event.type,
        stripe_event_id: event.id,
        data: event.data.object
      }])

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, organizationId, planType, billingCycle } = session.metadata!

  // Update user subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      plan_type: planType,
      billing_cycle: billingCycle,
      stripe_subscription_id: session.subscription as string
    })
    .eq('id', userId)

  // Create subscription record
  await supabase
    .from('subscriptions')
    .insert([{
      organization_id: organizationId,
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: 'active',
      plan_type: planType,
      billing_cycle: billingCycle,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    }])
}

async function handlePaymentSucceeded(invoice: any) {
  if (!invoice.subscription) return

  // Update subscription status
  await supabase
    .from('users')
    .update({ subscription_status: 'active' })
    .eq('stripe_subscription_id', invoice.subscription)
}

async function handleSubscriptionUpdated(subscription: any) {
  const { organizationId } = subscription.metadata

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  // Update user status
  await supabase
    .from('users')
    .update({ subscription_status: subscription.status })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('users')
    .update({ 
      subscription_status: 'cancelled',
      stripe_subscription_id: null
    })
    .eq('stripe_subscription_id', subscription.id)

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}