export interface Plan {
  id: string
  name: string
  description: string
  price: number
  emails: number
  users: number
  features: string[]
  popular?: boolean
  badge?: string
  stripeProductId?: string
  stripePriceIdMonthly?: string
  stripePriceIdYearly?: string
}

export const PLANS: Plan[] = [
  {
    id: 'trial',
    name: 'Trial',
    description: 'Get started with Leadflow for free',
    price: 0,
    emails: 100,
    users: 1,
    features: [
      'Up to 100 contacts',
      'Basic email templates',
      'Limited campaigns',
      'Email support',
    ],
    stripeProductId: 'prod_TdQCRzBFbuvHTu',
    stripePriceIdMonthly: undefined,
    stripePriceIdYearly: undefined,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individual sales professionals',
    price: 29,
    emails: 10000,
    users: 1,
    features: [
      '1 user, unlimited sending domains',
      '10,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Email & chat support',
    ],
    stripeProductId: 'prod_TdQCRzBFbuvHTu',
    stripePriceIdMonthly: 'price_1Sg9MBA7EYxH7wgxGptKpuHu',
    stripePriceIdYearly: 'price_1Sg9PNA7EYxH7wgxuDYOLXyQ',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Best for growing sales teams',
    price: 99,
    emails: 100000,
    users: 3,
    features: [
      '3 users, unlimited sending domains',
      '100,000 emails/month',
      'Unlimited AI generator & personalization',
      'AI subject lines & follow-up suggestions',
      'Central inbox (Unibox)',
      'Advanced analytics dashboard',
      'Priority support (chat + email)',
    ],
    popular: true,
    badge: 'Most Popular',
    stripeProductId: 'prod_TdQDStBMM7UG04',
    stripePriceIdMonthly: 'price_1Sg9MzA7EYxH7wgx8gXPbni7',
    stripePriceIdYearly: 'price_1Sg9PmA7EYxH7wgxYjp7vTBw',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Enterprise-grade solution',
    price: 299,
    emails: 1000000,
    users: 10,
    features: [
      'Unlimited users & sending domains',
      'Unlimited emails/month',
      'Unlimited AI generator & personalization',
      'Advanced segmentation & automation',
      'Team collaboration & workflows',
      'Full analytics & reporting',
      'API access for integrations',
      'Dedicated account manager',
      'Priority 24/7 support',
      'Custom integrations',
    ],
    stripeProductId: 'prod_TdQDe5lTzymPYg',
    stripePriceIdMonthly: 'price_1Sg9NMA7EYxH7wgxF6JEmjMa',
    stripePriceIdYearly: 'price_1Sg9QAA7EYxH7wgxCe6Fo37k',
  },
]
