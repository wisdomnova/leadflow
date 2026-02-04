import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { stripe } from '@/lib/stripe-billing';
import { getAdminClient } from '@/lib/supabase';

export async function POST() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminSupabase = getAdminClient();
    const { data: org } = await (adminSupabase as any)
      .from('organizations')
      .select('stripe_customer_id')
      .eq('id', context.orgId)
      .single();

    if (!(org as any)?.stripe_customer_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: (org as any).stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
