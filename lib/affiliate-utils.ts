import { createClient } from '@supabase/supabase-js';
import { stripe } from './stripe-billing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REFERRAL_DISCOUNT_PERCENT = 20;

// ─── Blocked email domains (disposable/temp) ────────────────────────────────
const BLOCKED_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'discard.email', 'trashmail.com', 'fakeinbox.com', '10minutemail.com',
  'temp-mail.org', 'tempail.com', 'burnermail.io'
]);

/**
 * Anti-abuse checks for a new referral.
 * Returns { passed: boolean, reason?: string }
 */
export async function checkReferralAbuse(params: {
  referrerOrgId: string;
  referredOrgId: string;
  referredEmail: string;
  signupIp: string | null;
  signupFingerprint: string | null;
  signupUserAgent: string | null;
}): Promise<{ passed: boolean; reason?: string }> {
  const { referrerOrgId, referredOrgId, referredEmail, signupIp, signupFingerprint } = params;
  const emailDomain = referredEmail.split('@')[1]?.toLowerCase();

  // 1. Self-referral (same org)
  if (referrerOrgId === referredOrgId) {
    return { passed: false, reason: 'self_referral' };
  }

  // 2. Blocked disposable email domain
  if (emailDomain && BLOCKED_EMAIL_DOMAINS.has(emailDomain)) {
    return { passed: false, reason: 'disposable_email' };
  }

  // 3. IP collision — did the referrer sign up with the same IP?
  if (signupIp) {
    const { data: ipMatch } = await (supabase as any)
      .from('referrals')
      .select('id')
      .eq('referrer_org_id', referrerOrgId)
      .eq('signup_ip', signupIp)
      .neq('referred_org_id', referredOrgId)
      .limit(1);

    // If the referrer already referred someone from this same IP, flag it
    if (ipMatch && ipMatch.length > 0) {
      return { passed: false, reason: 'duplicate_ip' };
    }

    // Check if the referrer's own signup IP matches
    const { data: referrerOrg } = await (supabase as any)
      .from('referrals')
      .select('signup_ip')
      .eq('referred_org_id', referrerOrgId)
      .single();

    if (referrerOrg && referrerOrg.signup_ip === signupIp) {
      return { passed: false, reason: 'same_ip_as_referrer' };
    }
  }

  // 4. Fingerprint collision — same device used for multiple signups
  if (signupFingerprint) {
    const { data: fpMatch } = await (supabase as any)
      .from('referrals')
      .select('id')
      .eq('signup_fingerprint', signupFingerprint)
      .limit(1);

    if (fpMatch && fpMatch.length > 0) {
      return { passed: false, reason: 'duplicate_fingerprint' };
    }
  }

  // 5. Email domain clustering — >3 referrals from same domain = suspicious
  if (emailDomain) {
    const { count } = await (supabase as any)
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_org_id', referrerOrgId)
      .eq('signup_email_domain', emailDomain);

    if ((count || 0) >= 3) {
      return { passed: false, reason: 'email_domain_cluster' };
    }
  }

  // 6. Velocity check — >5 referrals in 24h is suspicious
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await (supabase as any)
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_org_id', referrerOrgId)
    .gte('created_at', dayAgo);

  if ((recentCount || 0) >= 5) {
    return { passed: false, reason: 'velocity_limit' };
  }

  return { passed: true };
}

/**
 * Create a pending referral when a new user signs up with a referral code.
 * Called from the signup API.
 */
export async function processReferral(
  newOrgId: string,
  referralCode: string,
  meta: {
    email: string;
    ip: string | null;
    fingerprint: string | null;
    userAgent: string | null;
  }
) {
  // 1. Find the referrer org by code
  const { data: referrer, error: findError } = await (supabase as any)
    .from('organizations')
    .select('id')
    .eq('referral_code', referralCode)
    .single();

  if (findError || !referrer) return null;

  const emailDomain = meta.email.split('@')[1]?.toLowerCase() || '';

  // 2. Run anti-abuse checks
  const abuseCheck = await checkReferralAbuse({
    referrerOrgId: referrer.id,
    referredOrgId: newOrgId,
    referredEmail: meta.email,
    signupIp: meta.ip,
    signupFingerprint: meta.fingerprint,
    signupUserAgent: meta.userAgent,
  });

  // 3. Create referral record (pending or flagged)
  const { data: referral, error: createError } = await (supabase as any)
    .from('referrals')
    .insert([{
      referrer_org_id: referrer.id,
      referred_org_id: newOrgId,
      referred_user_email: meta.email,
      signup_ip: meta.ip,
      signup_fingerprint: meta.fingerprint,
      signup_user_agent: meta.userAgent,
      signup_email_domain: emailDomain,
      status: abuseCheck.passed ? 'pending' : 'rejected',
      is_flagged: !abuseCheck.passed,
      flag_reason: abuseCheck.reason || null,
    }])
    .select()
    .single();

  if (createError) {
    console.error('[Referral] Failed to create referral:', createError);
    return null;
  }

  // 4. Link orgs
  await (supabase as any)
    .from('organizations')
    .update({ referred_by: referrer.id })
    .eq('id', newOrgId);

  return referral;
}

