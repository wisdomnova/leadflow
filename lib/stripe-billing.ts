import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

/**
 * Centralized Stripe price ID configuration.
 * All price IDs are read from environment variables.
 */
export const PLAN_PRICES: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL || ''
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || ''
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || ''
  }
};

export const PLAN_ORDER = ['starter', 'pro', 'enterprise'];

/**
 * Get or create a custom coupon for an organization based on their affiliate discount
 */
export async function getOrCreateOrgCoupon(orgId: string, discountPercent: number) {
  if (discountPercent <= 0) return null;

  // Search for existing coupon for this org and discount
  const coupons = await stripe.coupons.list({ limit: 100 });
  const existing = coupons.data.find(
    (c) => c.metadata?.org_id === orgId && c.percent_off === discountPercent
  );

  if (existing) return existing.id;

  // Create new coupon
  const coupon = await stripe.coupons.create({
    duration: 'forever',
    percent_off: discountPercent,
    metadata: {
      org_id: orgId,
      purpose: 'affiliate_discount'
    },
    name: `${discountPercent}% Affiliate Discount`
  });

  return coupon.id;
}

/**
 * Manage active subscription when discount changes
 */
export async function updateSubscriptionDiscount(subscriptionId: string, couponId: string | null) {
  if (couponId) {
    await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }]
    });
  } else {
    // Remove all discounts
    await stripe.subscriptions.update(subscriptionId, {
      discounts: []
    });
  }
}
