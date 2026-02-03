import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { stripe } from '@/lib/stripe-billing';
import { getAdminClient } from '@/lib/supabase';

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminSupabase = getAdminClient();
    const { data: org, error } = await adminSupabase
      .from('organizations')
      .select('subscription_status, subscription_id, stripe_customer_id, current_discount_percent, trial_ends_at')
      .eq('id', context.orgId)
      .single();

    if (error || !org) {
      console.error("Subscription Fetch Error: Organization not found for ID:", context.orgId, error);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Determine effective status
    let effectiveStatus = org.subscription_status || 'none';
    const trialExpired = org.trial_ends_at ? new Date(org.trial_ends_at) < new Date() : true;

    if (effectiveStatus === 'trialing' && !trialExpired) {
      effectiveStatus = 'active'; // Treat active trial as active
    }

    let subscription: any = null;
    let invoices: any[] = [];
    let paymentMethod: any = null;

    if (org.subscription_id) {
      subscription = await stripe.subscriptions.retrieve(org.subscription_id, {
        expand: ['latest_invoice.payment_intent', 'default_payment_method']
      });

      if (subscription.default_payment_method) {
        const pm = subscription.default_payment_method as any;
        paymentMethod = {
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expiry: `${pm.card?.exp_month}/${pm.card?.exp_year % 100}`,
        };
      }
    }

    if (org.stripe_customer_id) {
        if (!paymentMethod) {
            const customer = await stripe.customers.retrieve(org.stripe_customer_id, {
                expand: ['default_payment_method']
            }) as any;
            if (customer.default_payment_method) {
                const pm = customer.default_payment_method;
                paymentMethod = {
                    brand: pm.card?.brand,
                    last4: pm.card?.last4,
                    expiry: `${pm.card?.exp_month}/${pm.card?.exp_year % 100}`,
                };
            }
        }
        const inv = await stripe.invoices.list({
            customer: org.stripe_customer_id,
            limit: 12
        });
        invoices = inv.data.map((i: any) => ({
            id: i.id,
            date: new Date(i.created * 1000).toLocaleDateString(),
            amount: `$${(i.amount_due / 100).toFixed(2)}`,
            status: i.status === 'paid' ? 'Paid' : 'Pending',
            pdf: i.invoice_pdf
        }));
    }

    return NextResponse.json({
      status: effectiveStatus,
      discount: org.current_discount_percent || 0,
      trial_ends_at: org.trial_ends_at,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        plan: (subscription as any).plan?.name || (subscription.items?.data?.[0]?.price as any)?.nickname || 'Standard Plan',
      } : null,
      paymentMethod,
      invoices
    });
  } catch (error: any) {
    console.error('Subscription Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
