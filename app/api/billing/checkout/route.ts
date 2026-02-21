import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { stripe, PLAN_PRICES } from '@/lib/stripe-billing';
import { getAdminClient } from '@/lib/supabase';

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { planId, billingCycle } = await req.json();

    const priceId = PLAN_PRICES[planId]?.[billingCycle];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const adminSupabase = getAdminClient();
    const { data: org } = await (adminSupabase as any)
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', context.orgId)
      .single();

    // Create Checkout Session
    // Note: Referral discounts (20% for both parties) are applied via webhook
    // after the first successful payment, not at checkout time.
    const session = await stripe.checkout.sessions.create({
      customer: (org as any)?.stripe_customer_id || undefined,
      customer_email: (org as any)?.stripe_customer_id ? undefined : context.email,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/failed`,
      metadata: {
        org_id: context.orgId,
        user_id: context.userId,
        plan_id: planId
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
