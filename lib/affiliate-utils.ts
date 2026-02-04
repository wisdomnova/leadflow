import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Recalculate and update the affiliate discount for an organization
 */
export async function syncAffiliateDiscount(orgId: string) {
  // 1. Count active referrals
  const { data: referrals, error: refError } = await supabase
    .from('referrals')
    .select('id')
    .eq('affiliate_org_id', orgId)
    .eq('status', 'active');

  if (refError) throw refError;

  const activeCount = referrals?.length || 0;

  // 2. Determine tier
  const { data: config, error: configError } = await supabase
    .from('affiliate_tier_config')
    .select('*')
    .lte('min_referrals', activeCount)
    .order('min_referrals', { ascending: false })
    .limit(1);

  if (configError) throw configError;

  const discountPercent = config && config.length > 0 ? config[0].discount_percent : 0;

  // 3. Update organization
  const { error: updateError } = await (supabase as any)
    .from('organizations')
    .update({ current_discount_percent: discountPercent })
    .eq('id', orgId);

  if (updateError) throw updateError;

  return { activeCount, discountPercent, tier: config?.[0]?.name || 'Standard' };
}

/**
 * Link a new signup to its referrer
 */
export async function processReferral(newOrgId: string, referralCode: string) {
  // Find the referrer org
  const { data: referrer, error: findError } = await supabase
    .from('organizations')
    .select('id')
    .eq('referral_code', referralCode)
    .single();

  if (findError || !referrer) return null;

  // Avoid self-referral
  if (referrer.id === newOrgId) return null;

  // Create referral record
  const { data: referral, error: createError } = await (supabase as any)
    .from('referrals')
    .insert([{
      affiliate_org_id: (referrer as any).id,
      referred_org_id: newOrgId,
      status: 'pending' // Becomes active after first payment
    }] as any)
    .select()
    .single();

  if (createError) throw createError;

  // Update referred org
  await (supabase as any)
    .from('organizations')
    .update({ referred_by: referrer.id })
    .eq('id', newOrgId);

  return referral;
}
