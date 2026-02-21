import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';
import { checkSubscription } from '@/lib/subscription-check';
import { getReferralStats } from '@/lib/affiliate-utils';

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sub = await checkSubscription(context.orgId);

    if (!sub.active || sub.tier === 'starter') {
      return NextResponse.json({ 
        eligible: false,
        message: 'The Referral Program is available on Pro and Enterprise plans. Upgrade to start earning discounts by referring others.'
      });
    }

    const stats = await getReferralStats(context.orgId);

    return NextResponse.json({
      eligible: true,
      ...stats
    });
  } catch (error: any) {
    console.error('Affiliate Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
