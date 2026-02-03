import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { stripe, getOrCreateOrgCoupon } from '@/lib/stripe-billing';

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { planId, billingCycle } = await req.json();

    // 1. Get price ID from Plan ID
    const prices: Record<string, any> = {
      starter: {
        monthly: 'price_1Swi5eA7EYxH7wgxnMaixU3D', // replace with real IDs
        annual: 'price_1SwiAJA7EYxH7wgxeuygG8R1'
      },
      pro: {
        monthly: 'price_1Swi6KA7EYxH7wgxP8ry7ngN',
        annual: 'price_1SwiBAA7EYxH7wgxuLtQ57aQ'
      },
      enterprise: {
        monthly: 'price_1Swi6pA7EYxH7wgx5eiwVE50',
        annual: 'price_1SwiBqA7EYxH7wgxQVU5kZtf'
      }
    };

    const priceId = prices[planId]?.[billingCycle];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // 2. Check for affiliate discount
    const { data: org } = await context.supabase
      .from('organizations')
      .select('current_discount_percent, stripe_customer_id')
      .eq('id', context.orgId)
      .single();

    let discounts: any[] = [];
    if (org && org.current_discount_percent > 0) {
      const couponId = await getOrCreateOrgCoupon(context.orgId, org.current_discount_percent);
      if (couponId) {
        discounts = [{ coupon: couponId }];
      }
    }

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: org?.stripe_customer_id || undefined,
      customer_email: org?.stripe_customer_id ? undefined : context.email,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/failed`,
      discounts,
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
