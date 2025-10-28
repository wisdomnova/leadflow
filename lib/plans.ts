// lib/plans.ts
export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
    popular: false, // ✅ ADD THIS
    limits: {
      monthlyEmails: 10000,
      maxUsers: 1,
      contacts: 50000,
      campaigns: 'unlimited' as const,
      sendingDomains: 'unlimited' as const
    },
    features: [
      '1 user, unlimited sending domains',
      '10,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Email & chat support'
    ]
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 99,
    yearlyPrice: 990,
    monthlyPriceId: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.STRIPE_GROWTH_YEARLY_PRICE_ID!,
    popular: true, // ✅ ALREADY HERE
    limits: {
      monthlyEmails: 100000,
      maxUsers: 3,
      contacts: 500000,
      campaigns: 'unlimited' as const,
      sendingDomains: 'unlimited' as const
    },
    features: [
      '3 users, unlimited sending domains',
      '100,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Priority support (chat + email)'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    popular: false, // ✅ ADD THIS
    limits: {
      monthlyEmails: 500000,
      maxUsers: 10,
      contacts: 'unlimited' as const,
      campaigns: 'unlimited' as const,
      sendingDomains: 'unlimited' as const
    },
    features: [
      '10 users, unlimited sending domains',
      '500,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Dedicated account manager + premium support'
    ]
  }
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanById(planId: string): typeof PLANS[PlanId] | null {
  return PLANS[planId as PlanId] || null;
}

export function getPlanByPriceId(priceId: string): typeof PLANS[PlanId] | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.monthlyPriceId === priceId || plan.yearlyPriceId === priceId) {
      return plan;
    }
  }
  return null;
}

export function getDiscountPercentage(): number {
  const starter = PLANS.starter;
  const discount = ((starter.monthlyPrice * 12 - starter.yearlyPrice) / (starter.monthlyPrice * 12)) * 100;
  return Math.round(discount);
}