import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { stripe } from '@/lib/stripe-billing';
import { getAdminClient } from '@/lib/supabase';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await req.json(); // 'cancel' or 'reactivate'

    const adminSupabase = getAdminClient();
    const { data: org } = await (adminSupabase as any)
      .from('organizations')
      .select('subscription_id, plan_tier')
      .eq('id', context.orgId)
      .single();

    if (!org || !(org as any).subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    if (action === 'cancel') {
      // Cancel at end of billing period (not immediately)
      await stripe.subscriptions.update((org as any).subscription_id, {
        cancel_at_period_end: true
      });

      // Update org status
      await (adminSupabase as any)
        .from('organizations')
        .update({ subscription_status: 'canceling' })
        .eq('id', context.orgId);

      const planName = ((org as any).plan_tier || 'current').charAt(0).toUpperCase() + ((org as any).plan_tier || 'current').slice(1);

      await createNotification({
        orgId: context.orgId,
        title: "Subscription Cancellation Scheduled",
        description: `Your ${planName} plan will be canceled at the end of your current billing period. You retain full access until then.`,
        type: "warning",
        category: "billing_alerts",
        link: "/dashboard/billing"
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Your subscription will be canceled at the end of the current billing period. You retain full access until then.'
      });
    } else if (action === 'reactivate') {
      // Undo the cancellation
      await stripe.subscriptions.update((org as any).subscription_id, {
        cancel_at_period_end: false
      });

      await (adminSupabase as any)
        .from('organizations')
        .update({ subscription_status: 'active' })
        .eq('id', context.orgId);

      const planName = ((org as any).plan_tier || 'current').charAt(0).toUpperCase() + ((org as any).plan_tier || 'current').slice(1);

      await createNotification({
        orgId: context.orgId,
        title: "Subscription Reactivated",
        description: `Great news! Your ${planName} plan has been reactivated and will continue as normal.`,
        type: "success",
        category: "billing_alerts",
        link: "/dashboard/billing"
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Your subscription has been reactivated!'
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "cancel" or "reactivate".' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Cancel/reactivate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
