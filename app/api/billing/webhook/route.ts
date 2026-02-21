import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe-billing';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed': {
      const { org_id, plan_id } = session.metadata;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      await (supabaseAdmin as any)
        .from('organizations')
        .update({
          subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          subscription_status: 'active',
          // Set plan_tier from checkout metadata
          ...(plan_id ? { plan_tier: plan_id, plan: plan_id } : {})
        })
        .eq('id', org_id);

      await createNotification({
        orgId: org_id,
        title: "Subscription Activated",
        description: "Your LeadFlow subscription is now active. Welcome aboard!",
        type: "success",
        category: "billing_alerts",
        link: "/dashboard/billing"
      });
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscriptionId = session.id;
      const status = session.status; // active, past_due, canceled, etc.
      const cancelAtPeriodEnd = session.cancel_at_period_end;

      // Determine the effective status for our DB
      // If subscription is active but set to cancel at period end, mark as 'canceling'
      const effectiveStatus = (status === 'active' && cancelAtPeriodEnd) ? 'canceling' : status;

      const updatePayload: any = {
        subscription_status: effectiveStatus
      };

      // If the subscription was deleted (actually canceled), reset plan to starter
      if (event.type === 'customer.subscription.deleted') {
        updatePayload.plan_tier = 'starter';
        updatePayload.plan = 'free';
        updatePayload.subscription_id = null;
      }

      const { data: org } = await (supabaseAdmin as any)
        .from('organizations')
        .update(updatePayload)
        .eq('subscription_id', subscriptionId)
        .select('id')
        .single();

      if (org) {
        if (effectiveStatus === 'active') {
          await createNotification({
            orgId: org.id,
            title: "Subscription Renewed",
            description: "Your subscription has been successfully renewed.",
            type: "success",
            category: "billing_alerts"
          });
        } else if (effectiveStatus === 'canceling') {
          await createNotification({
            orgId: org.id,
            title: "Cancellation Scheduled",
            description: "Your subscription will end at the close of your current billing period.",
            type: "warning",
            category: "billing_alerts",
            link: "/dashboard/billing"
          });
        } else if (status === 'canceled' || event.type === 'customer.subscription.deleted') {
          await createNotification({
            orgId: org.id,
            title: "Subscription Canceled",
            description: "Your subscription has ended. Upgrade anytime to regain access to premium features.",
            type: "warning",
            category: "billing_alerts",
            link: "/dashboard/billing"
          });
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      // Potentially notify user or lock account
      const subscriptionId = session.subscription;
      const { data: org } = await (supabaseAdmin as any)
        .from('organizations')
        .update({
          subscription_status: 'past_due'
        })
        .eq('subscription_id', subscriptionId)
        .select('id')
        .single();

      if (org) {
        await createNotification({
          orgId: org.id,
          title: "Payment Failed",
          description: "Your latest payment failed. Please update your payment method to avoid service interruption.",
          type: "error",
          category: "billing_alerts",
          link: "/dashboard/billing"
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const maxDuration = 60;
