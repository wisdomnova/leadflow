import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { stripe, PLAN_PRICES, PLAN_ORDER } from '@/lib/stripe-billing';
import { getAdminClient } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { planId, billingCycle } = await req.json();

    const priceId = PLAN_PRICES[planId]?.[billingCycle];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or billing cycle' }, { status: 400 });
    }

    const adminSupabase = getAdminClient();
    const { data: org } = await (adminSupabase as any)
      .from('organizations')
      .select('subscription_id, stripe_customer_id, plan_tier')
      .eq('id', context.orgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // If no existing subscription, redirect to checkout instead
    if (!(org as any).subscription_id) {
      return NextResponse.json({ error: 'No active subscription to modify. Use checkout instead.', redirect: 'checkout' }, { status: 400 });
    }

    const currentTier = (org as any).plan_tier || 'starter';
    const currentIdx = PLAN_ORDER.indexOf(currentTier);
    const targetIdx = PLAN_ORDER.indexOf(planId);

    if (currentIdx === targetIdx) {
      return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 });
    }

    const isUpgrade = targetIdx > currentIdx;

    // Retrieve the current subscription
    const subscription = await stripe.subscriptions.retrieve((org as any).subscription_id);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json({ error: 'Could not find subscription item' }, { status: 500 });
    }

    // Update the subscription
    // Note: Stripe preserves existing referral coupons on plan changes automatically.
    const updateParams: any = {
      items: [{
        id: subscriptionItemId,
        price: priceId,
      }],
      // Upgrades: prorate immediately (user gets access right away, pays the difference)
      // Downgrades: take effect at end of current billing period
      proration_behavior: isUpgrade ? 'create_prorations' : 'none',
    };

    // For downgrades, don't apply until end of period
    if (!isUpgrade) {
      updateParams.proration_behavior = 'none';
    }

    await stripe.subscriptions.update((org as any).subscription_id, updateParams);

    // Update the org's plan_tier immediately for upgrades, 
    // for downgrades we still update now (features stay until period end via Stripe)
    await (adminSupabase as any)
      .from('organizations')
      .update({ 
        plan_tier: planId,
        // Also sync the legacy plan column
        plan: planId
      })
      .eq('id', context.orgId);

    // Send notification
    const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
    await createNotification({
      orgId: context.orgId,
      title: isUpgrade ? "Plan Upgraded" : "Plan Downgraded",
      description: isUpgrade 
        ? `You've been upgraded to the ${planName} plan. New features are available immediately!`
        : `Your plan has been changed to ${planName}. The change takes effect at the end of your current billing period.`,
      type: isUpgrade ? "success" : "info",
      category: "billing_alerts",
      link: "/dashboard/billing"
    });

    return NextResponse.json({ 
      success: true, 
      isUpgrade,
      newPlan: planId,
      message: isUpgrade 
        ? `Upgraded to ${planName}! Changes are effective immediately.`
        : `Downgraded to ${planName}. Your current plan features remain active until the end of this billing period.`
    });
  } catch (error: any) {
    console.error('Plan change error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
