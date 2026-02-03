import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth-utils';

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get stats from organizations and referrals
    const { data: org } = await context.supabase
      .from('organizations')
      .select('affiliate_link_code, current_discount_percent, is_affiliate_eligible')
      .eq('id', context.orgId)
      .single();

    if (!org?.is_affiliate_eligible) {
      return NextResponse.json({ 
        eligible: false,
        message: 'Your current plan does not include access to the Referral Program. Upgrade to Pro to unlock.'
      });
    }

    const { count: activeReferrals } = await context.supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_org_id', context.orgId)
      .eq('status', 'active');

    // 2. Clear current tier info
    const { data: tiers } = await context.supabase
      .from('affiliate_tier_config')
      .select('*')
      .order('referral_threshold', { ascending: true });

    let currentTier = tiers?.[0];
    let nextTier = null;

    for (let i = 0; i < (tiers?.length || 0); i++) {
        if ((activeReferrals || 0) >= tiers![i].referral_threshold) {
            currentTier = tiers![i];
            nextTier = tiers![i+1] || null;
        }
    }

    return NextResponse.json({
      affiliateCode: org?.affiliate_link_code,
      stats: {
        activeReferrals: activeReferrals || 0,
        currentDiscount: org?.current_discount_percent || 0,
        currentTierName: currentTier?.tier_name,
        nextTierName: nextTier?.tier_name,
        referralsToNext: nextTier ? (nextTier.referral_threshold - (activeReferrals || 0)) : 0,
        progress: nextTier ? ((activeReferrals || 0) / nextTier.referral_threshold) * 100 : 100
      }
    });

  } catch (error: any) {
    console.error('Affiliate Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
