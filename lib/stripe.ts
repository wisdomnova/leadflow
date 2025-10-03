import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export const STRIPE_PLANS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  }
}

export const PLAN_LIMITS = {
  trial: {
    contacts: 100,
    campaigns: 3,
    emails_per_month: 500
  }, 
  starter: {
    contacts: 1000,
    campaigns: 10,
    emails_per_month: 5000
  },
  pro: {
    contacts: 10000,
    campaigns: 50,
    emails_per_month: 50000
  }
}