/**
 * Apply 20% discount to both parties after the referred user's first payment.
 * Called from the Stripe webhook on checkout.session.completed.
 */
export async function activateReferralReward(referredOrgId: string) {
  // 1. Find the pending referral for this org
  const { data: referral } = await (supabase as any)
    .from('referrals')
    .select('*')
    .eq('referred_org_id', referredOrgId)
    .eq('status', 'pending')
    .single();

  if (!referral) return null; // No pending referral or already rewarded

  // 2. One more abuse check — was it flagged?
  if (referral.is_flagged) {
    console.log(`[Referral] Skipping flagged referral ${referral.id}: ${referral.flag_reason}`);
    return null;
  }

  // 3. Get both orgs' Stripe subscription IDs
  const { data: referrerOrg } = await (supabase as any)
    .from('organizations')
    .select('id, subscription_id, stripe_customer_id')
    .eq('id', referral.referrer_org_id)
    .single();

  const { data: referredOrg } = await (supabase as any)
    .from('organizations')
    .select('id, subscription_id, stripe_customer_id')
    .eq('id', referral.referred_org_id)
    .single();

  if (!referrerOrg || !referredOrg) return null;

  // 4. Create & apply Stripe coupons
  let referrerCouponId: string | null = null;
  let referredCouponId: string | null = null;

  try {
    // Coupon for the referrer (20% off forever — stacks implicitly via Stripe by replacing the existing coupon)
    const referrerCoupon = await stripe.coupons.create({
      percent_off: REFERRAL_DISCOUNT_PERCENT,
      duration: 'forever',
      name: `Referral reward – referred ${referral.referred_user_email}`,
      metadata: { referral_id: referral.id, type: 'referrer' }
    });
    referrerCouponId = referrerCoupon.id;

    // Coupon for the referred user
    const referredCoupon = await stripe.coupons.create({
      percent_off: REFERRAL_DISCOUNT_PERCENT,
      duration: 'forever',
      name: `Welcome discount – referred by org ${referral.referrer_org_id}`,
      metadata: { referral_id: referral.id, type: 'referred' }
    });
    referredCouponId = referredCoupon.id;

    // Apply to referrer's subscription if they have one
    if (referrerOrg.subscription_id) {
      await stripe.subscriptions.update(referrerOrg.subscription_id, {
        discounts: [{ coupon: referrerCouponId }]
      });
    }

    // Apply to referred user's subscription (they just checked out, so they should have one)
    if (referredOrg.subscription_id) {
      await stripe.subscriptions.update(referredOrg.subscription_id, {
        discounts: [{ coupon: referredCouponId }]
      });
    }
  } catch (stripeError) {
    console.error('[Referral] Stripe coupon error:', stripeError);
    // Don't fail the whole webhook — mark as flagged for manual review
    await (supabase as any)
      .from('referrals')
      .update({ is_flagged: true, flag_reason: 'stripe_coupon_error' })
      .eq('id', referral.id);
    return null;
  }

  // 5. Mark referral as rewarded
  await (supabase as any)
    .from('referrals')
    .update({
      status: 'rewarded',
      rewarded_at: new Date().toISOString(),
      referrer_coupon_id: referrerCouponId,
      referred_coupon_id: referredCouponId,
    })
    .eq('id', referral.id);

  return { referral, referrerCouponId, referredCouponId };
}

/**
 * Get referral stats for an org's dashboard.
 */
export async function getReferralStats(orgId: string) {
  // Get org's referral code
  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('referral_code')
    .eq('id', orgId)
    .single();

  // Count referrals by status
  const { count: totalReferrals } = await (supabase as any)
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_org_id', orgId);

  const { count: rewardedCount } = await (supabase as any)
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_org_id', orgId)
    .eq('status', 'rewarded');

  const { count: pendingCount } = await (supabase as any)
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_org_id', orgId)
    .eq('status', 'pending');

  // Get referral list with details
  const { data: referrals } = await (supabase as any)
    .from('referrals')
    .select(`
      id,
      referred_user_email,
      status,
      is_flagged,
      created_at,
      rewarded_at,
      referred_org_id,
      organizations!referrals_referred_org_id_fkey (
        name,
        plan_tier,
        subscription_status
      )
    `)
    .eq('referrer_org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Was this org itself referred?
  const { data: myReferral } = await (supabase as any)
    .from('referrals')
    .select('status, referrer_org_id')
    .eq('referred_org_id', orgId)
    .single();

  return {
    referralCode: org?.referral_code || null,
    totalReferrals: totalReferrals || 0,
    rewarded: rewardedCount || 0,
    pending: pendingCount || 0,
    discountPercent: (rewardedCount || 0) > 0 ? REFERRAL_DISCOUNT_PERCENT : 0,
    referrals: (referrals || []).map((r: any) => ({
      id: r.id,
      email: r.referred_user_email,
      name: r.organizations?.name || r.referred_user_email.split('@')[0],
      plan: r.organizations?.plan_tier || 'starter',
      subscriptionStatus: r.organizations?.subscription_status || 'none',
      status: r.status,
      isFlagged: r.is_flagged,
      createdAt: r.created_at,
      rewardedAt: r.rewarded_at,
    })),
    wasReferred: !!myReferral,
    myReferralStatus: myReferral?.status || null,
  };
}
