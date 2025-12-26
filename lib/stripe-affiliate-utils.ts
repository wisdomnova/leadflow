import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
})

/**
 * Create or get Stripe coupon for affiliate tier
 * Format: AFFILIATE_{DISCOUNT}_{RANDOM}
 */
export async function getOrCreateAffiliateCoupon(
  discountPercentage: number,
  tier: string
): Promise<string | null> {
  try {
    // Generate coupon ID
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const couponId = `AFFILIATE_${discountPercentage}_${random}`

    // Try to create coupon
    const coupon = await stripe.coupons.create({
      id: couponId,
      percent_off: discountPercentage,
      duration: 'repeating',
      duration_in_months: 1, // Apply each month
      max_redemptions: 100, // Allow multiple uses
      metadata: {
        affiliate_tier: tier,
        discount_percentage: discountPercentage.toString(),
      },
    })

    return coupon.id
  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      // Coupon already exists, find and return it
      return findExistingAffiliateCoupon(discountPercentage, tier)
    }
    console.error('Error creating Stripe coupon:', error)
    return null
  }
}

/**
 * Find existing affiliate coupon by discount percentage and tier
 */
async function findExistingAffiliateCoupon(
  discountPercentage: number,
  tier: string
): Promise<string | null> {
  try {
    const coupons = await stripe.coupons.list({ limit: 100 })

    const matching = coupons.data.find(
      (c) =>
        c.percent_off === discountPercentage &&
        c.metadata?.affiliate_tier === tier &&
        !c.deleted
    )

    return matching?.id || null
  } catch (error) {
    console.error('Error finding existing coupon:', error)
    return null
  }
}

/**
 * Apply coupon to checkout session
 * Called when creating checkout with referral code
 */
export async function applyAffiliateDiscountToCheckout(
  sessionId: string,
  discountPercentage: number,
  tier: string
) {
  try {
    const couponId = await getOrCreateAffiliateCoupon(discountPercentage, tier)

    if (!couponId) {
      throw new Error('Could not create or find affiliate coupon')
    }

    // Note: Coupons are added to checkout sessions when creating them,
    // not after. This function is here for reference on how to manage coupons.
    // In practice, pass coupon_id when creating stripe.checkout.sessions.create()

    return couponId
  } catch (error) {
    console.error('Error applying affiliate discount:', error)
    return null
  }
}

/**
 * Apply coupon to existing subscription (for renewals)
 */
export async function applyAffiliateDiscountToSubscription(
  subscriptionId: string,
  discountPercentage: number,
  tier: string
) {
  try {
    const couponId = await getOrCreateAffiliateCoupon(discountPercentage, tier)

    if (!couponId) {
      throw new Error('Could not create or find affiliate coupon')
    }

    // Apply discount to subscription
    await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }],
    })

    return couponId
  } catch (error) {
    console.error('Error applying discount to subscription:', error)
    return null
  }
}

/**
 * Remove discount from subscription
 */
export async function removeAffiliateDiscountFromSubscription(subscriptionId: string) {
  try {
    await stripe.subscriptions.deleteDiscount(subscriptionId)
    return true
  } catch (error) {
    console.error('Error removing discount from subscription:', error)
    return false
  }
}

/**
 * Update subscription discount (e.g., when tier changes)
 */
export async function updateSubscriptionDiscount(
  subscriptionId: string,
  discountPercentage: number,
  tier: string
) {
  try {
    // Remove existing discount
    await removeAffiliateDiscountFromSubscription(subscriptionId)

    // Get new coupon
    const couponId = await getOrCreateAffiliateCoupon(discountPercentage, tier)

    if (!couponId) {
      throw new Error('Could not create or find affiliate coupon')
    }

    // Apply new discount
    await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }],
    })

    return couponId
  } catch (error) {
    console.error('Error updating subscription discount:', error)
    return null
  }
}
